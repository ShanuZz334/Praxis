/**
 * @file backgroundIntelligenceService.js
 * @purpose Server-side background intelligence computation for all 5 Praxis modules.
 *
 * Runs headless composite score calculations for Technical, Options, Global, and Events
 * modules WITHOUT needing the frontend pages to be open. Results are written to SQLite
 * header_data and broadcast via socket.io so the Master Dashboard gets live scores
 * regardless of which pages are open.
 *
 * Mode-aware cadences (read from user_preferences SQLite row):
 *   Mode       | Technical | Events | Options | Global
 *   -----------|-----------|--------|---------|-------
 *   intraday   |  1 min    | 30 sec |  2 min  | 5 min
 *   swing      |  3 min    |  1 min |  5 min  | 10 min
 *   positional | 10 min    |  5 min | 15 min  | 30 min
 */

import db from '../config/localDb.js';
import axios from 'axios';
import { syncCandlesIfStale } from './upstoxHistorical.js';
import { calculateTechnicals } from './technicalCalculationService.js';
import { broadcast } from './socketBroadcast.js';
import { computeTechnicalComposite } from '../../frontend/stock-look/src/features/dashboard/technical/engine/TechnicalCompositeEngine.js';
import { computePortfolioMetrics } from '../../frontend/stock-look/src/shared/global/logic/eventsEngine.js';
import { computeGlobalComposite } from '../../frontend/stock-look/src/features/dashboard/foreign/engine/globalCompositeMath.js';
import { FOREIGN_WEIGHTS } from '../../frontend/stock-look/src/config/weights/foreignWeights.js';
import { scoreDXY, scoreUSDINR, scoreCrude, scoreGold, scoreSilver, scoreUS10Y, scoreSPFutures, scoreNasdaqFutures, scoreDowFutures, scoreVIX, scoreBitcoin, scoreEurusd, scoreUsdjpy, scoreNikkei, scoreFtse, scoreDax, scoreHangseng, scoreShanghai, scoreCac40, scoreEurostoxx, scoreCopper, scoreNatgas, scoreWheat, scoreAluminum, scoreMove } from '../../frontend/stock-look/src/features/dashboard/foreign/engine/globalScoringEngine.js';

/**
 * Pure-JS weighted mean for global macro composite scoring.
 * Replaces the computeGlobalComposite import from useGlobalComposite.js which is a
 * React hook (imports useMemo, @/ aliases) and cannot run in Node.js.
 *
 * globalScores: { [symbol_id]: { score: number } }
 * Returns: { compositeScore: number, regime: { label: string } }
 */
function computeGlobalCompositeBackend(globalScores) {
    const entries = Object.values(globalScores).filter(e => e?.score != null && !isNaN(e.score));
    if (entries.length === 0) return { compositeScore: 50, regime: { label: 'Neutral' } };

    const total = entries.reduce((sum, e) => sum + e.score, 0);
    const composite = Math.round(total / entries.length);

    let label;
    if      (composite >= 75) label = 'Risk-On';
    else if (composite >= 60) label = 'Bullish';
    else if (composite >= 45) label = 'Neutral';
    else if (composite >= 30) label = 'Bearish';
    else                      label = 'Risk-Off';

    return { compositeScore: composite, regime: { label } };
}

// ── Priority instrument list (always computed in background) ────────────────
export const PRIORITY_INSTRUMENTS = [
    'NSE_INDEX|Nifty 50',
    'NSE_INDEX|Nifty Bank',
    'NSE_INDEX|Nifty IT',
    'NSE_INDEX|Nifty Auto',
    'NSE_INDEX|Nifty Pharma',
    'NSE_INDEX|Nifty Metal',
    'NSE_INDEX|Nifty FMCG',
];

// ── Mode-aware cadence map (milliseconds) ───────────────────────────────────
const MODE_CADENCES = {
    intraday:   { tech: 1 * 60 * 1000,  events: 30 * 1000,       options: 2 * 60 * 1000,  global: 5  * 60 * 1000 },
    swing:      { tech: 3 * 60 * 1000,  events: 1  * 60 * 1000,  options: 5 * 60 * 1000,  global: 10 * 60 * 1000 },
    positional: { tech: 10 * 60 * 1000, events: 5  * 60 * 1000,  options: 15 * 60 * 1000, global: 30 * 60 * 1000 },
};

