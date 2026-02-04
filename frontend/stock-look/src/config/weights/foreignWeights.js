/**
 * @file foreignWeights.js
 * @purpose Weight configurations for Foreign Markets page indicators.
 * @responsibilities
 * - Defines weights for 22 global market indicators (Currency, Indices, Commodities, Rates)
 * - Provides mode-specific weight multipliers
 * @key_exports
 * - FOREIGN_WEIGHTS - Base weight configuration
 * - getForeignWeights - Gets weights for specific mode
 * @date 2026-02-04
 */

import { TRADING_MODES, getCurrentMode } from '../tradingModes.js';

// =============================
// Base Foreign Market Indicator Weights
// =============================

export const FOREIGN_WEIGHTS = {
    // Currency (3 indicators)
    'dxy': 0.10,
    'eurusd': 0.08,
    'usdjpy': 0.09,

    // Global Indices (9 indicators)
    'sp500': 0.09,
    'nasdaq': 0.09,
    'nikkei': 0.08,
    'ftse': 0.07,
    'dax': 0.07,
    'hangseng': 0.06,
    'shanghai': 0.06,
    'cac40': 0.07,
    'eurostoxx': 0.07,

    // Commodities (7 indicators)
    'gold': 0.08,
    'crude': 0.08,
    'copper': 0.07,
    'silver': 0.07,
    'natgas': 0.06,
    'wheat': 0.06,
    'aluminum': 0.06,

    // Rates & Volatility (3 indicators)
    'us10y': 0.10,
    'vix': 0.09,
    'move': 0.08
};

// =============================
// Trading Mode Weight Multipliers
// =============================

export const MODE_WEIGHT_MULTIPLIERS = {
    [TRADING_MODES.BALANCED]: {
        // No multipliers - use base weights
    },

    [TRADING_MODES.AGGRESSIVE]: {
        // Focus on momentum and risk-on assets
        nasdaq: 1.4,
        sp500: 1.3,
        crude: 1.3,
        copper: 1.2,
        // Reduce safe-haven focus
        gold: 0.7,
        us10y: 0.8,
        vix: 0.7
    },

    [TRADING_MODES.CONSERVATIVE]: {
        // Focus on safe-haven and defensive
        gold: 1.5,
        us10y: 1.4,
        vix: 1.3,
        dxy: 1.2,
        // Reduce risk-on focus
        nasdaq: 0.7,
        crude: 0.8,
        copper: 0.7
    }
};

// =============================
// Utility Functions
// =============================

/**
 * Gets foreign market weights for a specific trading mode
 * @param {string} mode - Trading mode (balanced, aggressive, conservative)
 * @returns {Object} Weight configuration
 */
export const getForeignWeights = (mode = TRADING_MODES.BALANCED) => {
    if (mode === TRADING_MODES.BALANCED) {
        return FOREIGN_WEIGHTS;
    }

    const multipliers = MODE_WEIGHT_MULTIPLIERS[mode];
    if (!multipliers) return FOREIGN_WEIGHTS;

    const adjustedWeights = {};
    for (const [id, baseWeight] of Object.entries(FOREIGN_WEIGHTS)) {
        adjustedWeights[id] = baseWeight * (multipliers[id] || 1.0);
    }

    return adjustedWeights;
};

export default {
    FOREIGN_WEIGHTS,
    MODE_WEIGHT_MULTIPLIERS,
    getForeignWeights
};
