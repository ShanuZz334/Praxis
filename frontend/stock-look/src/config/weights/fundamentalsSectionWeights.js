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
    [TRADING_MODES.BALANCED]: {
        // No multipliers - use base weights
    },

    [TRADING_MODES.AGGRESSIVE]: {
        'Earnings': 1.4,
        'Macro': 1.2,
        'Liquidity': 1.3,
        'Valuation': 0.8,
        'Risk': 0.6
    },

    [TRADING_MODES.CONSERVATIVE]: {
        'Risk': 1.6,
        'Corporate': 1.4,
        'Valuation': 1.2,
        'Earnings': 0.7,
        'Liquidity': 0.9
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
export const getFundamentalsSectionWeights = (userPreferences = null) => {
    const mode = getCurrentMode(userPreferences);

    if (mode === TRADING_MODES.BALANCED) {
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
