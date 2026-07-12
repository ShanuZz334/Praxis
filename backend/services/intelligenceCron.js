import cron from "node-cron";
import axios from "axios";
import Instrument from "../models/Instrument.js";
import IntelligenceSnapshot from "../models/IntelligenceSnapshot.js";
import UpstoxAuth from "../models/UpstoxAuth.js";
import { computeFundamentalsForAI } from "../engine/fundamentalsEngine.js";

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

/**
 * Execute the Fundamental Intelligence pipeline.
 */
export const runFundamentalIntelligence = async () => {
    console.log("🧠 Starting Headless Fundamental Intelligence Engine...");
    
    try {
        const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
        if (!auth || !auth.accessToken) {
            console.error("❌ Intelligence Engine aborted: Upstox not authenticated.");
            return;
        }

        // 1. Fetch only tracked instruments (Master Database)
        const trackedInstruments = await Instrument.find({ isin: { $ne: null } });
        console.log(`🔍 Found ${trackedInstruments.length} tracked instruments for fundamental analysis.`);

        for (const instrument of trackedInstruments) {
            console.log(`📊 Processing ${instrument.tradingSymbol}...`);
            
            // 2. Fetch raw data from Upstox
            const rawData = await fetchRawFundamentals(instrument.isin, auth.accessToken);

            // 3. Run the Institutional Math Engine on the Backend
            const computedSnapshot = computeFundamentalsForAI(rawData, instrument.instrumentKey);

            // Regime Shift Detection (Delta vs Previous 12hr)
            let regimeShift = false;
            const prevSnapshot = await IntelligenceSnapshot.findOne({
                instrumentKey: instrument.instrumentKey,
                type: "fundamental"
            }).sort({ timestamp: -1 });

            if (prevSnapshot && prevSnapshot.compositeScore !== null) {
                if (prevSnapshot.compositeScore - computedSnapshot.compositeScore >= 15) {
                    regimeShift = true;
                    console.log(`⚠️ REGIME SHIFT DETECTED for ${instrument.tradingSymbol}! Score dropped from ${prevSnapshot.compositeScore} to ${computedSnapshot.compositeScore}`);
                }
            }

            // 4. Store structured "box by box" data in MongoDB for AI
            const snapshot = new IntelligenceSnapshot({
                instrumentKey: instrument.instrumentKey,
                instrumentType: instrument.instrumentType || 'Companies',
                type: "fundamental",
                timestamp: new Date(), // Exactly when calculated
                compositeScore: computedSnapshot.compositeScore,
                regime: computedSnapshot.regime,
                sections: computedSnapshot.sections,
                tailwinds: computedSnapshot.tailwinds,
                risks: computedSnapshot.risks,
                cards: computedSnapshot.cards,
                regimeShift: regimeShift
            });

            await snapshot.save();
            console.log(`✅ Saved structured AI snapshot for ${instrument.tradingSymbol}`);

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
 */
export const initIntelligenceCrons = () => {
    // Fundamentals: 2 times a trading day (9:30 AM and 1:30 PM)
    cron.schedule("30 9,13 * * *", () => {
        runFundamentalIntelligence();
    });

    // Technicals: Every 15 minutes during market hours (09:15 to 15:30)
    // cron.schedule("*/15 9-15 * * 1-5", () => {
    //     runTechnicalIntelligence(); 
    // });

    console.log("⏱️ Intelligence Crons initialized: Fundamentals (10AM, 4PM)");
};