// ── Last-run tracking (in-memory, reset on server restart) ──────────────────
const lastRun = { tech: 0, events: 0, options: 0, global: 0 };

/**
 * Read the current trading mode from SQLite user_preferences.
 * Falls back to 'swing' if not set or not recognized.
 * Key written by SettingsPage via PATCH /api/v1/preferences/settings → 'praxis_trading_mode'
 */
function getTradingMode() {
    try {
        const row = db.prepare(
            `SELECT pref_value FROM user_preferences WHERE pref_key = 'praxis_trading_mode' LIMIT 1`
        ).get();
        const mode = row?.pref_value?.toLowerCase();
        return (mode === 'intraday' || mode === 'swing' || mode === 'positional') ? mode : 'swing';
    } catch {
        return 'swing';
    }
}

/**
 * Guard: returns true if enough time has passed since the last run for this module,
 * given the current trading mode's cadence.
 */
function shouldRun(module) {
    const mode = getTradingMode();
    const cadence = MODE_CADENCES[mode]?.[module] ?? MODE_CADENCES.swing[module];
    const elapsed = Date.now() - lastRun[module];
    if (elapsed >= cadence) {
        lastRun[module] = Date.now();
        return true;
    }
    return false;
}

// ── Prepared statements ─────────────────────────────────────────────────────
const upsertHeader = db.prepare(`
    INSERT INTO header_data (
        instrument_key, category, composite_score, regime_json, 
        tailwinds_json, risks_json, counts_json, tree_payload_json, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(instrument_key, category) DO UPDATE SET
        composite_score = excluded.composite_score,
        regime_json = COALESCE(excluded.regime_json, header_data.regime_json),
        tailwinds_json = COALESCE(excluded.tailwinds_json, header_data.tailwinds_json),
        risks_json = COALESCE(excluded.risks_json, header_data.risks_json),
        counts_json = COALESCE(excluded.counts_json, header_data.counts_json),
        tree_payload_json = COALESCE(excluded.tree_payload_json, header_data.tree_payload_json),
        updated_at = CURRENT_TIMESTAMP
`);

// ── Helper: get user-selected instruments from preferences ──────────────────
function getUserSelectedInstruments() {
    try {
        const instruments = new Set(PRIORITY_INSTRUMENTS);

        // Primary: read from page_state table (where the app actually stores selected instrument per page)
        try {
            const pageRows = db.prepare(`SELECT state_json FROM page_state`).all();
            for (const row of pageRows) {
                try {
                    const state = JSON.parse(row.state_json);
                    // page_state stores it as 'instrument' (global page) or 'selectedInstrument' (other pages)
                    if (state?.instrument) instruments.add(state.instrument);
                    if (state?.selectedInstrument) instruments.add(state.selectedInstrument);
                } catch {}
            }
        } catch {}

        // Secondary: also check user_preferences for any older storage keys
        try {
            const prefRows = db.prepare(`SELECT pref_value FROM user_preferences WHERE pref_key LIKE 'page_state_%'`).all();
            for (const row of prefRows) {
                try {
                    const state = JSON.parse(row.pref_value);
                    if (state?.selectedInstrument) instruments.add(state.selectedInstrument);
                } catch {}
            }
        } catch {}

        // Tertiary: also pick up any instrument that has data in technicals_cache or header_data
        // so previously-visited instruments always get refreshed
        try {
            const cachedKeys = db.prepare(
                `SELECT DISTINCT instrument_key FROM header_data WHERE instrument_key NOT IN ('GLOBAL','EVENTS') LIMIT 50`
            ).all();
            for (const row of cachedKeys) instruments.add(row.instrument_key);
        } catch {}

        return [...instruments];
    } catch {
        return PRIORITY_INSTRUMENTS;
    }
}

// ── Technical Intelligence ──────────────────────────────────────────────────
/**
 * Computes technical composite scores for the given instrument keys.
 * Reads candle-based indicator results from technicals_cache (written by technicalsController).
 */
