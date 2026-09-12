/**
 * @file backgroundIntelligenceService.js
 * @purpose Server-side background intelligence computation for all 5 Praxis modules.
 *
 * Runs headless composite score calculations for Technical, Options, Global, and Events
 * modules WITHOUT needing the frontend pages to be open. Results are written to SQLite
 * header_data, ai_card_store, card_score_history and broadcast via socket.io so the 
 * Master Dashboard gets live scores regardless of which pages are open.
 *
 * Mode-aware cadences (read from user_preferences SQLite row):
 *   Mode       | Technical | Events | Options | Global
 *   -----------|-----------|--------|---------|-------
 *   intraday   |  1 min    | 30 sec |  2 min  | 5 min
 *   swing      |  3 min    |  1 min |  5 min  | 10 min
 *   positional | 10 min    |  5 min | 15 min  | 30 min
 */

import db, { upsertAiCardStore, insertCardScoreHistory } from '../config/localDb.js';
import axios from 'axios';
import { syncCandlesIfStale } from './upstoxHistorical.js';
import { calculateTechnicals } from './technicalCalculationService.js';
import { broadcast } from './socketBroadcast.js';
import { computeTechnicalComposite } from '../../frontend/stock-look/src/features/dashboard/technical/engine/TechnicalCompositeEngine.js';
import { parseHeadlessTechnicals } from '../../frontend/stock-look/src/features/dashboard/technical/engine/headlessTechnicalParser.js';
import { computeOptionsInstitutionalComposite } from '../../frontend/stock-look/src/features/dashboard/options/engine/optionsScoringEngine.js';
import { computePortfolioMetrics } from '../../frontend/stock-look/src/shared/global/logic/eventsEngine.js';
import { computeGlobalComposite } from '../../frontend/stock-look/src/features/dashboard/foreign/engine/globalCompositeMath.js';
import { FOREIGN_WEIGHTS } from '../../frontend/stock-look/src/config/weights/foreignWeights.js';
import { scoreDXY, scoreUSDINR, scoreCrude, scoreGold, scoreSilver, scoreUS10Y, scoreSPFutures, scoreNasdaqFutures, scoreDowFutures, scoreVIX, scoreBitcoin, scoreEurusd, scoreUsdjpy, scoreNikkei, scoreFtse, scoreDax, scoreHangseng, scoreShanghai, scoreCac40, scoreEurostoxx, scoreCopper, scoreNatgas, scoreWheat, scoreAluminum, scoreMove } from '../../frontend/stock-look/src/features/dashboard/foreign/engine/globalScoringEngine.js';

import { fetchAndCacheGlobalData } from '../routes/dataRoutes.js';

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

// ── Last-run tracking & concurrency locks ───────────────────────────────────
const lastRun = { tech: 0, events: 0, options: 0, global: 0 };
const isRunning = { tech: false, events: false, options: false, global: false };
const BACKEND_PORT = process.env.PORT || 5000;

/**
 * Read the current trading mode from SQLite user_preferences.
 * Falls back to 'swing' if not set or not recognized.
 */
function getTradingMode() {
    try {
        const row = db.prepare(
            `SELECT pref_value FROM user_preferences WHERE pref_key IN ('praxis_trading_mode', 'stocky-trading-mode') ORDER BY updated_at DESC LIMIT 1`
        ).get();
        const mode = row?.pref_value?.toLowerCase();
        return (mode === 'intraday' || mode === 'swing' || mode === 'positional') ? mode : 'swing';
    } catch {
        return 'swing';
    }
}

