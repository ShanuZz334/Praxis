/**
 * @file optionsWeights.js
 * @purpose Weight configurations for Options page indicators.
 * @responsibilities
 * - Defines weights for 12 options indicators (Open Interest, Greeks, Volatility)
 * - Provides mode-specific weight multipliers
 * @key_exports
 * - OPTIONS_WEIGHTS - Base weight configuration
 * - getOptionsWeights - Gets weights for specific mode
 * @date 2026-02-04
 */

import { TRADING_MODES, getCurrentMode } from '../tradingModes.js';

// =============================
// Base Options Indicator Weights
// =============================

export const OPTIONS_WEIGHTS = {
    // Open Interest (4 indicators)
    'max_pain': 0.12,
    'pcr': 0.10,
    'call_wall': 0.09,
    'put_wall': 0.09,

    // Greeks (4 indicators)
    'net_delta': 0.12,
    'net_gamma': 0.10,
    'theta_decay': 0.08,
    'vega_risk': 0.08,

    // Volatility (4 indicators)
    'atm_iv': 0.08,
    'iv_rank': 0.10,
    'iv_skew': 0.12,
    'hv_iv_spread': 0.08
};

// =============================
// Trading Mode Weight Multipliers
// =============================

export const MODE_WEIGHT_MULTIPLIERS = {
    [TRADING_MODES.BALANCED]: {
        // No multipliers - use base weights
    },

    [TRADING_MODES.AGGRESSIVE]: {
        // Focus on directional indicators
        net_delta: 1.4,
        net_gamma: 1.3,
        max_pain: 1.2,
        pcr: 1.2,
        // Reduce volatility focus
        atm_iv: 0.8,
        iv_rank: 0.8,
        hv_iv_spread: 0.7
    },

    [TRADING_MODES.CONSERVATIVE]: {
        // Focus on risk and volatility
        iv_skew: 1.4,
        iv_rank: 1.3,
        atm_iv: 1.2,
        theta_decay: 1.3,
        vega_risk: 1.2,
        // Reduce directional focus
        net_delta: 0.7,
        net_gamma: 0.8
    }
};

// =============================
// Utility Functions
// =============================

/**
 * Gets options weights for a specific trading mode
 * @param {string} mode - Trading mode (balanced, aggressive, conservative)
 * @returns {Object} Weight configuration
 */
export const getOptionsWeights = (mode = TRADING_MODES.BALANCED) => {
    if (mode === TRADING_MODES.BALANCED) {
        return OPTIONS_WEIGHTS;
    }

    const multipliers = MODE_WEIGHT_MULTIPLIERS[mode];
    if (!multipliers) return OPTIONS_WEIGHTS;

    const adjustedWeights = {};
    for (const [id, baseWeight] of Object.entries(OPTIONS_WEIGHTS)) {
        adjustedWeights[id] = baseWeight * (multipliers[id] || 1.0);
    }

    return adjustedWeights;
};

export default {
    OPTIONS_WEIGHTS,
    MODE_WEIGHT_MULTIPLIERS,
    getOptionsWeights
};