export async function runTechnicalIntelligence(instrumentKeys = PRIORITY_INSTRUMENTS) {
    if (!shouldRun('tech')) return; // mode-aware cadence gate
    const mode = getTradingMode();
    console.log(`[BG Intel] Running Technical Intelligence (mode: ${mode}) for ${instrumentKeys.length} instruments...`);
    const allKeys = [...new Set([...instrumentKeys, ...getUserSelectedInstruments()])];

    for (const instrumentKey of allKeys) {
        try {
            // ── EXACT column names from technicals_cache table ──────────────────────
            // macd_histogram (NOT macd_hist), stoch_k/stoch_d (NOT stoch_rsi_k/d),
            // obv (NOT obv_trend), bb_middle (NOT bb_mid)
            let row = db.prepare(`
                SELECT rsi, macd_histogram, adx, supertrend_direction,
                       ema_20, ema_50, ema_200, sma_50, sma_200,
                       stoch_k, stoch_d, williams_r, cmf, obv, atr,
                       kc_upper, kc_lower, bb_upper, bb_lower, bb_middle,
                       (julianday('now') - julianday(updated_at)) * 24 * 60 AS age_minutes
                FROM technicals_cache WHERE instrument_key = ?
            `).get(instrumentKey);

            if (!row || row.age_minutes > 15) {
                try {
                    await axios.get(`http://127.0.0.1:5000/api/v1/upstox/technicals?instrument=${instrumentKey}`);
                    row = db.prepare(`
                        SELECT rsi, macd_histogram, adx, supertrend_direction,
                               ema_20, ema_50, ema_200, sma_50, sma_200,
                               stoch_k, stoch_d, williams_r, cmf, obv, atr,
                               kc_upper, kc_lower, bb_upper, bb_lower, bb_middle
                        FROM technicals_cache WHERE instrument_key = ?
                    `).get(instrumentKey);
                } catch(e) {
                    // silently fail, continue with old row if it exists
                }
            }

            if (!row) continue;

            const rawScores = buildTechScoresFromCache(row);
            const isIndex = instrumentKey.startsWith('NSE_INDEX');
            const composite = computeTechnicalComposite(rawScores, isIndex);
            if (!composite || composite.compositeScore == null) continue;

            const tailwinds = (composite.sections || [])
                .filter(s => s.score !== null && s.score >= 60)
                .sort((a, b) => ((b.score - 50) * b.weight) - ((a.score - 50) * a.weight))
                .slice(0, 3)
                .map(s => ({ id: s.id, label: s.label, value: s.score, sub: `${Math.round(s.weight * 100)}% weight` }));

            const risks = (composite.sections || [])
                .filter(s => s.score !== null && s.score <= 40)
                .sort((a, b) => ((50 - b.score) * b.weight) - ((50 - a.score) * a.weight))
                .slice(0, 3)
                .map(s => ({ id: s.id, label: s.label, value: s.score, sub: `${Math.round(s.weight * 100)}% weight` }));

            upsertHeader.run(
                instrumentKey, 'technical',
                composite.compositeScore,
                JSON.stringify({ label: composite.regime?.label || 'Neutral' }),
                JSON.stringify(tailwinds),
                JSON.stringify(risks),
                JSON.stringify(rawScores || {}),
                JSON.stringify(composite.nestedTreePayload || {})
            );

            broadcast('intelligence:snapshot', {
                instrument_key: instrumentKey,
                technical: { composite_score: composite.compositeScore, regime: composite.regime?.label || 'Neutral' }
            });

            console.log(`[BG Intel] TECH ${instrumentKey}: ${composite.compositeScore}`);
        } catch (err) {
            console.error(`[BG Intel] Technical failed for ${instrumentKey}:`, err.message);
        }
    }
}

/**
 * Maps raw cached indicator column values → score buckets (0-100).
 * Keys MUST match CARD_REGISTRY ids (rsi, macd, adx, supertrend, ema_20, ema_50, ema_200,
 * sma_50, sma_200, stoch_rsi, williams_r, bb_20_2, atr, kc, obv, cmf).
 * Values MUST be plain numbers — computeTechnicalComposite does Number(scores[id]) directly.
 */
