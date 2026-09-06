/**
 * @file optionsWeights.js
 * @purpose Weight configurations for Options page indicators.
 * @responsibilities
 * - Defines base weights for 13 options indicators
 * - Provides POSITIONAL / SWING / INTRADAY mode-specific weight multipliers
 * @key_exports
 * - OPTIONS_WEIGHTS - Base weight configuration
 * - getOptionsWeights - Gets weights for specific mode
 * @date 2026-08-14
 */

import { TRADING_MODES } from '../tradingModes.js';

// =============================
// Base Options Indicator Weights
// =============================

export const OPTIONS_WEIGHTS = {
    // Open Interest (3 indicators)
    'total_call_oi':  0.10,
    'total_put_oi':   0.10,
    'oi_change':      0.10,

    // Put-Call Ratio (2 indicators)
    'pcr_oi':         0.12,
    'pcr_volume':     0.10,

    // Greeks (4 indicators)
    'delta':          0.12,
    'gamma':          0.10,
    'theta':          0.08,
    'vega':           0.08,

    // Volatility (3 indicators)
    'atm_iv':         0.08,
    'iv_rank':        0.10,
    'iv_percentile':  0.08,

    // Market Positioning (1 indicator)
    'max_pain':       0.12,
};

// =============================
// Trading Mode Weight Multipliers
// =============================

export const MODE_WEIGHT_MULTIPLIERS = {
    // POSITIONAL: Focus on slow-moving positioning signals
    [TRADING_MODES.POSITIONAL]: {
        // OI walls matter — they show where big money is writing
        total_call_oi:  1.15,
        total_put_oi:   1.15,
        // PCR OI more relevant than volume for positional
        pcr_oi:         1.20,
        pcr_volume:     0.80,
        // Volatility metrics amplified — premium assessment for entry
        iv_rank:        1.30,
        iv_percentile:  1.25,
        atm_iv:         1.20,
        // Max Pain amplified — extremely relevant for expiry-week positional trades
        max_pain:       1.25,
        // Greeks dampened — short-dated Delta/Gamma less relevant for weekly holds
        delta:          0.75,
        gamma:          0.70,
        theta:          0.80,
    },

    // SWING: Balanced — no multipliers needed
    [TRADING_MODES.SWING]: {},

    // INTRADAY: Focus on real-time Greeks and volume PCR
    [TRADING_MODES.INTRADAY]: {
        // Greeks amplified — live delta/gamma drives P&L in real time
        delta:          1.40,
        gamma:          1.35,
        theta:          1.20,
        vega:           1.15,
        // PCR volume > PCR OI for intraday tape reading
        pcr_volume:     1.30,
        pcr_oi:         0.90,
        // OI change most actionable intraday signal
        oi_change:      1.25,
        // Volatility metrics dampened — IV Rank/Percentile are slow signals
        iv_rank:        0.75,
        iv_percentile:  0.70,
        // Max Pain irrelevant for intraday
        max_pain:       0.60,
    },
};

// =============================
// Utility Functions
// =============================

/**
 * Gets options weights for a specific trading mode
 * @param {string} mode - Trading mode ('positional' | 'swing' | 'intraday')
 * @returns {Object} Weight configuration
 */
export const getOptionsWeights = (mode = TRADING_MODES.SWING) => {
    if (mode === TRADING_MODES.SWING) {
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
