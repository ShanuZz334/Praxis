import { FOREIGN_RELIABILITY, TOTAL_FOREIGN_CREDITS as _TOTAL_CREDITS } from '../../../../config/reliability';
import { getCreditFromReliability } from '@/shared/global/logic/signals';

// Card-based data structure for Global Structure page
const _baseCards = [
    // Currency
    {
        id: "dxy",
        label: "Dollar Index (DXY)",
        category: "Currency",
        raw: null,
        unit: "",
        normalized: 0.65,
        creditScore: 0.9,
        creditAllocation: 9,
        reason: "Strong breakout, tightening global liquidity"
    },
    {
        id: "eurusd",
        label: "EUR/USD",
        category: "Currency",
        raw: null,
        unit: "",
        normalized: -0.4,
        creditScore: 0.85,
        creditAllocation: 8,
        reason: "Weak vs USD, ECB dovish stance"
    },
    {
        id: "usdjpy",
        label: "USD/JPY",
        category: "Currency",
        raw: null,
        unit: "",
        normalized: 0.7,
        creditScore: 0.88,
        creditAllocation: 9,
        reason: "Yen weakness persists, BOJ maintains policy"
    },
    {
        id: "usd_inr",
        label: "USD/INR",
        category: "Currency",
        raw: null,
        unit: "",
        normalized: 0.2,
        creditScore: 0.8,
        creditAllocation: 8,
        reason: "Stable within tight RBI intervention band"
    },

    // Global Indices
    {
        id: "sp_futures",
        label: "S&P 500",
        category: "US Markets",
        raw: null,
        unit: "",
        normalized: 0.45,
        creditScore: 0.92,
        creditAllocation: 9,
        reason: "Consolidating near highs, yield sensitive"
    },
    {
        id: "nasdaq_futures",
        label: "Nasdaq 100",
        category: "US Markets",
        raw: null,
        unit: "",
        normalized: -0.3,
        creditScore: 0.9,
        creditAllocation: 9,
        reason: "Tech under pressure from rising rates"
    },
    {
        id: "dow_futures",
        label: "Dow Jones",
        category: "US Markets",
        raw: null,
        unit: "",
        normalized: 0.2,
        creditScore: 0.85,
        creditAllocation: 8,
        reason: "Value outperforming tech"
    },
    {
        id: "nikkei",
        label: "Nikkei 225",
        category: "Global Indices",
        raw: null,
        unit: "",
        normalized: 0.75,
        creditScore: 0.88,
        creditAllocation: 8,
        reason: "Yen weakness driving export strength"
    },
    {
        id: "ftse",
        label: "FTSE 100",
        category: "Global Indices",
        raw: null,
        unit: "",
        normalized: 0.1,
        creditScore: 0.82,
        creditAllocation: 7,
        reason: "Value support, mixed signals"
    },
    {
        id: "dax",
        label: "DAX 40",
        category: "Global Indices",
        raw: null,
        unit: "",
        normalized: -0.2,
        creditScore: 0.8,
        creditAllocation: 7,
        reason: "Growth drag from weak EU data"
    },
    {
        id: "hangseng",
        label: "Hang Seng",
        category: "Global Indices",
        raw: null,
        unit: "",
        normalized: -0.5,
        creditScore: 0.78,
        creditAllocation: 6,
        reason: "China property concerns weighing"
    },
    {
        id: "shanghai",
        label: "Shanghai Comp",
        category: "Global Indices",
        raw: null,
        unit: "",
        normalized: -0.3,
        creditScore: 0.75,
        creditAllocation: 6,
        reason: "Stimulus hopes vs growth slowdown"
    },
    {
        id: "cac40",
        label: "CAC 40",
        category: "Global Indices",
        raw: null,
        unit: "",
        normalized: 0.05,
        creditScore: 0.82,
        creditAllocation: 7,
        reason: "Luxury sector support, EU headwinds"
    },
    {
        id: "eurostoxx",
        label: "Euro Stoxx 50",
        category: "Global Indices",
        raw: null,
        unit: "",
        normalized: -0.15,
        creditScore: 0.8,
        creditAllocation: 7,
        reason: "ECB policy uncertainty"
    },

    // Commodities
    {
        id: "gold",
        label: "Gold",
        category: "Commodities",
        raw: "$2,045",
        unit: "/oz",
        normalized: 0.5,
        creditScore: 0.9,
        creditAllocation: 8,
        reason: "Safe haven bid, consolidating near highs"
    },
    {
        id: "crude",
        label: "Crude Oil (WTI)",
        category: "Commodities",
        raw: "$83.40",
        unit: "/bbl",
        normalized: 0.2,
        creditScore: 0.85,
        creditAllocation: 8,
        reason: "Supply concerns balanced by demand fears"
    },
    {
        id: "copper",
        label: "Copper",
        category: "Commodities",
        raw: "$3.85",
        unit: "/lb",
        normalized: -0.1,
        creditScore: 0.78,
        creditAllocation: 7,
        reason: "China demand uncertainty weighing"
    },
    {
        id: "silver",
        label: "Silver",
        category: "Commodities",
        raw: "$24.15",
        unit: "/oz",
        normalized: 0.35,
        creditScore: 0.82,
        creditAllocation: 7,
        reason: "Industrial demand improving"
    },
    {
        id: "natgas",
        label: "Natural Gas",
        category: "Commodities",
        raw: "$2.85",
        unit: "/MMBtu",
        normalized: -0.25,
        creditScore: 0.75,
        creditAllocation: 6,
        reason: "Mild weather, storage surplus"
    },
    {
        id: "wheat",
        label: "Wheat",
        category: "Commodities",
        raw: "$615",
        unit: "/bu",
        normalized: 0.1,
        creditScore: 0.7,
        creditAllocation: 6,
        reason: "Supply stable, geopolitical premium"
    },
    {
        id: "aluminum",
        label: "Aluminum",
        category: "Commodities",
        raw: "$2,285",
        unit: "/ton",
        normalized: 0.15,
        creditScore: 0.76,
        creditAllocation: 6,
        reason: "China production cuts supportive"
    },

    // Rates & Volatility
    {
        id: "us_10y_yield",
        label: "US 10Y Yield",
        category: "Rates & Volatility",
        raw: "4.32%",
        unit: "",
        normalized: -0.6,
        creditScore: 0.95,
        creditAllocation: 10,
        reason: "Elevated yields pressuring equity valuations"
    },
    {
        id: "vix",
        label: "VIX",
        category: "Rates & Volatility",
        raw: null,
        unit: "",
        normalized: -0.3,
        creditScore: 0.88,
        creditAllocation: 9,
        reason: "Elevated vol-of-vol, unstable premiums"
    },
    {
        id: "move",
        label: "MOVE Index",
        category: "Rates & Volatility",
        raw: null,
        unit: "",
        normalized: -0.4,
        creditScore: 0.85,
        creditAllocation: 8,
        reason: "Bond volatility elevated, rate uncertainty"
    },

    // Digital Assets
    {
        id: "bitcoin",
        label: "Bitcoin",
        category: "Digital Assets",
        raw: null,
        unit: "",
        normalized: 0.6,
        creditScore: 0.7,
        creditAllocation: 5,
        reason: "ETF approval momentum driving strength"
    }
];

