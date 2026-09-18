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
    // Open Interest (3 indicators - sum: 0.20)
    'oi_change':      0.08,
    'total_call_oi':  0.06,
    'total_put_oi':   0.06,

    // Put-Call Ratio (2 indicators - sum: 0.30)
    'pcr_oi':         0.16,
    'pcr_volume':     0.14,

    // Greeks (4 indicators - sum: 0.20)
    'delta':          0.07,
    'gamma':          0.05,
    'theta':          0.04,
    'vega':           0.04,

    // Volatility (2 indicators - sum: 0.20)
    'atm_iv':         0.10,
    'iv_rank':        0.10,

    // Market Positioning (3 indicators - sum: 0.10)
    'max_pain':       0.04,
    'expected_move':  0.03,
    'gex':            0.03,
};

// =============================
// Trading Mode Weight Multipliers
// =============================

export const MODE_WEIGHT_MULTIPLIERS = {
    // POSITIONAL: Focus on slow-moving positioning signals
    [TRADING_MODES.POSITIONAL]: {
        // OI change reflects institutional positioning shifts
        oi_change:      1.15,
        total_call_oi:  1.20,
        total_put_oi:   1.20,
        // PCR OI more relevant than volume for positional
        pcr_oi:         1.20,
        pcr_volume:     0.80,
        // Volatility metrics amplified — premium assessment for entry
        iv_rank:        1.30,
        atm_iv:         1.20,
        // Max Pain & Positioning amplified — extremely relevant for expiry-week positional trades
        max_pain:       1.25,
        expected_move:  1.20,
        gex:            1.15,
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
        total_call_oi:  0.85,
        total_put_oi:   0.85,
        // Volatility metrics dampened — IV Rank is a slow signal
        iv_rank:        0.75,
        atm_iv:         0.80,
        // Market positioning: GEX gamma flip is highly relevant for intraday squeezes
        max_pain:       0.70,
        expected_move:  0.80,
        gex:            1.10,
    },
};

// =============================
// Utility Functions
// =============================

/**
 * Gets options weights for a specific trading mode, normalized to sum to 1.00
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
    let totalW = 0;
    for (const [id, baseWeight] of Object.entries(OPTIONS_WEIGHTS)) {
        const w = baseWeight * (multipliers[id] || 1.0);
        adjustedWeights[id] = w;
        totalW += w;
    }

    if (totalW > 0) {
        for (const id of Object.keys(adjustedWeights)) {
            adjustedWeights[id] = parseFloat((adjustedWeights[id] / totalW).toFixed(4));
        }
    }

    return adjustedWeights;
};

export default {
    OPTIONS_WEIGHTS,
    MODE_WEIGHT_MULTIPLIERS,
    getOptionsWeights
};
