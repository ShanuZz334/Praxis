import cron from "node-cron";
import axios from "axios";
import Instrument from "../models/Instrument.js";
import UpstoxAuth from "../models/UpstoxAuth.js";
import { computeFundamentalsForAI } from "../engine/fundamentalsEngine.js";
import db, { upsertAiCardStore, insertCardScoreHistory, getAiCardStoreHistory } from "../config/localDb.js";
import { fetchWithFallback } from "../utils/fetchWithFallback.js";
import { yahooFinanceService } from "../services/yahooFinanceService.js";
import { fredApiService } from "../services/fredApiService.js";
import { nseDataService } from "../services/nseDataService.js";
import { runTechnicalIntelligence, runOptionsIntelligence, runGlobalIntelligence, runEventsIntelligence, PRIORITY_INSTRUMENTS } from './backgroundIntelligenceService.js';
import { broadcast } from './socketBroadcast.js';
import { forceMarketDataPoll } from './upstoxMarketData.js';

const UPSTOX_FUNDAMENTALS_URL = "https://api.upstox.com/v2/fundamentals";

/**
 * Fetch raw fundamental data from Upstox for a specific ISIN.
 */
async function fetchRawFundamentals(isin, accessToken) {
    const headers = {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
    };

    // Concurrently fetch endpoints
    const endpoints = [
        axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/key-ratios`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/income-statement?type=consolidated&time_period=yearly&fs=true`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/balance-sheet?type=consolidated&fs=true`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/cash-flow?type=consolidated&fs=true`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/share-holdings`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/corporate-actions`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/profile`, { headers }).catch(() => ({ data: { data: {} } }))
    ];

    const [ratiosRes, incomeRes, balanceRes, cashRes, holdingsRes, corpRes, profileRes] = await Promise.all(endpoints);

    return {
        ratios: ratiosRes.data?.data || [],
        income: incomeRes.data?.data || {},
        balanceSheet: balanceRes.data?.data || {},
        cashFlow: cashRes.data?.data || {},
        holdings: holdingsRes.data?.data || [],
        corporate_actions: corpRes.data?.data || [],
        company_profile: profileRes.data?.data || {}
    };
}

import { getUpstoxLiveToken } from "../utils/upstoxAuthHelper.js";

let isRunningFund = false;

/**
 * Execute the Fundamental Intelligence pipeline.
 */
export const runFundamentalIntelligence = async (targetInstrument = null) => {
    if (isRunningFund) return;
    isRunningFund = true;
    console.log(`[FundIntel] Starting Headless Fundamental Intelligence Engine${targetInstrument ? ` (Target: ${targetInstrument})` : ''}...`);
    
    try {
        let token = null;
        try {
            token = await getUpstoxLiveToken();
        } catch (authErr) {
            console.warn("[FundIntel] Upstox token unavailable, continuing with external data & fallbacks:", authErr.message);
        }

        let trackedInstruments = [];
        if (targetInstrument) {
            let isin = targetInstrument.startsWith('NSE_EQ|') ? targetInstrument.replace('NSE_EQ|', '') : null;
            let symbol = targetInstrument.split('|').pop();
            try {
                const row = db.prepare('SELECT name, trading_symbol, isin FROM instruments WHERE instrument_key = ? OR isin = ? LIMIT 1').get(targetInstrument, isin || targetInstrument);
                if (row) {
                    if (row.isin) isin = row.isin;
                    if (row.trading_symbol || row.name) symbol = row.trading_symbol || row.name;
                }
            } catch {}
            trackedInstruments = [{
                instrumentKey: targetInstrument,
                isin,
                tradingSymbol: symbol
            }];
        } else {
            // 1. Resolve all tracked instruments from MongoDB + priority + user active keys
            const mongoInstruments = await Instrument.find({ isin: { $ne: null } }).catch(() => []);
            const trackedMap = new Map();
            
            for (const inst of mongoInstruments) {
                trackedMap.set(inst.instrumentKey, {
                    instrumentKey: inst.instrumentKey,
                    isin: inst.isin,
                    tradingSymbol: inst.tradingSymbol
                });
            }

            // Add priority instruments + user active instruments from SQLite
            const priorityKeys = [...PRIORITY_INSTRUMENTS, 'NSE_EQ|INE002A01018', 'NSE_EQ|INE040A01034'];
            try {
                const pageRows = db.prepare('SELECT state_json FROM page_state').all();
                for (const row of pageRows) {
                    try {
                        const state = JSON.parse(row.state_json);
                        if (state?.instrument) priorityKeys.push(state.instrument);
                        if (state?.selectedInstrument) priorityKeys.push(state.selectedInstrument);
                    } catch {}
                }
            } catch {}

            for (const key of new Set(priorityKeys)) {
                if (!key) continue;
                if (trackedMap.has(key)) continue;
                if (key.startsWith('NSE_EQ|')) {
                    const isin = key.replace('NSE_EQ|', '');
                    let row = null;
                    try {
                        row = db.prepare('SELECT name, trading_symbol FROM instruments WHERE instrument_key = ? OR isin = ? LIMIT 1').get(key, isin);
                    } catch {}
                    trackedMap.set(key, {
                        instrumentKey: key,
                        isin: isin,
                        tradingSymbol: row?.trading_symbol || row?.name || isin
                    });
                } else if (key.startsWith('NSE_INDEX|')) {
                    const name = key.replace('NSE_INDEX|', '');
                    trackedMap.set(key, {
                        instrumentKey: key,
                        isin: null,
                        tradingSymbol: name
                    });
                } else {
                    let row = null;
                    try {
                        row = db.prepare('SELECT instrument_key, isin, trading_symbol, name FROM instruments WHERE instrument_key = ? OR trading_symbol = ? OR name = ? LIMIT 1').get(key, key, key);
                    } catch {}
                    if (row) {
                        trackedMap.set(row.instrument_key, {
                            instrumentKey: row.instrument_key,
                            isin: row.isin,
                            tradingSymbol: row.trading_symbol || row.name
                        });
                    }
                }
            }
            trackedInstruments = [...trackedMap.values()];
        }
        console.log(`[FundIntel] Processing ${trackedInstruments.length} instruments for fundamental analysis.`);

        for (const instrument of trackedInstruments) {
            console.log(`[FundIntel] Processing ${instrument.tradingSymbol}...`);
            
            // 2. Fetch raw data from Upstox (if token and ISIN available) with SQLite cache fallback
            let rawData = { ratios: [], income: {}, balanceSheet: {}, cashFlow: {}, holdings: [], corporate_actions: [] };
            if (token && instrument.isin) {
                rawData = await fetchRawFundamentals(instrument.isin, token);
            }
            // If live statements are empty or incomplete, hydrate from SQLite fundamentals_data cache
            const hasLiveStatements = (rawData.income?.full_statement?.length > 0 || (Array.isArray(rawData.income) && rawData.income.length > 0));
            if (!hasLiveStatements) {
                try {
                    const cachedRow = db.prepare("SELECT raw_json FROM fundamentals_data WHERE instrument_key = ?").get(instrument.instrumentKey);
                    if (cachedRow?.raw_json) {
                        const parsed = JSON.parse(cachedRow.raw_json);
                        if (parsed.income) rawData.income = parsed.income;
                        if (parsed.balanceSheet) rawData.balanceSheet = parsed.balanceSheet;
                        if (parsed.cashFlow) rawData.cashFlow = parsed.cashFlow;
                        if (parsed.holdings && (!rawData.holdings || rawData.holdings.length === 0)) rawData.holdings = parsed.holdings;
                        if (parsed.corporate_actions && (!rawData.corporate_actions || rawData.corporate_actions.length === 0)) rawData.corporate_actions = parsed.corporate_actions;
                        if (parsed.ratios && (!rawData.ratios || rawData.ratios.length === 0)) rawData.ratios = parsed.ratios;
                        if (parsed.company_profile) rawData.company_profile = parsed.company_profile;
                    }
                } catch (cacheErr) {}
            }

            // 3. Fetch External Data with Fallbacks
            let symbol = instrument.tradingSymbol;
            if (instrument.isin) {
                const yfTicker = await yahooFinanceService.searchByIsin(instrument.isin).catch(() => null);
                if (yfTicker) {
                    symbol = yfTicker.replace('.NS', '').replace('.BO', '');
                }
            } else if (instrument.instrumentKey.includes('Nifty 50')) {
                symbol = '^NSEI';
            } else if (instrument.instrumentKey.includes('Nifty Bank')) {
                symbol = '^NSEBANK';
            }
            const ik = instrument.instrumentKey;
            const isIndex = ik.startsWith('NSE_INDEX|');
            
            const [
                fwdPeRes,
                vixRes,
                gdpRes,
                fiiRes,
                diiRes,
                analystConsensusRes
            ] = await Promise.all([
                isIndex ? Promise.resolve({ value: null, isFallback: false }) : fetchWithFallback(ik, 'forward_pe', () => yahooFinanceService.getForwardPE(symbol)),
                fetchWithFallback(ik, 'india_vix', () => yahooFinanceService.getVix()),
                fetchWithFallback(ik, 'gdp_growth', () => fredApiService.getGDPGrowth()),
                fetchWithFallback(ik, 'fii_flow', () => nseDataService.getFIIDIIFlows().then(d => d ? d.fiiFlow : null)),
                fetchWithFallback(ik, 'dii_flow', () => nseDataService.getFIIDIIFlows().then(d => d ? d.diiFlow : null)),
                isIndex ? Promise.resolve({ value: null, isFallback: false }) : fetchWithFallback(ik, 'analyst_consensus', () => yahooFinanceService.getAnalystConsensus(symbol))
            ]);

            rawData.externalData = {
                forwardPE: fwdPeRes.value,
                vix: vixRes.value,
                gdpGrowth: gdpRes.value,
                fiiFlow: fiiRes.value,
                diiFlow: diiRes.value,
                analystConsensus: analystConsensusRes.value
            };

            let currentMode = 'swing';
            try {
                const modeRow = db.prepare(
                    `SELECT pref_value FROM user_preferences WHERE pref_key IN ('praxis_trading_mode', 'stocky-trading-mode') ORDER BY updated_at DESC LIMIT 1`
                ).get();
                if (modeRow?.pref_value) currentMode = modeRow.pref_value.toLowerCase();
            } catch {}

            // 4. Run the Institutional Math Engine on the Backend
            const computedSnapshot = computeFundamentalsForAI(rawData, instrument.instrumentKey, isIndex ? 'Indices' : 'Companies', currentMode);

            // Regime Shift Detection (Delta vs Previous 12hr)
            let regimeShift = false;
            
            // Get previous header from SQLite
            const prevHeaders = getAiCardStoreHistory(instrument.instrumentKey, "Fundamental", "Header", "Summary", 0, 1);
            if (prevHeaders && prevHeaders.length > 0) {
                const prevSnapshot = prevHeaders[0];
                if (prevSnapshot && prevSnapshot.compositeScore !== null) {
                    if (prevSnapshot.compositeScore - computedSnapshot.compositeScore >= 15) {
                        regimeShift = true;
                        console.log(`[FundIntel] REGIME SHIFT DETECTED for ${instrument.tradingSymbol}! Score dropped from ${prevSnapshot.compositeScore} to ${computedSnapshot.compositeScore}`);
                    }
                }
            }

            const nowIso = new Date().toISOString();

            // Store structured "box by box" data in SQLite for AI
            // Build fundCounts map from card scores for Master Dashboard
            const fundCounts = {};
            if (computedSnapshot.cards && Array.isArray(computedSnapshot.cards)) {
                for (const card of computedSnapshot.cards) {
                    if (card.id && card.score != null) {
                        fundCounts[card.id] = card.score;
                    }
                }
            }

            // Guard: Check if existing header_data has a higher-card-count snapshot from the live FundamentalPage
            let finalCompositeScore = computedSnapshot.compositeScore;
            let finalCounts = fundCounts;
            let finalTreePayload = computedSnapshot.nestedTreePayload ? JSON.stringify(computedSnapshot.nestedTreePayload) : null;
            let finalRegime = JSON.stringify({ label: computedSnapshot.regime?.label || 'Neutral' });
            let finalTailwinds = JSON.stringify(computedSnapshot.tailwinds || []);
            let finalRisks = JSON.stringify(computedSnapshot.risks || []);

            try {
                const existingRow = db.prepare("SELECT composite_score, counts_json, regime_json, tailwinds_json, risks_json, tree_payload_json, updated_at FROM header_data WHERE instrument_key = ? AND category = 'fundamental'").get(instrument.instrumentKey);
                if (existingRow?.counts_json) {
                    const existingCounts = JSON.parse(existingRow.counts_json);
                    const existingCardCount = Object.keys(existingCounts || {}).length;
                    const newCardCount = Object.keys(fundCounts).length;
                    // If existing has high card count (>= 25) and was updated recently, and new has fewer cards, preserve existing higher-coverage score
                    if (existingCardCount > newCardCount && existingRow.composite_score != null && existingRow.composite_score > 0) {
                        const existingDate = new Date(existingRow.updated_at.includes('T') ? existingRow.updated_at : existingRow.updated_at.replace(' ', 'T') + 'Z');
                        if (!isNaN(existingDate.getTime()) && (Date.now() - existingDate.getTime()) < 86400000) {
                            finalCompositeScore = existingRow.composite_score;
                            finalCounts = existingCounts;
                            if (existingRow.tree_payload_json) finalTreePayload = existingRow.tree_payload_json;
                            if (existingRow.regime_json) finalRegime = existingRow.regime_json;
                            if (existingRow.tailwinds_json) finalTailwinds = existingRow.tailwinds_json;
                            if (existingRow.risks_json) finalRisks = existingRow.risks_json;
                            console.log(`[BG Fund] Preserving authoritative high-coverage snapshot (${existingCardCount} cards, score: ${finalCompositeScore}) for ${instrument.tradingSymbol}`);
                        }
                    }
                }
            } catch (guardErr) {}

            try {
                db.prepare(`
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
                `).run(
                    instrument.instrumentKey,
                    'fundamental',
                    finalCompositeScore,
                    finalRegime,
                    finalTailwinds,
                    finalRisks,
                    Object.keys(finalCounts).length > 0 ? JSON.stringify(finalCounts) : null,
                    finalTreePayload
                );
                console.log(`[BG Fund] Wrote FUND score ${finalCompositeScore} for ${instrument.tradingSymbol}`);
            } catch (err) {
                console.error("Failed to insert FUND score to header_data", err.message);
            }
            
            // A. Store Header Data (Scores, Tailwinds, Risks, Regime)
            upsertAiCardStore(
                instrument.instrumentKey, 
                "Fundamental", 
                "Header", 
                "Summary", 
                nowIso, 
                {
                    compositeScore: computedSnapshot.compositeScore,
                    regime: computedSnapshot.regime,
                    tailwinds: computedSnapshot.tailwinds,
                    risks: computedSnapshot.risks,
                    regimeShift: regimeShift
                }
            );

            // B. Store Sections Data
            upsertAiCardStore(
                instrument.instrumentKey,
                "Fundamental",
                "Sections",
                "List",
                nowIso,
                { sections: computedSnapshot.sections }
            );

            // C. Store Each Individual Card natively!
            for (const card of computedSnapshot.cards) {
                if (!card.id) {
                    console.error("[FundIntel] Card missing ID in Cron:", card);
                    continue;
                }
                upsertAiCardStore(
                    instrument.instrumentKey,
                    "Fundamental",
                    "Cards", // Generic section for cards
                    card.id, // e.g., 'pe_ratio'
                    nowIso,
                    card
                );

                const cScore = typeof card.score === 'number' ? card.score : null;
                const cNorm = typeof card.normalized === 'number' ? card.normalized : (cScore !== null ? (cScore > 70 ? 1 : cScore < 30 ? -1 : 0) : null);
                if (cScore !== null) {
                    insertCardScoreHistory(
                        instrument.instrumentKey,
                        "Fundamental",
                        "Cards",
                        card.id,
                        nowIso,
                        cNorm,
                        cScore
                    );
                }
            }

            broadcast('intelligence:snapshot', {
                instrument_key: instrument.instrumentKey,
                fundamental: {
                    composite_score: finalCompositeScore,
                    regime: computedSnapshot.regime?.label || 'Neutral',
                    counts: finalCounts,
                    tailwinds: computedSnapshot.tailwinds,
                    risks: computedSnapshot.risks
                }
            });

            console.log(`[FundIntel] Saved structured AI SQLite snapshot for ${instrument.tradingSymbol}`);

            // Rate limiting safety: Sleep 1 second between API bursts
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log("[FundIntel] Fundamental Intelligence Cycle Complete.");
    } catch (error) {
        console.error("[FundIntel] Error in Fundamental Intelligence Engine:", error.message);
    } finally {
        isRunningFund = false;
    }
};

/**
 * Initialize crons for the intelligence engine.
 * All 5 modules (Fundamental, Technical, Options, Global, Events) have background runners.
 * This ensures the Master Dashboard always has fresh scores regardless of which pages are open.
 */
export const initIntelligenceCrons = () => {
    // Fundamentals: Twice a day fixed (9:30 AM and 1:30 PM) + regular 15m cadence to keep data warm
    cron.schedule("30 9,13 * * *", () => {
        runFundamentalIntelligence().catch(e => console.error('[BG] Fund cron error:', e.message));
    });
    cron.schedule("*/15 * * * *", () => {
        runFundamentalIntelligence().catch(e => console.error('[BG] Fund cron error:', e.message));
    });

    // ── Mode-aware heartbeat cron ───────────────────────────────────────────
    // Runs every 30 seconds. Each runner checks its own shouldRun() guard which
    // reads the current trading mode from SQLite and enforces the right cadence:
    //
    //   Mode       | Technical | Events | Options | Global
    //   -----------|-----------|--------|---------|-------
    //   intraday   |  1 min    | 30 sec |  2 min  | 5 min
    //   swing      |  3 min    |  1 min |  5 min  | 10 min
    //   positional | 10 min    |  5 min | 15 min  | 30 min
    //
    // When the user changes mode in the UI it persists to SQLite immediately,
    // and the NEXT heartbeat tick picks up the new cadence automatically.
    cron.schedule("*/30 * * * * *", () => {
        // Run all modules continuously based on their internal shouldRun() cadence gates.
        // During market hours, live ticks update them; outside market hours, latest cached
        // candles/chain maintain warm, populated scores and cards for the dashboard.
        runTechnicalIntelligence(PRIORITY_INSTRUMENTS).catch(e => console.error('[BG] Tech error:', e.message));
        runOptionsIntelligence(PRIORITY_INSTRUMENTS).catch(e => console.error('[BG] Options error:', e.message));
        runGlobalIntelligence().catch(e => console.error('[BG] Global error:', e.message));
        runEventsIntelligence().catch(e => console.error('[BG] Events error:', e.message));
    });

    // Startup warm-up: bypass shouldRun() guards and force an immediate run on server start
    // 5s delay ensures SQLite is fully initialized and caches are seeded from disk
    setTimeout(() => {
        console.log('[BG Intel] Running startup warm-up for all modules...');
        // Force lastRun to 0 so guards always pass on warm-up
        runTechnicalIntelligence(PRIORITY_INSTRUMENTS).catch(e => console.error('BG Tech warmup:', e.message));
        runOptionsIntelligence(PRIORITY_INSTRUMENTS).catch(e => console.error('BG Opt warmup:', e.message));
        runGlobalIntelligence().catch(e => console.error('BG Global warmup:', e.message));
        runEventsIntelligence().catch(e => console.error('BG Events warmup:', e.message));
        runFundamentalIntelligence().catch(e => console.error('BG Fund warmup:', e.message));
    }, 5000);

    console.log("[Crons] Intelligence Crons initialized: Fundamentals (9:30AM, 1:30PM) | Mode-Aware Heartbeat (30s tick) -- Intraday/Swing/Positional cadences auto-applied");
};

/**
 * Force full-app synchronization across all 5 intelligence modules and Upstox market data.
 * Used by the UI Sync button to act as an all-in-one refresher + cron pipeline synchronizer.
 */
export async function forceFullAppSynchronization({ targetInstrument = null } = {}) {
    console.log(`[ForceSync] Initiating complete app synchronization${targetInstrument ? ` for ${targetInstrument}` : ''}...`);

    if (targetInstrument) {
        // Fast-path: Synchronize ONLY the target instrument synchronously (< 500ms)
        const [techRes, optRes, fundRes] = await Promise.allSettled([
            runTechnicalIntelligence([targetInstrument], true).catch(e => { console.warn('[ForceSync] Tech warn:', e.message); return null; }),
            runOptionsIntelligence([targetInstrument], true).catch(e => { console.warn('[ForceSync] Options warn:', e.message); return null; }),
            runFundamentalIntelligence(targetInstrument).catch(e => { console.warn('[ForceSync] Fundamental warn:', e.message); return null; })
        ]);

        const timestamp = new Date().toISOString();
        broadcast('app:sync:complete', {
            timestamp,
            targetInstrument,
            status: 'success'
        });
        console.log(`[ForceSync] Target instrument sync for ${targetInstrument} completed at ${timestamp}`);

        // Offload broader background tasks asynchronously without blocking HTTP response
        setImmediate(() => {
            forceMarketDataPoll().catch(e => console.warn('[ForceSync-BG] Market data poll warn:', e.message));
            runEventsIntelligence(true).catch(e => console.warn('[ForceSync-BG] Events warn:', e.message));
            runGlobalIntelligence(true).catch(e => console.warn('[ForceSync-BG] Global warn:', e.message));
            const remainingPriority = PRIORITY_INSTRUMENTS.filter(k => k !== targetInstrument);
            if (remainingPriority.length > 0) {
                runTechnicalIntelligence(remainingPriority, true).catch(e => console.warn('[ForceSync-BG] Tech warn:', e.message));
                runOptionsIntelligence(remainingPriority, true).catch(e => console.warn('[ForceSync-BG] Options warn:', e.message));
            }
        });

        return {
            success: true,
            timestamp,
            targetInstrument,
            modules: {
                technical: techRes.status === 'fulfilled',
                options: optRes.status === 'fulfilled',
                fundamental: fundRes.status === 'fulfilled'
            }
        };
    }

    // Default path when no targetInstrument is passed
    const [mktRes, techRes, optRes, fundRes, evtRes] = await Promise.allSettled([
        forceMarketDataPoll().catch(e => { console.warn('[ForceSync] Market data poll warn:', e.message); return null; }),
        runTechnicalIntelligence(PRIORITY_INSTRUMENTS, true).catch(e => { console.warn('[ForceSync] Tech warn:', e.message); return null; }),
        runOptionsIntelligence(PRIORITY_INSTRUMENTS, true).catch(e => { console.warn('[ForceSync] Options warn:', e.message); return null; }),
        runFundamentalIntelligence().catch(e => { console.warn('[ForceSync] Fundamental warn:', e.message); return null; }),
        runEventsIntelligence(true).catch(e => { console.warn('[ForceSync] Events warn:', e.message); return null; })
    ]);

    setImmediate(() => {
        runGlobalIntelligence(true).catch(e => console.warn('[ForceSync-BG] Global warn:', e.message));
    });

    const timestamp = new Date().toISOString();
    broadcast('app:sync:complete', {
        timestamp,
        targetInstrument: null,
        status: 'success'
    });
    console.log(`[ForceSync] Priority sync completed at ${timestamp}`);
    return {
        success: true,
        timestamp,
        modules: {
            marketData: mktRes.status === 'fulfilled',
            technical: techRes.status === 'fulfilled',
            options: optRes.status === 'fulfilled',
            fundamental: fundRes.status === 'fulfilled',
            events: evtRes.status === 'fulfilled'
        }
    };
}

