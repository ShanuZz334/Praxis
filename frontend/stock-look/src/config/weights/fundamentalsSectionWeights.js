/**
 * @file fundamentalsSectionWeights.js
 * @purpose Section weight configurations for Fundamentals page categories.
 * @responsibilities
 * - Defines weights for 8 fundamental sections
 * - Provides mode-specific section weight multipliers
 * @key_exports
 * - SECTION_WEIGHTS - Section definitions with weights
 * - getFundamentalsSectionWeights - Gets section weights for specific mode
 * @date 2026-02-04
 */

import { TRADING_MODES, getCurrentMode } from '../tradingModes.js';

// =============================
// Base Section Weights
// =============================

export const SECTION_WEIGHTS = {
    // 15% - Core Valuation
    Valuation: 0.15,

    // 20% - Earnings Power
    Earnings: 0.20,

    // 20% - Macro Environment
    Macro: 0.20,

    // 20% - Liquidity Dynamics
    Liquidity: 0.20,

    // 10% - Sector Health
    Sector: 0.10,

    // 5% - Corporate Health
    Corporate: 0.05,

    // 5% - Global Factors
    Global: 0.05,

    // 5% - Systemic Risk
    Risk: 0.05
};

// =============================
// Trading Mode Section Multipliers
// =============================

export const SECTION_MODE_MULTIPLIERS = {
    // SWING: Balanced — no adjustments, use base weights
    [TRADING_MODES.SWING]: {},

    // POSITIONAL: Risk and macro dominate for multi-week fundamental thesis
    [TRADING_MODES.POSITIONAL]: {
        'Macro':     1.35,  // Macro regime determines positional direction
        'Risk':      1.40,  // Systemic risk is the key positional filter
        'Corporate': 1.30,  // Balance sheet strength for multi-week holds
        'Valuation': 1.20,  // Valuation matters for longer-term thesis
        'Earnings':  0.85,  // Short-term earnings less critical positionally
        'Liquidity': 0.90,
        'Sector':    0.90,
        'Global':    1.10,
    },

    // INTRADAY: Earnings and liquidity catalysts dominate intraday moves
    [TRADING_MODES.INTRADAY]: {
        'Earnings':  1.40,  // Earnings surprise = biggest intraday catalyst
        'Liquidity': 1.35,  // Liquidity flows drive intraday momentum
        'Macro':     1.20,  // Data releases (CPI, GDP) move markets intraday
        'Global':    1.15,  // Global triggers drive intraday gaps
        'Risk':      0.70,  // Systemic risk changes are slow intraday
        'Corporate': 0.75,  // Corporate health is a slow-moving signal
        'Valuation': 0.80,  // Valuation irrelevant for same-day trades
        'Sector':    0.90,
    }
};

// =============================
// Utility Functions
// =============================

/**
 * Gets section weights for a specific trading mode
 * @param {Object} userPreferences - User preferences object
 * @returns {Object} Section configuration with adjusted weights
 */
export const getFundamentalsSectionWeights = (mode = TRADING_MODES.SWING) => {
    if (mode === TRADING_MODES.SWING) {
        return SECTION_WEIGHTS;
    }

    const multipliers = SECTION_MODE_MULTIPLIERS[mode];
    if (!multipliers) return SECTION_WEIGHTS;

    const adjustedWeights = {};
    for (const [section, weight] of Object.entries(SECTION_WEIGHTS)) {
        adjustedWeights[section] = weight * (multipliers[section] || 1.0);
    }

    return adjustedWeights;
};

export default {
    SECTION_WEIGHTS,
    SECTION_MODE_MULTIPLIERS,
    getFundamentalsSectionWeights
};
