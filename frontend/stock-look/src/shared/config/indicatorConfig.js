/**
 * @file indicatorConfig.js
 * @purpose Centralized store for indicator metadata, credits, and impact weights.
 * @description
 * Storing credits and weights here allows for easy tuning of the Praxis Engine without modifying UI components.
 */

import { CARD_REGISTRY } from './cardRegistry.js';

export const INDICATOR_CONFIG = {
    // --- Global Macro Indicators ---
    advance_decline: {
        id: CARD_REGISTRY.advance_decline?.id || "advance_decline",
        creditScore: 8,
        impactWeight: "6.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    india_vix: {
        id: CARD_REGISTRY.india_vix?.id || "india_vix",
        creditScore: 9,
        impactWeight: "8.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    index_macd: {
        id: "index_macd",
        creditScore: 7,
        impactWeight: "5.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    index_200dma: {
        id: "index_200dma",
        creditScore: 8,
        impactWeight: "7.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    brent_crude_oil: {
        id: "brent_crude_oil",
        creditScore: 9,
        impactWeight: "8.0%",
        source: "ICE Market Data",
        aiModel: "Qwen3 8B"
    },
    gold: {
        id: "gold",
        creditScore: 8,
        impactWeight: "6.0%",
        source: "COMEX",
        aiModel: "Qwen3 8B"
    },
    silver: {
        id: "silver",
        creditScore: 6,
        impactWeight: "5.0%",
        source: "COMEX",
        aiModel: "Qwen3 8B"
    },
    vix: {
        id: "vix",
        creditScore: 9,
        impactWeight: "8.0%",
        source: "CBOE",
        aiModel: "Qwen3 8B"
    },
    bitcoin: {
        id: "bitcoin",
        creditScore: 6,
        impactWeight: "5.0%",
        source: "Crypto Exchange",
        aiModel: "Qwen3 8B"
    },
    sp_futures: {
        id: "sp_futures",
        creditScore: 9,
        impactWeight: "8.0%",
        source: "CME Market Data",
        aiModel: "Qwen3 8B"
    },
    nasdaq_futures: {
        id: "nasdaq_futures",
        creditScore: 9,
        impactWeight: "8.0%",
        source: "CME Market Data",
        aiModel: "Qwen3 8B"
    },
    dow_futures: {
        id: "dow_futures",
        creditScore: 8,
        impactWeight: "6.0%",
        source: "CME Market Data",
        aiModel: "Qwen3 8B"
    },
    eurusd: {
        id: "eurusd",
        creditScore: 5,
        impactWeight: "4.0%",
        source: "ICE Data",
        aiModel: "Qwen3 8B"
    },
    usdjpy: {
        id: "usdjpy",
        creditScore: 5,
        impactWeight: "4.0%",
        source: "ICE Data",
        aiModel: "Qwen3 8B"
    },
    nikkei: {
        id: "nikkei",
        creditScore: 7,
        impactWeight: "5.0%",
        source: "Global Market Data",
        aiModel: "Qwen3 8B"
    },
    ftse: {
        id: "ftse",
        creditScore: 6,
        impactWeight: "4.0%",
        source: "Global Market Data",
        aiModel: "Qwen3 8B"
    },
    dax: {
        id: "dax",
        creditScore: 6,
        impactWeight: "4.0%",
        source: "Global Market Data",
        aiModel: "Qwen3 8B"
    },
    hangseng: {
        id: "hangseng",
        creditScore: 6,
        impactWeight: "4.0%",
        source: "Global Market Data",
        aiModel: "Qwen3 8B"
    },
    shanghai: {
        id: "shanghai",
        creditScore: 5,
        impactWeight: "4.0%",
        source: "Global Market Data",
        aiModel: "Qwen3 8B"
    },
    cac40: {
        id: "cac40",
        creditScore: 6,
        impactWeight: "4.0%",
        source: "Global Market Data",
        aiModel: "Qwen3 8B"
    },
    eurostoxx: {
        id: "eurostoxx",
        creditScore: 6,
        impactWeight: "4.0%",
        source: "Global Market Data",
        aiModel: "Qwen3 8B"
    },
    copper: {
        id: "copper",
        creditScore: 6,
        impactWeight: "5.0%",
        source: "COMEX",
        aiModel: "Qwen3 8B"
    },
    natgas: {
        id: "natgas",
        creditScore: 6,
        impactWeight: "4.0%",
        source: "NYMEX",
        aiModel: "Qwen3 8B"
    },
    wheat: {
        id: "wheat",
        creditScore: 5,
        impactWeight: "3.0%",
        source: "CBOT",
        aiModel: "Qwen3 8B"
    },
    aluminum: {
        id: "aluminum",
        creditScore: 5,
        impactWeight: "3.0%",
        source: "LME",
        aiModel: "Qwen3 8B"
    },
    move: {
        id: "move",
        creditScore: 7,
        impactWeight: "5.0%",
        source: "ICE Data",
        aiModel: "Qwen3 8B"
    },

    pe_ratio: {
        id: CARD_REGISTRY.pe_ratio?.id || "pe_ratio",
        creditScore: 8,
        impactWeight: "6.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    forward_pe: {
        id: CARD_REGISTRY.forward_pe?.id || "forward_pe",
        creditScore: 8,
        impactWeight: "6.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    pb_ratio: {
        id: CARD_REGISTRY.pb_ratio?.id || "pb_ratio",
        creditScore: 8,
        impactWeight: "5.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    earnings_yield: {
        id: CARD_REGISTRY.earnings_yield?.id || "earnings_yield",
        creditScore: 7,
        impactWeight: "4.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    eps_growth: {
        id: CARD_REGISTRY.eps_growth?.id || "eps_growth",
        creditScore: 9,
        impactWeight: "6.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    revenue_growth: {
        id: CARD_REGISTRY.revenue_growth?.id || "revenue_growth",
        creditScore: 9,
        impactWeight: "6.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    profit_growth: {
        id: CARD_REGISTRY.profit_growth?.id || "profit_growth",
        creditScore: 8,
        impactWeight: "5.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    gdp_growth: {
        id: CARD_REGISTRY.gdp_growth?.id || "gdp_growth",
        creditScore: 6,
        impactWeight: "3.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    usd_inr: {
        id: "usd_inr",
        title: "USD/INR Exchange Rate",
        category: "Global Macro",
        creditScore: 5,
        impactWeight: "Very High",
        source: "RBI / NSE",
        aiModel: "Praxis-Macro-v1"
    },
    dxy: {
        id: "dxy",
        title: "US Dollar Index",
        category: "Global Macro",
        creditScore: 5,
        impactWeight: "Very High",
        source: "ICE Data",
        aiModel: "Praxis-Macro-v1"
    },
    us_10y_yield: {
        id: "us_10y_yield",
        title: "US 10-Year Treasury Yield",
        category: "Global Macro",
        creditScore: 5,
        impactWeight: "Very High",
        source: "US Treasury",
        aiModel: "Praxis-Macro-v1"
    },
    // We can add RSI, MACD, etc. here later
    rsi: {
        id: "rsi",
        creditScore: 5,
        impactWeight: "4.5%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    macd: {
        id: "macd",
        creditScore: 5,
        impactWeight: "5.8%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    stoch_rsi: {
        id: "stoch_rsi",
        creditScore: 4,
        impactWeight: "4.0%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    williams_r: {
        id: "williams_r",
        creditScore: 3,
        impactWeight: "3.0%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    // --- Market Health Indicators ---
    mcap_gdp: {
        id: CARD_REGISTRY.mcap_gdp?.id || "market_cap_gdp",
        creditScore: 8,
        impactWeight: "5.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    dividend_yield: {
        id: CARD_REGISTRY.dividend_yield?.id || "dividend_yield",
        creditScore: 6,
        impactWeight: "3.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    earnings_trend: {
        id: CARD_REGISTRY.earnings_trend?.id || "earnings_trend",
        creditScore: 7,
        impactWeight: "4.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    fii_dii_flow: {
        id: CARD_REGISTRY.fii_dii_flow?.id || "fii_dii_flow",
        creditScore: 8,
        impactWeight: "5.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    // Profitability Indicators
    roe: {
        id: CARD_REGISTRY.roe?.id || "roe",
        creditScore: 9,
        impactWeight: "6.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    roce: {
        id: CARD_REGISTRY.roce?.id || "roce",
        creditScore: 9,
        impactWeight: "6.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    net_margin: {
        id: CARD_REGISTRY.net_margin?.id || "net_margin",
        creditScore: 7,
        impactWeight: "4.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    operating_margin: {
        id: CARD_REGISTRY.operating_margin?.id || "operating_margin",
        creditScore: 7,
        impactWeight: "4.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    // --- Financial Health Indicators ---
    debt_to_equity: {
        id: CARD_REGISTRY.debt_to_equity?.id || "debt_to_equity",
        creditScore: 8,
        impactWeight: "5.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    interest_coverage: {
        id: CARD_REGISTRY.interest_coverage?.id || "interest_coverage",
        creditScore: 8,
        impactWeight: "5.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    free_cash_flow: {
        id: CARD_REGISTRY.free_cash_flow?.id || "free_cash_flow",
        creditScore: 8,
        impactWeight: "5.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    current_ratio: {
        id: CARD_REGISTRY.current_ratio?.id || "current_ratio",
        creditScore: 6,
        impactWeight: "3.0%",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    // Technical Indicators (Trend)
    ema_20: {
        id: "ema_20",
        creditScore: 7,
        impactWeight: "5.0%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    ema_50: {
        id: "ema_50",
        creditScore: 8,
        impactWeight: "6.0%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    ema_200: {
        id: "ema_200",
        creditScore: 9,
        impactWeight: "8.0%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    sma_50: {
        id: "sma_50",
        creditScore: 7,
        impactWeight: "5.0%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    sma_200: {
        id: "sma_200",
        creditScore: 9,
        impactWeight: "8.0%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    adx: {
        id: "adx",
        creditScore: 7,
        impactWeight: "6.0%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    supertrend: {
        id: "supertrend",
        creditScore: 8,
        impactWeight: "7.0%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    // Technical Indicators (Volume)
    cmf: {
        id: "cmf",
        creditScore: 5,
        impactWeight: "5.0%",
        source: "Upstox OHLC + Volume",
        aiModel: "Qwen3 8B"
    },
    volume_sma: {
        id: "volume_sma",
        creditScore: 4,
        impactWeight: "4.0%",
        source: "Upstox Volume Data",
        aiModel: "Qwen3 8B"
    },
    obv: {
        id: "obv",
        creditScore: 5,
        impactWeight: "7.0%",
        source: "Upstox Volume Data",
        aiModel: "Qwen3 8B"
    },
    vwap: {
        id: "vwap",
        creditScore: 5,
        impactWeight: "8.0%",
        source: "Upstox OHLC + Volume",
        aiModel: "Qwen3 8B"
    },
    // Technical Indicators
    bb_20_2: {
        id: "bb_20_2",
        creditScore: 8,
        impactWeight: "6.0%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    atr: {
        id: "atr",
        creditScore: 8,
        impactWeight: "7.0%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    kc: {
        id: "kc",
        creditScore: 7,
        impactWeight: "6.0%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    // Technical Indicators (Breadth & Volatility)
    breadth_ratio: {
        id: "breadth_ratio",
        creditScore: 5,
        impactWeight: "5.0%",
        source: "NSE Market Breadth",
        aiModel: "Qwen3 8B"
    },
    mcclellan: {
        id: "mcclellan",
        creditScore: 5,
        impactWeight: "4.0%",
        source: "NSE Market Breadth",
        aiModel: "Qwen3 8B"
    },
    ad_line: {
        id: "ad_line",
        creditScore: 5,
        impactWeight: "8.0%",
        source: "NSE Market Breadth",
        aiModel: "Qwen3 8B"
    },
    nh_nl: {
        id: "nh_nl",
        creditScore: 5,
        impactWeight: "7.0%",
        source: "NSE Market Statistics",
        aiModel: "Qwen3 8B"
    },

    trin: {
        id: "trin",
        creditScore: 5,
        impactWeight: "5.0%",
        source: "NSE Market Breadth",
        aiModel: "Qwen3 8B"
    },
    support: {
        id: "support",
        creditScore: 8,
        impactWeight: "7.0%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    resistance: {
        id: "resistance",
        creditScore: 8,
        impactWeight: "8.0%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    trendline: {
        id: "trendline",
        creditScore: 8,
        impactWeight: "7.0%",
        source: "Upstox OHLC",
        aiModel: "Qwen3 8B"
    },
    pivot: {
        id: "pivot",
        creditScore: 8,
        impactWeight: "6.0%",
        source: "Previous Trading Session OHLC",
        aiModel: "Qwen3 8B"
    },
    fibonacci: {
        id: "fibonacci",
        creditScore: 8,
        impactWeight: "7.0%",
        source: "Upstox Historical OHLC",
        aiModel: "Qwen3 8B"
    },
    // Options Indicators
    pcr_oi: {
        id: "pcr_oi",
        title: "PCR (OI)",
        category: "Options",
        creditScore: 10,
        impactWeight: "8.0%",
        source: "NSE Option Chain",
        aiModel: "Qwen3 8B"
    },
    pcr_volume: {
        id: "pcr_volume",
        title: "PCR (Volume)",
        category: "Options",
        creditScore: 8,
        impactWeight: "5.0%",
        source: "NSE Option Chain",
        aiModel: "Qwen3 8B"
    },
    max_pain: {
        id: "max_pain",
        title: "Max Pain",
        category: "Options",
        creditScore: 10,
        impactWeight: "8.0%",
        source: "NSE Option Chain",
        aiModel: "Qwen3 8B"
    },
    total_call_oi: {
        id: "total_call_oi",
        title: "Total Call OI",
        category: "Options",
        creditScore: 9,
        impactWeight: "High",
        source: "NSE Option Chain / Upstox API",
        aiModel: "Qwen3 8B"
    },
    total_put_oi: {
        id: "total_put_oi",
        title: "Total Put OI",
        category: "Options",
        creditScore: 9,
        impactWeight: "High",
        source: "NSE Option Chain / Upstox API",
        aiModel: "Qwen3 8B"
    },
    oi_change: {
        id: "oi_change",
        title: "OI Change",
        category: "Options",
        creditScore: 9,
        impactWeight: "High",
        source: "NSE Option Chain / Upstox API",
        aiModel: "Qwen3 8B"
    },
    delta: {
        id: "delta",
        title: "Delta",
        category: "Greeks",
        creditScore: 9,
        impactWeight: "High",
        source: "NSE Option Chain / Upstox API",
        aiModel: "Qwen3 8B"
    },
    gamma: {
        id: "gamma",
        title: "Gamma",
        category: "Greeks",
        creditScore: 8,
        impactWeight: "Medium",
        source: "NSE Option Chain / Upstox API",
        aiModel: "Qwen3 8B"
    },
    theta: {
        id: "theta",
        title: "Theta",
        category: "Greeks",
        creditScore: 8,
        impactWeight: "Medium",
        source: "NSE Option Chain / Upstox API",
        aiModel: "Qwen3 8B"
    },
    vega: {
        id: "vega",
        title: "Vega",
        category: "Greeks",
        creditScore: 8,
        impactWeight: "Medium",
        source: "NSE Option Chain / Upstox API",
        aiModel: "Qwen3 8B"
    },
    // Options Volatility
    atm_iv: {
        id: "atm_iv",
        title: "ATM IV",
        category: "Volatility",
        creditScore: 9,
        impactWeight: "High",
        source: "NSE Option Chain / Upstox API",
        aiModel: "Qwen3 8B"
    },
    iv_rank: {
        id: "iv_rank",
        title: "IV Rank",
        category: "Volatility",
        creditScore: 8,
        impactWeight: "Medium",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    iv_percentile: {
        id: "iv_percentile",
        title: "IV Percentile",
        category: "Volatility",
        creditScore: 7,
        impactWeight: "Medium",
        source: "Manual",
        aiModel: "Qwen3 8B"
    },
    ev_ebitda: { id: CARD_REGISTRY.ev_ebitda?.id || "ev_ebitda", title: "EV/EBITDA", creditScore: 7, category: "Valuation" },
    relative_valuation: { id: CARD_REGISTRY.relative_valuation?.id || "relative_valuation", title: "Relative Valuation", creditScore: 6, category: "Valuation" },
    roa: { id: CARD_REGISTRY.roa?.id || "roa", title: "ROA", creditScore: 7, category: "Corporate" },
    promoter_holding: { id: CARD_REGISTRY.promoter_holding?.id || "promoter_holding", title: "Promoter Holding", creditScore: 8, category: "Ownership" },
    smart_money_flow: { id: CARD_REGISTRY.smart_money_flow?.id || "smart_money_flow", title: "Smart Money Flow", creditScore: 9, category: "Ownership" },
    earnings_quality: { id: CARD_REGISTRY.earnings_quality?.id || "earnings_quality", title: "Earnings Quality", creditScore: 8, category: "Ownership" }
};

/**
 * Helper to fetch config for an indicator.
 * @param {string} id - The ID of the indicator
 * @returns {object} The config object or a default fallback if not found
 */
export function getIndicatorConfig(id) {
    return INDICATOR_CONFIG[id] || { 
        creditScore: 0, 
        impactWeight: "0.0%",
        source: "Unknown",
        aiModel: "Unknown"
    };
}