function getTechnicalTimeframe() {
    try {
        const row = db.prepare(
            `SELECT pref_value FROM user_preferences WHERE pref_key = 'praxis_technical_timeframe' LIMIT 1`
        ).get();
        return row?.pref_value || '15minute';
    } catch {
        return '15minute';
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

        // Primary: read from page_state table
        try {
            const pageRows = db.prepare(`SELECT state_json FROM page_state`).all();
            for (const row of pageRows) {
                try {
                    const state = JSON.parse(row.state_json);
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

        // Tertiary: also pick up any instrument that has data in header_data
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
export async function runTechnicalIntelligence(instrumentKeys = PRIORITY_INSTRUMENTS, force = false) {
    if (!force && !shouldRun('tech')) return;
    if (isRunning.tech) return;
    isRunning.tech = true;
    try {
        const mode = getTradingMode();
        const timeframe = getTechnicalTimeframe();
        console.log(`[BG Intel] Running Technical Intelligence (mode: ${mode}, timeframe: ${timeframe}, force: ${force}) for ${instrumentKeys.length} instruments...`);
        const allKeys = [...new Set([...instrumentKeys, ...getUserSelectedInstruments()])];

        for (const instrumentKey of allKeys) {
            try {
                let techData = null;
                const rawRow = db.prepare(`
                    SELECT raw_json, (julianday('now') - julianday(updated_at)) * 24 * 60 AS age_minutes
                    FROM technicals_data WHERE instrument_key = ?
                `).get(instrumentKey);

                if (force || !rawRow || rawRow.age_minutes > 15) {
                    try {
                        const res = await axios.get(`http://127.0.0.1:${BACKEND_PORT}/api/v1/upstox/technicals?instrument=${encodeURIComponent(instrumentKey)}&timeframe=${encodeURIComponent(timeframe)}`, { timeout: 8000 });
                        techData = res.data?.data;
                    } catch (e) {
                        // fallback to cached raw_json if API failed
                        if (rawRow?.raw_json) {
                            try { techData = JSON.parse(rawRow.raw_json); } catch {}
                        }
                    }
                } else if (rawRow?.raw_json) {
                    try { techData = JSON.parse(rawRow.raw_json); } catch {}
                }

                let rawScores = null;
                if (techData) {
                    const currentPrice = techData.current_price;
                    const parsed = parseHeadlessTechnicals(techData, currentPrice);
                    rawScores = parsed?.scores;
                }

                // Fallback to cache row if full technicals_data was unavailable
                if (!rawScores || Object.keys(rawScores).length === 0) {
                    const cacheRow = db.prepare(`
                        SELECT rsi, macd_histogram, adx, supertrend_direction,
                               ema_20, ema_50, ema_200, sma_50, sma_200,
                               stoch_k, stoch_d, williams_r, cmf, obv, atr,
                               kc_upper, kc_lower, bb_upper, bb_lower, bb_middle
                        FROM technicals_cache WHERE instrument_key = ?
                    `).get(instrumentKey);
                    if (cacheRow) {
                        rawScores = buildTechScoresFromCache(cacheRow);
                    }
                }

                if (!rawScores || Object.keys(rawScores).length === 0) continue;

                const isIndex = instrumentKey.startsWith('NSE_INDEX');
                const composite = computeTechnicalComposite(rawScores, isIndex, mode);
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

                // Persist to ai_card_store & card_score_history
                const nowIso = new Date().toISOString();
                upsertAiCardStore(
                    instrumentKey,
                    "Technical",
                    "Header",
                    "Summary",
                    nowIso,
                    {
                        compositeScore: composite.compositeScore,
                        regime: composite.regime,
                        tailwinds,
                        risks
                    }
                );

                for (const [cardId, score] of Object.entries(rawScores)) {
                    if (score === null || score === undefined || isNaN(score)) continue;
                    const norm = score > 70 ? 1 : score < 30 ? -1 : 0;
                    upsertAiCardStore(instrumentKey, "Technical", "Cards", cardId, nowIso, { id: cardId, score, normalized: norm });
                    insertCardScoreHistory(instrumentKey, "Technical", "Cards", cardId, nowIso, norm, score);
                }

                broadcast('intelligence:snapshot', {
                    instrument_key: instrumentKey,
                    technical: { 
                        composite_score: composite.compositeScore, 
                        regime: composite.regime?.label || 'Neutral',
                        counts: rawScores,
                        tailwinds,
                        risks
                    }
                });

                console.log(`[BG Intel] TECH ${instrumentKey}: ${composite.compositeScore} (${composite.regime?.label})`);
            } catch (err) {
                console.error(`[BG Intel] Technical failed for ${instrumentKey}:`, err.message);
            }
        }
    } finally {
        isRunning.tech = false;
    }
}


function buildTechScoresFromCache(row) {
    const scores = {};

    if (row.rsi != null) {
        const rsi = parseFloat(row.rsi);
        scores.rsi = rsi > 70 ? 25 : rsi > 55 ? 65 : rsi > 45 ? 50 : rsi > 30 ? 35 : 75;
    }

    if (row.macd_histogram != null) {
        const hist = parseFloat(row.macd_histogram);
        scores.macd = hist > 0.5 ? 80 : hist > 0 ? 60 : hist > -0.5 ? 40 : 20;
    }

    if (row.adx != null) {
        const adx = parseFloat(row.adx);
        scores.adx = adx > 40 ? 80 : adx > 25 ? 65 : adx > 15 ? 50 : 35;
    }

    if (row.supertrend_direction != null) {
        scores.supertrend = parseFloat(row.supertrend_direction) > 0 ? 75 : 25;
    }

    if (row.ema_20 != null && row.ema_50 != null) {
        scores.ema_20 = parseFloat(row.ema_20) > parseFloat(row.ema_50) ? 70 : 30;
    }
    if (row.ema_50 != null && row.ema_200 != null) {
        scores.ema_50 = parseFloat(row.ema_50) > parseFloat(row.ema_200) ? 70 : 30;
    }
    if (row.ema_200 != null) scores.ema_200 = 50;

    if (row.sma_50 != null && row.sma_200 != null) {
        scores.sma_50  = parseFloat(row.sma_50) > parseFloat(row.sma_200) ? 70 : 30;
        scores.sma_200 = 50;
    }

    if (row.stoch_k != null) {
        const k = parseFloat(row.stoch_k);
        scores.stoch_rsi = k > 80 ? 25 : k > 60 ? 65 : k > 40 ? 50 : k > 20 ? 35 : 75;
    }

    if (row.williams_r != null) {
        const wr = parseFloat(row.williams_r);
        scores.williams_r = wr > -20 ? 25 : wr > -50 ? 50 : wr > -80 ? 65 : 80;
    }

    if (row.atr != null) scores.atr = 50;

    if (row.cmf != null) {
        const cmf = parseFloat(row.cmf);
        scores.cmf = cmf > 0.1 ? 75 : cmf > 0 ? 58 : cmf > -0.1 ? 42 : 25;
    }

    if (row.obv != null) scores.obv = 50;

    if (row.bb_upper != null && row.bb_lower != null && row.bb_middle != null) {
        const mid   = parseFloat(row.bb_middle);
        const width = parseFloat(row.bb_upper) - parseFloat(row.bb_lower);
        scores.bb_20_2 = mid > 0 && (width / mid) < 0.02 ? 35 : 50;
    }

    if (row.kc_upper != null && row.kc_lower != null) scores.kc = 50;

    return scores;
}

// ── Options Intelligence ──────────────────────────────────────────────────
export async function runOptionsIntelligence(instrumentKeys = PRIORITY_INSTRUMENTS, force = false) {
    if (!force && !shouldRun('options')) return;
    if (isRunning.options) return;
    isRunning.options = true;
    try {
        console.log(`[BG Intel] Running Options Intelligence (force: ${force})...`);
        const allKeys = [...new Set([...instrumentKeys, ...getUserSelectedInstruments()])];

        for (const instrumentKey of allKeys) {
            try {
                let row = db.prepare(`
                    SELECT total_call_oi, total_put_oi, pcr_oi, pcr_volume, atm_strike, spot_price, chain_json,
                           (julianday('now') - julianday(updated_at)) * 24 * 60 AS age_minutes
                    FROM options_cache WHERE instrument_key = ?
                `).get(instrumentKey);

                if (force || !row || !row.chain_json || row.age_minutes > 15) {
                    try {
                        const res = await axios.get(`http://127.0.0.1:${BACKEND_PORT}/api/v1/upstox/option-contracts?instrument_key=${encodeURIComponent(instrumentKey)}`, { timeout: 8000 });
                        const contracts = res.data?.data || res.data || [];
                        if (Array.isArray(contracts) && contracts.length > 0) {
                            const uniqueExpiries = [...new Set(contracts.map(c => c.expiry || c.expiry_date))]
                                .filter(Boolean)
                                .sort((a, b) => new Date(a) - new Date(b));

                            if (uniqueExpiries.length > 0) {
                                await axios.get(`http://127.0.0.1:${BACKEND_PORT}/api/v1/upstox/option-chain?instrument_key=${encodeURIComponent(instrumentKey)}&expiry_date=${encodeURIComponent(uniqueExpiries[0])}`, { timeout: 8000 });
                                row = db.prepare(`
                                    SELECT total_call_oi, total_put_oi, pcr_oi, pcr_volume, atm_strike, spot_price, chain_json
                                    FROM options_cache WHERE instrument_key = ?
                                `).get(instrumentKey);
                            }
                        }
                    } catch(e) {
                        // silently fail
                    }
                }

                if (!row) continue;

                let rawChain = null;
                if (row.chain_json) {
                    try { rawChain = JSON.parse(row.chain_json); } catch {}
                }
                if (!rawChain || !Array.isArray(rawChain) || rawChain.length === 0) {
                    const optDataRow = db.prepare(`
                        SELECT raw_json FROM options_data 
                        WHERE instrument_key LIKE ? 
                        ORDER BY updated_at DESC LIMIT 1
                    `).get(`chain_${instrumentKey}%`);
                    if (optDataRow?.raw_json) {
                        try { rawChain = JSON.parse(optDataRow.raw_json); } catch {}
                    }
                }

                if (!rawChain || !Array.isArray(rawChain) || rawChain.length === 0) continue;

                const spotPrice = parseFloat(row.spot_price) || parseFloat(rawChain[0]?.underlying_spot_price) || 0;

                const normalizedChain = rawChain.map(c => ({
                    strike: c.strike_price,
                    iv: parseFloat(c.call_options?.option_greeks?.iv) || 0,
                    call: {
                        oi: parseFloat(c.call_options?.market_data?.oi) || 0,
                        vol: parseFloat(c.call_options?.market_data?.volume) || 0,
                        oiChg: parseFloat(c.call_options?.market_data?.oi_change) || 0,
                        delta: parseFloat(c.call_options?.option_greeks?.delta) || 0,
                        gamma: parseFloat(c.call_options?.option_greeks?.gamma) || 0,
                        theta: parseFloat(c.call_options?.option_greeks?.theta) || 0,
                        vega: parseFloat(c.call_options?.option_greeks?.vega) || 0,
                        iv: parseFloat(c.call_options?.option_greeks?.iv) || 0
                    },
                    put: {
                        oi: parseFloat(c.put_options?.market_data?.oi) || 0,
                        vol: parseFloat(c.put_options?.market_data?.volume) || 0,
                        oiChg: parseFloat(c.put_options?.market_data?.oi_change) || 0,
                        delta: parseFloat(c.put_options?.option_greeks?.delta) || 0,
                        gamma: parseFloat(c.put_options?.option_greeks?.gamma) || 0,
                        theta: parseFloat(c.put_options?.option_greeks?.theta) || 0,
                        vega: parseFloat(c.put_options?.option_greeks?.vega) || 0,
                        iv: parseFloat(c.put_options?.option_greeks?.iv) || 0
                    }
                }));

                const optResult = computeOptionsInstitutionalComposite(normalizedChain, spotPrice, instrumentKey);
                if (!optResult || optResult.compositeScore == null) continue;

                const compositeScore = optResult.compositeScore;
                const optCounts = optResult.cardScores || {};

                const optTailwinds = (optResult.sections || [])
                    .filter(s => s.score !== null && s.score >= 60)
                    .sort((a, b) => ((b.score - 50) * b.weight) - ((a.score - 50) * a.weight))
                    .slice(0, 3)
                    .map(s => ({ id: s.id, label: s.label, value: s.score, sub: `${Math.round(s.weight * 100)}% weight` }));

                const optRisks = (optResult.sections || [])
                    .filter(s => s.score !== null && s.score <= 40)
                    .sort((a, b) => ((50 - b.score) * b.weight) - ((50 - a.score) * a.weight))
                    .slice(0, 3)
                    .map(s => ({ id: s.id, label: s.label, value: s.score, sub: `${Math.round(s.weight * 100)}% weight` }));

                upsertHeader.run(
                    instrumentKey, 'options',
                    compositeScore,
                    JSON.stringify({ label: optResult.regime?.label || 'Neutral' }),
                    JSON.stringify(optTailwinds),
                    JSON.stringify(optRisks),
                    JSON.stringify(optCounts),
                    null  // tree_payload_json
                );

                const nowIso = new Date().toISOString();
                upsertAiCardStore(
                    instrumentKey,
                    "Options",
                    "Header",
                    "Summary",
                    nowIso,
                    {
                        compositeScore,
                        regime: optResult.regime || { label: compositeScore > 60 ? 'Bullish' : compositeScore < 40 ? 'Bearish' : 'Neutral' },
                        tailwinds: optTailwinds,
                        risks: optRisks
                    }
                );

                for (const [cardId, score] of Object.entries(optCounts)) {
                    if (score === null || score === undefined || isNaN(score)) continue;
                    const norm = score > 70 ? 1 : score < 30 ? -1 : 0;
                    upsertAiCardStore(instrumentKey, "Options", "Cards", cardId, nowIso, { id: cardId, score, normalized: norm });
                    insertCardScoreHistory(instrumentKey, "Options", "Cards", cardId, nowIso, norm, score);
                }

                broadcast('intelligence:snapshot', {
                    instrument_key: instrumentKey,
                    options: { 
                        composite_score: compositeScore,
                        regime: optResult.regime?.label || 'Neutral',
                        counts: optCounts,
                        tailwinds: optTailwinds,
                        risks: optRisks
                    }
                });

                console.log(`[BG Intel] OPT ${instrumentKey}: Score ${compositeScore} (${optResult.regime?.label})`);
            } catch (err) {
                console.error(`[BG Intel] Options failed for ${instrumentKey}:`, err.message);
            }
        }
    } finally {
        isRunning.options = false;
    }
}

// ── Global Intelligence ──────────────────────────────────────────────────
export async function runGlobalIntelligence(force = false) {
    if (!force && !shouldRun('global')) return;
    if (isRunning.global) return;
    isRunning.global = true;
    console.log(`[BG Intel] Running Global Intelligence (force: ${force})...`);
    try {
        let rows = db.prepare(
            `SELECT symbol_id, value, hi_52, lo_52, (julianday('now') - julianday(fetched_at)) * 24 * 60 AS age_minutes FROM global_cache WHERE value IS NOT NULL`
        ).all();

        const isStale = !rows || rows.length === 0 || rows.some(r => r.age_minutes > 15);
        if (force || isStale) {
            console.log('[BG Intel] Refreshing fresh global market feeds (Yahoo/FRED/Crypto)...');
            await fetchAndCacheGlobalData().catch(e => console.error('[BG Intel] Failed to auto-fetch global feeds:', e.message));
            rows = db.prepare(
                `SELECT symbol_id, value, hi_52, lo_52 FROM global_cache WHERE value IS NOT NULL`
            ).all();
        }

        if (!rows || rows.length === 0) {
            console.warn('[BG Intel] No global_cache data found even after fetch — skipping.');
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

        const globCounts = {};
        for (const [sym, item] of Object.entries(globalScores)) {
            if (item?.score != null) globCounts[sym] = Math.round(item.score);
        }

        const globTailwinds = Object.entries(globalScores)
            .filter(([_, item]) => item.score >= 60)
            .sort((a, b) => b[1].score - a[1].score)
            .slice(0, 3)
            .map(([id, item]) => ({ id, label: id.toUpperCase().replace('_', ' '), value: Math.round(item.score), sub: 'Macro Tailwind' }));
        const globRisks = Object.entries(globalScores)
            .filter(([_, item]) => item.score <= 40)
            .sort((a, b) => a[1].score - b[1].score)
            .slice(0, 3)
            .map(([id, item]) => ({ id, label: id.toUpperCase().replace('_', ' '), value: Math.round(item.score), sub: 'Macro Risk' }));

        upsertHeader.run(
            'GLOBAL', 'global',
            result.compositeScore,
            JSON.stringify({ label: result.regime?.label || 'Neutral' }),
            JSON.stringify(globTailwinds),
            JSON.stringify(globRisks),
            JSON.stringify(globCounts),
            null  // tree_payload_json
        );

        const nowIso = new Date().toISOString();
        upsertAiCardStore(
            'GLOBAL_MACRO',
            "Global",
            "Header",
            "Summary",
            nowIso,
            {
                compositeScore: result.compositeScore,
                regime: result.regime,
                tailwinds: globTailwinds,
                risks: globRisks
            }
        );

        for (const [cardId, score] of Object.entries(globCounts)) {
            const norm = score > 70 ? 1 : score < 30 ? -1 : 0;
            upsertAiCardStore('GLOBAL_MACRO', "Global", "Cards", cardId, nowIso, { id: cardId, score, normalized: norm });
            insertCardScoreHistory('GLOBAL_MACRO', "Global", "Cards", cardId, nowIso, norm, score);
        }

        broadcast('intelligence:snapshot', {
            instrument_key: 'GLOBAL',
            global: { 
                composite_score: result.compositeScore, 
                regime: result.regime?.label || 'Neutral',
                counts: globCounts,
                tailwinds: globTailwinds,
                risks: globRisks
            }
        });

        console.log(`[BG Intel] GLOB: ${result.compositeScore} (${result.regime?.label})`);
    } catch (err) {
        console.error('[BG Intel] Global failed:', err.message);
    } finally {
        isRunning.global = false;
    }
}

// ── Events Intelligence ──────────────────────────────────────────────────
export async function runEventsIntelligence(force = false) {
    if (!force && !shouldRun('events')) return;
    if (isRunning.events) return;
    isRunning.events = true;
    console.log(`[BG Intel] Running Events Intelligence (force: ${force})...`);
    try {
        const newsItems = db.prepare(
            `SELECT * FROM market_events ORDER BY created_at DESC LIMIT 200`
        ).all();

        const formatted = (newsItems || []).map(r => {
            let assets = [];
            let keyPoints = [];
            if (r.affected_assets) { try { assets = JSON.parse(r.affected_assets); } catch (e) { assets = []; } }
            if (r.key_data_points)  { try { keyPoints = JSON.parse(r.key_data_points); } catch (e) { keyPoints = []; } }
            return {
                ...r,
                created_at: r.created_at ? (r.created_at.includes('Z') ? r.created_at : r.created_at.replace(' ', 'T') + 'Z') : new Date().toISOString(),
                affected_assets: assets,
                key_data_points: keyPoints
            };
        });

        const liveItems = formatted.filter(news => {
            const date = news.published_time ? new Date(news.published_time) : new Date(news.created_at || Date.now());
            const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
            const ttlMins = (Number(news.ttl_hours) || 72) * 60;
            return diffMins < ttlMins;
        });

        if (liveItems.length === 0) {
            console.log('[BG Intel] No active market events — persisting baseline Neutral (50) event state.');
            const score = 50;
            const evtCounts = {
                geopolitical: 50,
                macro_economic: 50,
                monetary_policy: 50
            };
            const nowIso = new Date().toISOString();
            upsertHeader.run(
                'GLOBAL', 'events',
                score,
                JSON.stringify({ label: 'Neutral' }),
                JSON.stringify([]),
                JSON.stringify([]),
                JSON.stringify(evtCounts),
                null
            );
            upsertAiCardStore(
                'GLOBAL',
                "Events",
                "Header",
                "Summary",
                nowIso,
                {
                    compositeScore: score,
                    regime: { label: 'Neutral' },
                    tailwinds: [],
                    risks: []
                }
            );
            broadcast('intelligence:snapshot', {
                instrument_key: 'EVENTS',
                events: {
                    composite_score: score,
                    regime: 'Neutral',
                    counts: evtCounts,
                    tailwinds: [],
                    risks: []
                }
            });
            return;
        }

        const tradingMode = getTradingMode();
        const metrics = computePortfolioMetrics(liveItems, tradingMode);
        if (!metrics || metrics.compositeScore == null) return;

        const score = Math.round(metrics.compositeScore);

        const evtCounts = {};
        if (Array.isArray(metrics.sections)) {
            metrics.sections.forEach(s => {
                if (s.id && s.score != null) evtCounts[s.id] = s.score;
            });
        }
        if (Object.keys(evtCounts).length === 0) {
            evtCounts.geopolitical = Math.round(score);
            evtCounts.macro_economic = Math.round(score);
            evtCounts.monetary_policy = Math.round(score);
        }

        const evtTailwinds = (liveItems || [])
            .filter(e => (e.event_score || 0) > 20)
            .slice(0, 3)
            .map(e => ({ id: String(e.id), label: e.headline?.substring(0, 40) || 'Positive Catalyst', value: Math.round(e.event_score || 60), sub: e.category || 'Macro' }));

        const evtRisks = (liveItems || [])
            .filter(e => (e.event_score || 0) < -20)
            .slice(0, 3)
            .map(e => ({ id: String(e.id), label: e.headline?.substring(0, 40) || 'Headwind Event', value: Math.round(Math.abs(e.event_score || 40)), sub: e.category || 'Macro' }));

        upsertHeader.run(
            'GLOBAL', 'events',
            score,
            JSON.stringify({ label: score > 60 ? 'Positive' : score < 40 ? 'Negative' : 'Neutral' }),
            JSON.stringify(evtTailwinds),
            JSON.stringify(evtRisks),
            JSON.stringify(evtCounts),
            null  // tree_payload_json
        );


        const nowIso = new Date().toISOString();
        upsertAiCardStore(
            'GLOBAL',
            "Events",
            "Header",
            "Summary",
            nowIso,
            {
                compositeScore: score,
                regime: { label: score > 60 ? 'Positive' : score < 40 ? 'Negative' : 'Neutral' },
                tailwinds: evtTailwinds,
                risks: evtRisks
            }
        );

        for (const [cardId, cScore] of Object.entries(evtCounts)) {
            const numScore = Number(cScore) || 50;
            const norm = numScore > 70 ? 1 : numScore < 30 ? -1 : 0;
            upsertAiCardStore('GLOBAL', "Events", "Cards", cardId, nowIso, { id: cardId, score: numScore, normalized: norm });
            insertCardScoreHistory('GLOBAL', "Events", "Cards", cardId, nowIso, norm, numScore);
        }

        broadcast('intelligence:snapshot', {
            instrument_key: 'GLOBAL',
            events: { 
                composite_score: score,
                regime: score > 60 ? 'Positive' : score < 40 ? 'Negative' : 'Neutral',
                counts: evtCounts,
                tailwinds: evtTailwinds,
                risks: evtRisks
            }
        });

        console.log(`[BG Intel] EVT: ${score} (${liveItems.length} live events, mode: ${tradingMode})`);
    } catch (err) {
        console.error('[BG Intel] Events failed:', err.message);
    } finally {
        isRunning.events = false;
    }
}
