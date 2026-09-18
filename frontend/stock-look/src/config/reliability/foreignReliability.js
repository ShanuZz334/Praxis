/**
 * @file foreignReliability.js
 * @purpose Central source of truth for Foreign Markets Indicator Reliability scores.
 */

export const FOREIGN_RELIABILITY = {
    // Currency
    'dxy': 0.85,
    'usdjpy': 0.85,

    // Global Indices
    'sp500': 0.90,
    'nasdaq': 0.90,
    'nikkei': 0.80,
    'ftse': 0.75,
    'dax': 0.75,
    'hangseng': 0.70,
    'shanghai': 0.70,

    // Commodities
    'gold': 0.85,
    'crude': 0.85,
    'copper': 0.80,
    'silver': 0.80,
    'natgas': 0.70,

    // Rates & Volatility
    'us10y': 0.95,
    'vix': 0.90,
    'move': 0.85,

    // US Markets & Digital Assets additions
    'dow_jones': 0.85,
    'ethereum': 0.70
};

export default FOREIGN_RELIABILITY;