function buildTechScoresFromCache(row) {
    const scores = {};

    // RSI: oversold (<30) is contrarian bullish, overbought (>70) is contrarian bearish
    if (row.rsi != null) {
        const rsi = parseFloat(row.rsi);
        scores.rsi = rsi > 70 ? 25 : rsi > 55 ? 65 : rsi > 45 ? 50 : rsi > 30 ? 35 : 75;
    }

    // MACD Histogram — column: macd_histogram (NOT macd_hist)
    if (row.macd_histogram != null) {
        const hist = parseFloat(row.macd_histogram);
        scores.macd = hist > 0.5 ? 80 : hist > 0 ? 60 : hist > -0.5 ? 40 : 20;
    }

    // ADX: trend strength
    if (row.adx != null) {
        const adx = parseFloat(row.adx);
        scores.adx = adx > 40 ? 80 : adx > 25 ? 65 : adx > 15 ? 50 : 35;
    }

    // Supertrend direction: 1 = bullish, -1 or 0 = bearish
    if (row.supertrend_direction != null) {
        scores.supertrend = parseFloat(row.supertrend_direction) > 0 ? 75 : 25;
    }

    // EMA alignment
    if (row.ema_20 != null && row.ema_50 != null) {
        scores.ema_20 = parseFloat(row.ema_20) > parseFloat(row.ema_50) ? 70 : 30;
    }
    if (row.ema_50 != null && row.ema_200 != null) {
        scores.ema_50 = parseFloat(row.ema_50) > parseFloat(row.ema_200) ? 70 : 30;
    }
    if (row.ema_200 != null) scores.ema_200 = 50; // neutral — no current price to compare

    // SMA alignment
    if (row.sma_50 != null && row.sma_200 != null) {
        scores.sma_50  = parseFloat(row.sma_50) > parseFloat(row.sma_200) ? 70 : 30;
        scores.sma_200 = 50; // neutral — no current price to compare
    }

    // Stochastic RSI — columns: stoch_k, stoch_d (NOT stoch_rsi_k, stoch_rsi_d)
    if (row.stoch_k != null) {
        const k = parseFloat(row.stoch_k);
        scores.stoch_rsi = k > 80 ? 25 : k > 60 ? 65 : k > 40 ? 50 : k > 20 ? 35 : 75;
    }

    // Williams %R: near 0 = overbought, near -100 = oversold
    if (row.williams_r != null) {
        const wr = parseFloat(row.williams_r);
        scores.williams_r = wr > -20 ? 25 : wr > -50 ? 50 : wr > -80 ? 65 : 80;
    }

    // ATR: pure volatility, no directional signal → neutral
    if (row.atr != null) scores.atr = 50;

    // CMF: positive = accumulation (bullish)
    if (row.cmf != null) {
        const cmf = parseFloat(row.cmf);
        scores.cmf = cmf > 0.1 ? 75 : cmf > 0 ? 58 : cmf > -0.1 ? 42 : 25;
    }

    // OBV: column is 'obv' (NOT obv_trend). No delta available from cache → neutral
    if (row.obv != null) scores.obv = 50;

    // Bollinger Bands: key is bb_20_2 — use band width squeeze as signal
    if (row.bb_upper != null && row.bb_lower != null && row.bb_middle != null) {
        const mid   = parseFloat(row.bb_middle);
        const width = parseFloat(row.bb_upper) - parseFloat(row.bb_lower);
        scores.bb_20_2 = mid > 0 && (width / mid) < 0.02 ? 35 : 50;
    }

    // Keltner Channels: key is kc → neutral (no price context)
    if (row.kc_upper != null && row.kc_lower != null) scores.kc = 50;

    return scores;
}

// ── Options Intelligence ──────────────────────────────────────────────────
/**
 * Reads options_cache rows and computes a PCR-based composite score.
 * options_cache columns: total_call_oi, total_put_oi, pcr_oi, pcr_volume, atm_strike, spot_price
 */