// Re-export for backward compatibility
export const TOTAL_FOREIGN_CREDITS = _TOTAL_CREDITS;
export const TOTAL_GLOBAL_CREDITS = _TOTAL_CREDITS; // Alias for Master Dashboard

// Dynamic mapping with centralized Reliability scores
export const GLOBAL_STRUCTURE_CARDS = _baseCards.map(card => {
    const reliability = FOREIGN_RELIABILITY[card.id] || 0.5;
    return {
        ...card,
        creditScore: reliability, // Internal sync
        reliability,
        creditAllocation: getCreditFromReliability(reliability)
    };
});
// Section definitions
export const GLOBAL_SECTIONS = {
    currency: {
        label: "Currency",
        cards: GLOBAL_STRUCTURE_CARDS.filter(c => c.category === "Currency")
    },
    indices: {
        label: "Global Indices",
        cards: GLOBAL_STRUCTURE_CARDS.filter(c => c.category === "Global Indices")
    },
    commodities: {
        label: "Commodities",
        cards: GLOBAL_STRUCTURE_CARDS.filter(c => c.category === "Commodities")
    },
    rates: {
        label: "Rates & Volatility",
        cards: GLOBAL_STRUCTURE_CARDS.filter(c => c.category === "Rates & Volatility")
    },
    us_markets: {
        label: "US Markets",
        cards: GLOBAL_STRUCTURE_CARDS.filter(c => c.category === "US Markets")
    },
    volatility: {
        label: "Volatility",
        cards: GLOBAL_STRUCTURE_CARDS.filter(c => c.category === "Volatility")
    },
    digital_assets: {
        label: "Digital Assets",
        cards: GLOBAL_STRUCTURE_CARDS.filter(c => c.category === "Digital Assets")
    }
};

// Legacy data (keep for reference, can be removed later)
export const MOCK_GLOBAL_DATA = {
    impact: {
        bias: "Mild Bearish",
        actionHint: "Favor short volatility. Avoid aggressive upside breakouts.",
        drivers: ["US 10Y > 4.3%", "DXY Breakout", "Global Risk-Off"],
        confidence: 78,
        confidenceExplain: "High historical correlation with rising yield regimes."
    },
    risk: {
        index: 74,
        state: "Risk-Off",
        regime: "Late-Cycle Contraction",
        conditions: {
            rates: "High",
            volatility: "Stressed",
            liquidity: "Tight"
        },
        tactical: "Breakouts fail more often. Mean reversion preferred.",
        helper: "Risk-off, but liquidity not breaking.",
        lastUpdated: "Live"
    }
};
