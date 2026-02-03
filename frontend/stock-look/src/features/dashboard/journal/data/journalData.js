/**
 * @file journalData.js
 * @purpose Mock data provider for the Trading Journal feature.
 * @responsibilities
 * - Provides static mock data for development and testing.
 * - Includes Account, Score, Context, Trades, Notes, Analytics, and Psychology data.
 * @key_exports
 * - MOCK_JOURNAL_DATA
 * @dependencies
 * - None
 * @lifecycle
 * - Imported by JournalPage and other components to populate the UI.
 * @date 2026-02-03
 */

// =============================
// Mock Data Configuration
// =============================

export const MOCK_JOURNAL_DATA = {
    // --- Account Metrics ---
    account: {
        capital: 78000,
        openRiskPct: 1.2,
        maxDrawdown: -3.1,
        winRate: 64,
        avgRR: 1.8
    },

    // --- Execution Quality ---
    executionScore: {
        score: 82,
        grade: "A-",
        breakdown: {
            ruleAdherence: 90,
            entryTiming: 75,
            exitDiscipline: 85,
            riskSizing: 95,
            emotionalStability: 70
        }
    },

    // --- Market Environment ---
    marketContext: {
        regime: "Late-Cycle Risk-On",
        optionsRegime: "Short Volatility",
        globalRisk: "Constructive",
        volBias: "Compressed"
    },

    // --- Trade Log ---
    trades: [
        {
            id: "t1", date: "2026-01-21T10:30:00", instrument: "NIFTY 22000 CE", type: "Option Buy", direction: "Long",
            entry: 145.5, exit: 185.0, sl: 125.0, target: 190.0,
            size: 500, riskPct: 1.5, pnl: 19750, pnlPct: 27, rMultiple: 2.1,
            strategy: "Gap Fill", outcome: "Win",
            context: { regime: "Bullish", vol: "Low" },
            execution: { earlyEntry: false, slRespected: true, targetManaged: true, errors: [] },
            psychology: { state: "Calm", notes: "Waited for 15m candle close." }
        },
        {
            id: "t2", date: "2026-01-21T13:15:00", instrument: "BANKNIFTY Fut", type: "Futures", direction: "Short",
            entry: 46200, exit: 46350, sl: 46350, target: 45800,
            size: 25, riskPct: 1.0, pnl: -3750, pnlPct: -0.8, rMultiple: -1.0,
            strategy: "Trend Reversal", outcome: "Loss",
            context: { regime: "Choppy", vol: "Medium" },
            execution: { earlyEntry: true, slRespected: true, targetManaged: false, errors: ["FOMO"] },
            psychology: { state: "Rushed", notes: "Entered before confirmation signal." },

            // ELITE FIELDS
            verdict: "❌ Bad Loss",
            failureAttribution: { primary: "Behavioral Error", secondary: "Timing", score: 20 },
            counterfactual: { label: "If waited for signal", result: "No Entry", saved: "₹3,750" },
            ruleInjection: { trigger: "FOMO detected", action: "Lock account for 1 hour" },
            emotionalFlow: ["Calm", "Impatienct", "Rushed"]
        },
        {
            id: "t3", date: "2026-01-20T09:45:00", instrument: "RELIANCE", type: "Equity", direction: "Long",
            entry: 2950, exit: 2985, sl: 2930, target: 3000,
            size: 100, riskPct: 0.8, pnl: 3500, pnlPct: 1.2, rMultiple: 1.75,
            strategy: "Breakout", outcome: "Win",
            context: { regime: "Bullish", vol: "High" },
            execution: { earlyEntry: false, slRespected: true, targetManaged: true, errors: [] },
            psychology: { state: "Calm", notes: "Clean breakout on volume." },

            // ELITE FIELDS (Win Case)
            verdict: "✅ Good Process",
            emotionalFlow: ["Calm", "Focused", "Satisfied"]
        },
        {
            id: "t4", date: "2026-01-19T14:30:00", instrument: "FINNIFTY 20500 PE", type: "Option Buy", direction: "Long",
            entry: 85, exit: 60, sl: 65, target: 120,
            size: 400, riskPct: 2.0, pnl: -10000, pnlPct: -29, rMultiple: -1.5,
            strategy: "Mean Reversion", outcome: "Loss",
            context: { regime: "Bearish", vol: "Spying" },
            execution: { earlyEntry: false, slRespected: false, targetManaged: false, errors: ["Overtrading", "Late Exit"] },
            psychology: { state: "Frustrated", notes: "Moved SL down hoping for reversal." },

            // ELITE FIELDS
            verdict: "❌ Unacceptable Loss",
            failureAttribution: { primary: "Discipline Breach", secondary: "Market Noise", score: 10 },
            counterfactual: { label: "If SL respected", result: "-0.8R Loss", saved: "₹4,200" },
            ruleInjection: { trigger: "SL Violation", action: "Reduce Size by 50% next 3 trades" },
            emotionalFlow: ["Calm", "Hesitant", "Frustrated"]
        },
        {
            id: "t5", date: "2026-01-15T11:00:00", instrument: "SBIN", type: "Equity", direction: "Long",
            entry: 720, exit: 710, sl: 710, target: 750,
            size: 200, riskPct: 1.0, pnl: -2000, pnlPct: -1.4, rMultiple: -1.0,
            strategy: "Support Bounce", outcome: "Loss",
            context: { regime: "Choppy", vol: "Low" },
            execution: { earlyEntry: false, slRespected: true, targetManaged: false, errors: [] },
            psychology: { state: "Calm", notes: "Stop hit quickly." }
        }
    ],

    // --- Daily Journal Notes ---
    dailyNotes: {
        "2026-01-21": "Today was a mixed day. Followed the gap fill perfectly on Nifty, but BankNifty trade was a FOMO entry. Need to stick to the plan better.",
        "2026-01-20": "Great focus today. Execution was flawless on Reliance. No overtrading.",
        "2026-01-19": "Terrible discipline today. Revenge trading after first loss. Account locked as per rules."
    },

    // --- Analytics Summary ---
    analytics: {
        expectancy: 0.45,
        profitFactor: 1.65,
        strategies: [
            { name: "Gap Fill", winRate: 75, expectancy: 0.8 },
            { name: "Breakout", winRate: 60, expectancy: 0.6 },
            { name: "Reversal", winRate: 40, expectancy: -0.2 }
        ]
    },

    // --- Psychology Stats ---
    psychology: {
        heatmap: { "Calm": 12, "Rushed": 4, "Hesitant": 2, "Frustrated": 1 },
        ruleAdherence: 88 // percentage
    }
};