export async function runOptionsIntelligence(instrumentKeys = PRIORITY_INSTRUMENTS) {
    if (!shouldRun('options')) return; // mode-aware cadence gate
    console.log('[BG Intel] Running Options Intelligence...');
    const allKeys = [...new Set([...instrumentKeys, ...getUserSelectedInstruments()])];

    for (const instrumentKey of allKeys) {
        try {
            let row = db.prepare(`
                SELECT total_call_oi, total_put_oi, pcr_oi, pcr_volume, atm_strike, spot_price,
                       (julianday('now') - julianday(updated_at)) * 24 * 60 AS age_minutes
                FROM options_cache WHERE instrument_key = ?
            `).get(instrumentKey);

            if (!row || row.age_minutes > 15) {
                try {
                    const res = await axios.get(`http://127.0.0.1:5000/api/v1/upstox/option-contracts?instrument_key=${instrumentKey}`);
                    const contracts = res.data?.data || res.data || [];
                    if (Array.isArray(contracts) && contracts.length > 0) {
                        const uniqueExpiries = [...new Set(contracts.map(c => c.expiry || c.expiry_date))]
                            .filter(Boolean)
                            .sort((a, b) => new Date(a) - new Date(b));

                        if (uniqueExpiries.length > 0) {
                            await axios.get(`http://127.0.0.1:5000/api/v1/upstox/option-chain?instrument_key=${instrumentKey}&expiry_date=${uniqueExpiries[0]}`);
                            row = db.prepare(`
                                SELECT total_call_oi, total_put_oi, pcr_oi, pcr_volume, atm_strike, spot_price
                                FROM options_cache WHERE instrument_key = ?
                            `).get(instrumentKey);
                        }
                    }
                } catch(e) {
                    // silently fail
                }
            }

            if (!row || row.total_call_oi == null || row.total_put_oi == null) continue;

            const pcrOi  = parseFloat(row.pcr_oi)     || 0;
            const pcrVol = parseFloat(row.pcr_volume)  || 0;

            // PCR scoring: >1 = bullish hedging (puts), <0.8 = bearish speculation (calls)
            const scorePCR = (pcr) => {
                if (pcr >= 1.5) return 85;
                if (pcr >= 1.2) return 72;
                if (pcr >= 1.0) return 58;
                if (pcr >= 0.8) return 42;
                if (pcr >= 0.6) return 28;
                return 15;
            };

            const compositeScore = Math.round(scorePCR(pcrOi) * 0.60 + scorePCR(pcrVol) * 0.40);

            // Staleness guard: if header_data already has a fresh options score written by the
            // Options page (via intelligence/sync → header_data), don't overwrite it with the
            // cron's simplified 2-input PCR formula. Page score is always more accurate.
            const existingOpt = db.prepare(`
                SELECT composite_score,
                       (julianday('now') - julianday(updated_at)) * 60 AS age_minutes
                FROM header_data WHERE instrument_key = ? AND category = 'options'
            `).get(instrumentKey);
            if (existingOpt && existingOpt.composite_score > 0 && existingOpt.age_minutes < 30) {
                console.log(`[BG Intel] OPT ${instrumentKey}: skipping cron write — fresh page score ${existingOpt.composite_score} exists (${Math.round(existingOpt.age_minutes)}m old)`);
                continue;
            }

            upsertHeader.run(
                instrumentKey, 'options',
                compositeScore,
                JSON.stringify({ label: compositeScore > 60 ? 'Bullish' : compositeScore < 40 ? 'Bearish' : 'Neutral' }),
                null, // tailwinds_json
                null, // risks_json
                null, // counts_json
                null  // tree_payload_json
            );

            broadcast('intelligence:snapshot', {
                instrument_key: instrumentKey,
                options: { composite_score: compositeScore }
            });

            console.log(`[BG Intel] OPT ${instrumentKey}: PCR_OI=${pcrOi.toFixed(2)} → Score ${compositeScore}`);
        } catch (err) {
            console.error(`[BG Intel] Options failed for ${instrumentKey}:`, err.message);
        }
    }
}

// ── Global Intelligence ──────────────────────────────────────────────────
/**
 * Reads global_cache rows and computes macro composite via computeGlobalComposite.
 *
 * global_cache columns: symbol_id, value, hi_52, lo_52, pct_change, source, fetched_at
 * NOTE: There is NO pre-computed 'score' column — we must score raw 'value' via pct_change.
 *
 * computeGlobalComposite expects: { [symbol_id]: { score: number } }
 * We approximate each symbol's score from its pct_change:
 *   pct_change > +2% → strong bullish, +0.5% → mild bullish, 0 → neutral, < -0.5% → bearish
 */
