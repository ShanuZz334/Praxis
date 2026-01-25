export const MOCK_MASTER_DATA = {
    // Component Scores for the Master Gauge logic
    components: {
        technical: 82,    // 0-100
        options: 65,      // 0-100
        fundamental: 78,  // 0-100
        events: 40,       // 0-100 (Inverted: Low Score = High Risk, handled in engine)
        global: 74        // 0-100
    },

    // Derived Top-Level State (Calculated by Engine, but mocked here for snapshots)
    riskMonitor: {
        volatility: "Stable",
        eventRisk: "Approaching (FOMC)",
        liquidity: "Healthy",
        status: "Normal" // Normal, Elevated, High Risk
    },

    // Summaries of individual pages
    snapshots: {
        fundamental: { score: 78, tailwind: "Earnings Growth", risk: "Valuation Premium", regime: "Quality Growth" },
        technical: { score: 82, trend: "Strong Uptrend", signal: "Nifty Breakout", weak: "Midcap Lag" },
        options: { score: 65, positioning: "Bullish", gamma: "Long Gamma", topStrike: "22500 CE", volBias: "Compressed" },
        events: { score: 40, nextCatalyst: "US CPI (24h)", impact: "High Volatility Expected" },
        global: { score: 74, usTrend: "Bullish", asiaBias: "Mixed", correlation: "High" },
        journal: { score: 82, mistake: "FOMO Entry", alert: "Maintain Size Discipline" }
    },

    // Daily Actionable Guidance
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

    // Signal Alignment Matrix
    alignment: [
        { engine: "Technical", bias: "Bullish", strength: "High" },
        { engine: "Options", bias: "Bullish", strength: "Medium" },
        { engine: "Fundamental", bias: "Bullish", strength: "Medium" },
        { engine: "Events", bias: "Caution", strength: "High" },
        { engine: "Global", bias: "Bullish", strength: "Medium" }
    ],

    // Pro Desk Picks (Replaces Top Ideas)
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
