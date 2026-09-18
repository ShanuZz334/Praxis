/**
 * @file optionsSectionWeights.js
 * @purpose Section weight configurations for Options page categories.
 * @responsibilities
 * - Defines weights for 5 options sections (OI, PCR, Greeks, Volatility, Market Positioning)
 * - Provides mode-specific section weight multipliers (POSITIONAL / SWING / INTRADAY)
 * @key_exports
 * - optionsSections - Section definitions with weights
 * - getOptionsSectionWeights - Gets section weights for specific mode
 * @date 2026-08-14
 */

import { TRADING_MODES } from '../tradingModes.js';

// =============================
// Base Section Weights
// =============================

export const optionsSections = [
    { id: 'Open Interest',      label: 'Open Interest',      w: 0.20 },
    { id: 'Put-Call Ratio',     label: 'Put-Call Ratio',     w: 0.30 },
    { id: 'Greeks',             label: 'Greeks',             w: 0.20 },
    { id: 'Volatility',         label: 'Volatility',         w: 0.20 },
    { id: 'Market Positioning', label: 'Market Positioning', w: 0.10 },
];

// =============================
// Trading Mode Section Multipliers
// =============================

export const SECTION_MODE_MULTIPLIERS = {
    // POSITIONAL: Bigger picture — OI and Volatility dominate, short-term Greeks less relevant
    [TRADING_MODES.POSITIONAL]: {
        'Open Interest':      1.20,  // OI walls matter for weekly/monthly positioning
        'Put-Call Ratio':     1.10,  // PCR confirms sentiment direction
        'Greeks':             0.75,  // Short-term Delta/Gamma irrelevant for multi-day holds
        'Volatility':         1.30,  // IV Rank/Percentile critical for entry premium assessment
        'Market Positioning': 1.20,  // Max Pain highly relevant near expiry for positional
    },

    // SWING: Balanced — use base weights (no multipliers)
    [TRADING_MODES.SWING]: {},

    // INTRADAY: Short-term Greeks + PCR dominate, slower IV metrics less actionable
    [TRADING_MODES.INTRADAY]: {
        'Open Interest':      0.90,  // OI walls still relevant but less granular intraday
        'Put-Call Ratio':     1.30,  // Real-time PCR volume is the primary tape signal
        'Greeks':             1.40,  // Delta/Gamma dominate — live option price movement
        'Volatility':         0.80,  // ATM IV shifts slowly; IV Rank not an intraday signal
        'Market Positioning': 0.70,  // Max Pain is an expiry-week metric, not intraday
    },
};

// =============================
// Utility Functions
// =============================

/**
 * Gets section weights for a specific trading mode, normalized to sum to 1.00
 * @param {string} mode - Trading mode ('positional' | 'swing' | 'intraday')
 * @returns {Array} Section configuration with adjusted weights
 */
export const getOptionsSectionWeights = (mode = TRADING_MODES.SWING) => {
    if (mode === TRADING_MODES.SWING) {
        return optionsSections;
    }

    const multipliers = SECTION_MODE_MULTIPLIERS[mode];
    if (!multipliers) return optionsSections;

    const unnormalized = optionsSections.map(section => ({
        ...section,
        w: section.w * (multipliers[section.id] || 1.0)
    }));

    const totalW = unnormalized.reduce((sum, s) => sum + s.w, 0);
    return unnormalized.map(s => ({
        ...s,
        w: totalW > 0 ? parseFloat((s.w / totalW).toFixed(4)) : s.w
    }));
};

export default {
    optionsSections,
    SECTION_MODE_MULTIPLIERS,
    getOptionsSectionWeights
};
