import cron from "node-cron";
import axios from "axios";
import Instrument from "../models/Instrument.js";
import UpstoxAuth from "../models/UpstoxAuth.js";
import { computeFundamentalsForAI } from "../engine/fundamentalsEngine.js";
import db, { upsertAiCardStore, getAiCardStoreHistory } from "../config/localDb.js";
import { fetchWithFallback } from "../utils/fetchWithFallback.js";
import { yahooFinanceService } from "../services/yahooFinanceService.js";
import { fredApiService } from "../services/fredApiService.js";
import { nseDataService } from "../services/nseDataService.js";
import { runTechnicalIntelligence, runOptionsIntelligence, runGlobalIntelligence, runEventsIntelligence, PRIORITY_INSTRUMENTS } from './backgroundIntelligenceService.js';

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
        axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/share-holdings`, { headers }).catch(() => ({ data: { data: [] } }))
    ];

    const [ratiosRes, incomeRes, balanceRes, cashRes, holdingsRes] = await Promise.all(endpoints);

    return {
        ratios: ratiosRes.data?.data || [],
        income: incomeRes.data?.data || [],
        balanceSheet: balanceRes.data?.data || [],
        cashFlow: cashRes.data?.data || [],
        holdings: holdingsRes.data?.data || []
    };
}

import { getUpstoxLiveToken } from "../utils/upstoxAuthHelper.js";

/**
 * Execute the Fundamental Intelligence pipeline.
 */
export const runFundamentalIntelligence = async () => {
    console.log("🧠 Starting Headless Fundamental Intelligence Engine...");
    
    try {
        const token = await getUpstoxLiveToken();
        if (!token) {
            console.error("❌ Intelligence Engine aborted: Upstox not authenticated.");
            return;
        }

        // 1. Fetch only tracked instruments (Master Database)
        const trackedInstruments = await Instrument.find({ isin: { $ne: null } });
        console.log(`🔍 Found ${trackedInstruments.length} tracked instruments for fundamental analysis.`);

        for (const instrument of trackedInstruments) {
            console.log(`📊 Processing ${instrument.tradingSymbol}...`);
            
            // 2. Fetch raw data from Upstox
            const rawData = await fetchRawFundamentals(instrument.isin, token);

            // 3. Fetch External Data with Fallbacks
            const symbol = instrument.tradingSymbol;
            const ik = instrument.instrumentKey;
            
            const [
                fwdPeRes,
                vixRes,
                gdpRes,
                fiiRes,
                diiRes,
                analystConsensusRes
            ] = await Promise.all([
                fetchWithFallback(ik, 'forward_pe', () => yahooFinanceService.getForwardPE(symbol)),
                fetchWithFallback(ik, 'india_vix', () => yahooFinanceService.getVix()),
                fetchWithFallback(ik, 'gdp_growth', () => fredApiService.getGDPGrowth()),
                fetchWithFallback(ik, 'fii_flow', () => nseDataService.getFIIDIIFlows().then(d => d ? d.fiiFlow : null)),
                fetchWithFallback(ik, 'dii_flow', () => nseDataService.getFIIDIIFlows().then(d => d ? d.diiFlow : null)),
                fetchWithFallback(ik, 'analyst_consensus', () => yahooFinanceService.getAnalystConsensus(symbol))
            ]);

            rawData.externalData = {
                forwardPE: fwdPeRes.value,
                vix: vixRes.value,
                gdpGrowth: gdpRes.value,
                fiiFlow: fiiRes.value,
                diiFlow: diiRes.value,
                analystConsensus: analystConsensusRes.value
            };

            // 4. Run the Institutional Math Engine on the Backend
            const computedSnapshot = computeFundamentalsForAI(rawData, instrument.instrumentKey);

            // Regime Shift Detection (Delta vs Previous 12hr)
            let regimeShift = false;
            
            // Get previous header from SQLite
            const prevHeaders = getAiCardStoreHistory(instrument.instrumentKey, "Fundamental", "Header", "Summary", 0, 1);
            if (prevHeaders && prevHeaders.length > 0) {
                const prevSnapshot = prevHeaders[0];
                if (prevSnapshot && prevSnapshot.compositeScore !== null) {
                    if (prevSnapshot.compositeScore - computedSnapshot.compositeScore >= 15) {
                        regimeShift = true;
                        console.log(`⚠️ REGIME SHIFT DETECTED for ${instrument.tradingSymbol}! Score dropped from ${prevSnapshot.compositeScore} to ${computedSnapshot.compositeScore}`);
                    }
                }
            }

            const nowIso = new Date().toISOString();

            // 4. Store structured "box by box" data in SQLite for AI

            // --> Push to header_data so Master Dashboard has DB fallback!
            // GUARD: Only write cron score if the frontend engine hasn't written a fresh one recently.
            // The frontend FundamentalEngine.poll() writes the correct weighted composite score.
            // The cron uses a simplified average (fundamentalsEngine.js) which can differ.
            // We only overwrite if the existing row is stale (>30 min old) or doesn't exist.
            try {
                const existingRow = db.prepare(`
                    SELECT composite_score, updated_at,
                        (julianday('now') - julianday(updated_at)) * 24 * 60 AS age_minutes
                    FROM header_data WHERE instrument_key = ? AND category = 'fundamental'
                `).get(instrument.instrumentKey);

                const shouldWrite = !existingRow || existingRow.age_minutes > 30 || existingRow.composite_score === 0 || existingRow.composite_score === null;

                if (shouldWrite) {
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
                        computedSnapshot.compositeScore,
                        JSON.stringify({ label: computedSnapshot.regime?.label || 'Neutral' }),
                        JSON.stringify(computedSnapshot.tailwinds || []),
                        JSON.stringify(computedSnapshot.risks || []),
                        null, // counts_json (we don't have raw scores here)
                        null  // tree_payload_json
                    );
                    console.log(`[BG Fund] Wrote FUND score ${computedSnapshot.compositeScore} for ${instrument.tradingSymbol} (existing was ${existingRow?.composite_score ?? 'none'})`);
                } else {
                    console.log(`[BG Fund] Skipping FUND write for ${instrument.tradingSymbol} — frontend engine wrote ${existingRow.composite_score} ${Math.round(existingRow.age_minutes)}m ago`);
                }
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
                    console.error("❌ Card missing ID in Cron:", card);
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
            }

            console.log(`✅ Saved structured AI SQLite snapshot for ${instrument.tradingSymbol}`);

            // Rate limiting safety: Sleep 1 second between API bursts
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log("🏁 Fundamental Intelligence Cycle Complete.");
    } catch (error) {
        console.error("❌ Error in Fundamental Intelligence Engine:", error.message);
    }
};

/**
 * Initialize crons for the intelligence engine.
 * All 5 modules (Fundamental, Technical, Options, Global, Events) have background runners.
 * This ensures the Master Dashboard always has fresh scores regardless of which pages are open.
 */
export const initIntelligenceCrons = () => {
    // Fundamentals: 2 times a trading day (9:30 AM and 1:30 PM) — always fixed, not mode-dependent
    cron.schedule("30 9,13 * * *", () => {
        runFundamentalIntelligence();
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
        // Market-hours modules (Technical, Options) — Mon-Fri 9AM-3:30PM IST
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const day = now.getDay(); // 0=Sun, 6=Sat
        const isMarketHours = day >= 1 && day <= 5 && (hour > 9 || (hour === 9 && minute >= 15)) && hour < 16;

        if (isMarketHours) {
            runTechnicalIntelligence(PRIORITY_INSTRUMENTS).catch(e => console.error('[BG] Tech error:', e.message));
            runOptionsIntelligence(PRIORITY_INSTRUMENTS).catch(e => console.error('[BG] Options error:', e.message));
        }

        // Always-on modules (Global, Events)
        runGlobalIntelligence().catch(e => console.error('[BG] Global error:', e.message));
        runEventsIntelligence().catch(e => console.error('[BG] Events error:', e.message));
    });

    // Startup warm-up: bypass shouldRun() guards and force an immediate run on server start
    // 5s delay ensures SQLite is fully initialized and caches are seeded from disk
    setTimeout(() => {
        console.log('⏱️ BG Intel: Running startup warm-up for all modules...');
        // Force lastRun to 0 so guards always pass on warm-up
        runTechnicalIntelligence(PRIORITY_INSTRUMENTS).catch(e => console.error('BG Tech warmup:', e.message));
        runOptionsIntelligence(PRIORITY_INSTRUMENTS).catch(e => console.error('BG Opt warmup:', e.message));
        runGlobalIntelligence().catch(e => console.error('BG Global warmup:', e.message));
        runEventsIntelligence().catch(e => console.error('BG Events warmup:', e.message));
        runFundamentalIntelligence().catch(e => console.error('BG Fund warmup:', e.message));
    }, 5000);

    console.log("⏱️ Intelligence Crons initialized: Fundamentals (9:30AM, 1:30PM) | Mode-Aware Heartbeat (30s tick) — Intraday/Swing/Positional cadences auto-applied");
};