export async function runGlobalIntelligence() {
    if (!shouldRun('global')) return; // mode-aware cadence gate
    console.log('[BG Intel] Running Global Intelligence...');
    try {
        const rows = db.prepare(
            `SELECT symbol_id, value, hi_52, lo_52 FROM global_cache WHERE value IS NOT NULL`
        ).all();

        if (!rows || rows.length === 0) {
            console.warn('[BG Intel] No global_cache data found — skipping.');
            return;
        }

        const SCORE_MAP = {
            dxy: scoreDXY, usd_inr: scoreUSDINR, crude: scoreCrude, gold: scoreGold, silver: scoreSilver,
            us_10y_yield: scoreUS10Y, sp_futures: scoreSPFutures, nasdaq_futures: scoreNasdaqFutures, dow_futures: scoreDowFutures,
            vix: scoreVIX, bitcoin: scoreBitcoin, eurusd: scoreEurusd, usdjpy: scoreUsdjpy, nikkei: scoreNikkei,
            ftse: scoreFtse, dax: scoreDax, hangseng: scoreHangseng, shanghai: scoreShanghai, cac40: scoreCac40,
            eurostoxx: scoreEurostoxx, copper: scoreCopper, natgas: scoreNatgas, wheat: scoreWheat, aluminum: scoreAluminum, move: scoreMove
        };

        const globalScores = {};
        for (const row of rows) {
            const scorer = SCORE_MAP[row.symbol_id];
            if (scorer) {
                const res = scorer(row.value, { hi52: row.hi_52, lo52: row.lo_52 });
                if (res && res.score != null) {
                    globalScores[row.symbol_id] = { score: res.score };
                }
            }
        }

        if (Object.keys(globalScores).length === 0) return;

        const result = computeGlobalComposite(globalScores, FOREIGN_WEIGHTS);
        if (!result || result.compositeScore == null) return;

        // Staleness guard: skip cron write if the Global page recently wrote a fresh score.
        const existingGlob = db.prepare(`
            SELECT composite_score,
                   (julianday('now') - julianday(updated_at)) * 1440 AS age_minutes
            FROM header_data WHERE instrument_key = 'GLOBAL' AND category = 'global'
        `).get();
        console.log(`[BG Intel Debug] GLOB: existingGlob =`, existingGlob);
        if (existingGlob && existingGlob.composite_score > 0 && existingGlob.age_minutes < 30) {
            console.log(`[BG Intel] GLOB: skipping cron write — fresh page score ${existingGlob.composite_score} exists (${Math.round(existingGlob.age_minutes)}m old)`);
            return;
        }

        upsertHeader.run(
            'GLOBAL', 'global',
            result.compositeScore,
            JSON.stringify({ label: result.regime?.label || 'Neutral' }),
            null, // tailwinds_json
            null, // risks_json
            null, // counts_json
            null  // tree_payload_json
        );

        broadcast('intelligence:snapshot', {
            instrument_key: 'GLOBAL',
            global: { composite_score: result.compositeScore, regime: result.regime?.label || 'Neutral' }
        });

        console.log(`[BG Intel] GLOB: ${result.compositeScore} (${result.regime?.label})`);
    } catch (err) {
        console.error('[BG Intel] Global failed:', err.message);
    }
}

// ── Events Intelligence ──────────────────────────────────────────────────
/**
 * Reads the latest news events from market_events
 * and computes an events composite score using computePortfolioMetrics.
 */
export async function runEventsIntelligence() {
    if (!shouldRun('events')) return; // mode-aware cadence gate
    console.log('[BG Intel] Running Events Intelligence...');
    try {
        const newsItems = db.prepare(
            `SELECT * FROM market_events ORDER BY created_at DESC LIMIT 200`
        ).all();

        if (!newsItems || newsItems.length === 0) {
            console.warn('[BG Intel] No structured market events found — skipping events scoring.');
            return;
        }

        // Filter to live events (not expired based on TTL hours)
        const now = Date.now();
        const liveItems = newsItems.filter(n => {
            const date = n.published_time ? new Date(n.published_time) : new Date(n.created_at || now);
            const diffMins = (now - date.getTime()) / 60000;
            const ttlMins = (Number(n.ttl_hours) || 72) * 60;
            return diffMins < ttlMins;
        });

        if (liveItems.length === 0) return;

        // Use the actual current trading mode for event scoring
        const tradingMode = getTradingMode();
        const metrics = computePortfolioMetrics(liveItems, tradingMode);
        if (!metrics || metrics.compositeScore == null) return;

        const score = Math.round(metrics.compositeScore);

        upsertHeader.run(
            'GLOBAL', 'events',
            score,
            JSON.stringify({ label: score > 60 ? 'Positive' : score < 40 ? 'Negative' : 'Neutral' }),
            null, // tailwinds_json
            null, // risks_json
            null, // counts_json
            null  // tree_payload_json
        );

        broadcast('intelligence:snapshot', {
            instrument_key: 'GLOBAL',
            events: { composite_score: score }
        });

        console.log(`[BG Intel] EVT: ${score} (${liveItems.length} live events, mode: ${tradingMode})`);
    } catch (err) {
        console.error('[BG Intel] Events failed:', err.message);
    }
}

