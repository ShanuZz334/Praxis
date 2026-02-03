/**
 * @file masterData.js
 * @purpose Provides centralized mock data for the Master Dashboard feature.
 * @responsibilities
 * - Stores mock scores for various system components (Technical, Options, Fundamental, etc.).
 * - simulataes derived top-level states for risk monitoring.
 * - Provides summaries/snapshots for individual dashboard pages.
 * - Offers actionable daily guidance and pro desk picks.
 * @key_exports
 * - MOCK_MASTER_DATA (Constant)
 * @dependencies
 * - None
 * @lifecycle
 * - Imported by MasterDashboard and other UI components for display.
 * @date 2026-02-03
 */

// =============================
// Mock Data Configuration
// =============================

export const MOCK_MASTER_DATA = {
    // --- Component Scores ---
    // Normalized 0-100 scores for system gauges
    components: {
        technical: 82,    // Strong Bullish
        options: 65,      // Moderately Bullish
        fundamental: 78,  // Strong Fundamental Support
        events: 40,       // Caution / Risk (Low score = High Risk context)
        global: 74        // Supportive Global Cues
    },

    // --- Risk Monitor State ---
    // Derived states (mocked here, usually calculated by engine)
    riskMonitor: {
        volatility: "Stable",
        eventRisk: "Approaching (FOMC)",
        liquidity: "Healthy",
        status: "Normal" // Enum: Normal, Elevated, High Risk
    },

    // --- Module Snapshots ---
    // Brief summaries for dashboard cards
    snapshots: {
        fundamental: { score: 78, tailwind: "Earnings Growth", risk: "Valuation Premium", regime: "Quality Growth" },
        technical: { score: 82, trend: "Strong Uptrend", signal: "Nifty Breakout", weak: "Midcap Lag" },
        options: { score: 65, positioning: "Bullish", gamma: "Long Gamma", topStrike: "22500 CE", volBias: "Compressed" },
        events: { score: 40, nextCatalyst: "US CPI (24h)", impact: "High Volatility Expected" },
        global: { score: 74, usTrend: "Bullish", asiaBias: "Mixed", correlation: "High" },
        journal: { score: 82, mistake: "FOMO Entry", alert: "Maintain Size Discipline" }
    },

    // --- Actionable Guidance ---
    // Daily pre-market plan and execution operational rules
    readiness: {
        bias: "Bullish",
        confidence: 76,
        do: {
            instruments: ["NIFTY Options", "Large Cap Tech"],
            strategy: "Trend Following",
            size: "Standard"
        },
        avoid: {
            windows: ["Opening 15m", "Pre-Speech"],
            traps: ["Mean Reversion in IT"],
            zones: ["22300 Resistance"]
        },
        capital: {
            mode: "Aggressive", // Aggressive, Normal, Defensive
            maxRisk: "1.5%",
            deployment: "70% Options / 30% Cash"
        }
    },

    // --- Signal Alignment ---
    // Multi-factor confirmation matrix
    alignment: [
        { engine: "Technical", bias: "Bullish", strength: "High" },
        { engine: "Options", bias: "Bullish", strength: "Medium" },
        { engine: "Fundamental", bias: "Bullish", strength: "Medium" },
        { engine: "Events", bias: "Caution", strength: "High" },
        { engine: "Global", bias: "Bullish", strength: "Medium" }
    ],

    // --- Pro Desk Picks ---
    // Curated high-probability setups
    proDeskPicks: {
        calls: [
            { strike: "22650 CE", dte: "2DTE", price: "32.49", change: "+0.23", oi: "+14246" },
            { strike: "22550 CE", dte: "2DTE", price: "61.61", change: "+0.36", oi: "+7516" },
            { strike: "22750 CE", dte: "2DTE", price: "15.31", change: "+0.12", oi: "+20843" }
        ],
        puts: [
            { strike: "22400 PE", dte: "2DTE", price: "72.64", change: "-0.40", oi: "+15613" },
            { strike: "22350 PE", dte: "2DTE", price: "54.38", change: "-0.33", oi: "+8204" },
            { strike: "22200 PE", dte: "2DTE", price: "19.53", change: "-0.15", oi: "+13597" }
        ]
    },

    // --- Real-time Alerts ---
    // Feed of critical system notifications
    alerts: [
        { id: 1, type: "warning", text: "Event Risk: US CPI in 24h. Reduce overnight leverage.", time: "10m ago" },
        { id: 2, type: "info", text: "Options Gamma Flip detected at 22400. Expect volatility expansion.", time: "25m ago" },
        { id: 3, type: "tip", text: "Pro Tip: When VIX > 15, prefer credit spreads over debit spreads to capture premium decay.", time: "1h ago" },
        { id: 4, type: "social", text: "Institutional flow detected in Nifty IT. Rotating out of Banks?", time: "2h ago" },
        { id: 5, type: "tip", text: "Trick: Use the 15m VWAP as a dynamic support level for intraday trend following.", time: "4h ago" },
        { id: 6, type: "warning", text: "High Put-Call Ratio at 1.35. Potential reversal signal brewing.", time: "5h ago" },
        { id: 7, type: "info", text: "FII net buyers for 3rd consecutive session. Momentum building.", time: "6h ago" },
        { id: 8, type: "social", text: "Smart money accumulating Pharma stocks. Sector rotation underway?", time: "7h ago" },
        { id: 9, type: "tip", text: "Pro Tip: Set stop-loss at previous day's low for swing trades to manage risk.", time: "8h ago" },
        { id: 10, type: "info", text: "Nifty holding above 20-day EMA. Bullish structure intact.", time: "9h ago" }
    ]
};
