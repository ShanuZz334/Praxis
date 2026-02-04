/**
 * @file optionsCredits.js
 * @purpose Credit configurations for Options page indicators.
 * @responsibilities
 * - Defines credits for 12 options indicators
 * - Provides mode-specific credit multipliers
 * - Dynamically calculates total credits
 * @key_exports
 * - OPTIONS_CREDITS - Base credit configuration
 * - TOTAL_OPTIONS_CREDITS - Dynamic total
 * - getOptionsCredits - Gets credits for specific mode
 * @date 2026-02-04
 */

import { TRADING_MODES, getCurrentMode } from '../tradingModes.js';

// =============================
// Total Credit Budget
// =============================

// Dynamically calculated from sum of all credits below
// This ensures the total always matches actual allocations

// =============================
// Base Options Indicator Credits
// =============================

export const OPTIONS_CREDITS = {
    // Open Interest (4 indicators) - 42 credits
    'max_pain': 12,
    'pcr': 10,
    'call_wall': 10,
    'put_wall': 10,

    // Greeks (4 indicators) - 38 credits
    'net_delta': 12,
    'net_gamma': 10,
    'theta_decay': 8,
    'vega_risk': 8,

    // Volatility (4 indicators) - 38 credits
    'atm_iv': 8,
    'iv_rank': 10,
    'iv_skew': 12,
    'hv_iv_spread': 8
};

// =============================
// Trading Mode Credit Multipliers
// =============================

export const MODE_CREDIT_MULTIPLIERS = {
    [TRADING_MODES.BALANCED]: {
        // No multipliers - use base credits
    },

    [TRADING_MODES.AGGRESSIVE]: {
        // Higher credits for directional indicators
        net_delta: 1.5,
        net_gamma: 1.4,
        max_pain: 1.3,
        pcr: 1.3,
        // Lower credits for volatility
        atm_iv: 0.7,
        iv_rank: 0.7,
        hv_iv_spread: 0.6
    },

    [TRADING_MODES.CONSERVATIVE]: {
        // Higher credits for risk/volatility indicators
        iv_skew: 1.5,
        iv_rank: 1.4,
        atm_iv: 1.3,
        theta_decay: 1.4,
        vega_risk: 1.3,
        // Lower credits for directional
        net_delta: 0.6,
        net_gamma: 0.7
    }
};

// =============================
// Dynamic Total Calculation
// =============================

/**
 * Dynamically calculated total credits
 * This ensures the total always matches the sum of all allocated credits
 */
export const TOTAL_OPTIONS_CREDITS = Object.values(OPTIONS_CREDITS).reduce((sum, credit) => sum + credit, 0);

// =============================
// Utility Functions
// =============================

/**
 * Gets options credits for a specific trading mode
 * @param {string} mode - Trading mode (balanced, aggressive, conservative)
 * @returns {Object} Credit configuration
 */
export const getOptionsCredits = (mode = TRADING_MODES.BALANCED) => {
    if (mode === TRADING_MODES.BALANCED) {
        return OPTIONS_CREDITS;
    }

    const multipliers = MODE_CREDIT_MULTIPLIERS[mode];
    if (!multipliers) return OPTIONS_CREDITS;

    const adjustedCredits = {};
    for (const [id, baseCredit] of Object.entries(OPTIONS_CREDITS)) {
        adjustedCredits[id] = Math.round(baseCredit * (multipliers[id] || 1.0));
    }

    return adjustedCredits;
};

export default {
    OPTIONS_CREDITS,
    TOTAL_OPTIONS_CREDITS,
    MODE_CREDIT_MULTIPLIERS,
    getOptionsCredits
};
