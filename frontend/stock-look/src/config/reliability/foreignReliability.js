/**
 * @file foreignReliability.js
 * @purpose Central source of truth for Foreign Markets Indicator Reliability scores.
 */

export const FOREIGN_RELIABILITY = {
    // Currency
    'dxy': 0.85,
    'eurusd': 0.80,
    'usdjpy': 0.85,

    // Global Indices
    'sp500': 0.90,
    'nasdaq': 0.90,
    'nikkei': 0.80,
    'ftse': 0.75,
    'dax': 0.75,
    'hangseng': 0.70,
    'shanghai': 0.70,
    'cac40': 0.75,
    'eurostoxx': 0.75,

    // Commodities
    'gold': 0.85,
    'crude': 0.85,
    'copper': 0.80,
    'silver': 0.80,
    'natgas': 0.70,
    'wheat': 0.70,
    'aluminum': 0.70,

    // Rates & Volatility
    'us10y': 0.95,
    'vix': 0.90,
    'move': 0.85
};

export default FOREIGN_RELIABILITY;
