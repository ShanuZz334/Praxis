/**
 * @file sectionWeights.js
 * @purpose Section weight configurations for technical analysis categories.
 * @responsibilities
 * - Defines weights for 6 main technical sections (Trend, Momentum, Volatility, Volume, Breadth, Structure)
 * - Provides POSITIONAL / SWING / INTRADAY mode-specific section weight multipliers
 * @key_exports
 * - technicalSections - Section definitions with weights
 * - getSectionWeights - Gets section weights for specific mode
 * @date 2026-08-14
 */

import { TRADING_MODES } from '../tradingModes.js';

// =============================
// Base Section Weights
// =============================

export const technicalSections = [
    { id: 'Trend',      label: 'Trend', w: 0.25, icon: 'TrendingUp' },
    { id: 'Momentum',   label: 'Mom',   w: 0.20, icon: 'Zap' },
    { id: 'Volatility', label: 'Vol',   w: 0.15, icon: 'Activity' },
    { id: 'Volume',     label: 'Vol',   w: 0.15, icon: 'BarChart2' },
    { id: 'Breadth',    label: 'Brd',   w: 0.15, icon: 'Globe' },
    { id: 'Structure',  label: 'Str',   w: 0.10, icon: 'Layers' }
];

// =============================
// Trading Mode Section Multipliers
// =============================

export const SECTION_MODE_MULTIPLIERS = {
    // SWING: Balanced — no adjustments, use base weights
    [TRADING_MODES.SWING]: {},

    // POSITIONAL: Trend and Structure dominate for multi-week holds.
    // Momentum matters but less than trend. Breadth signals matter for regime.
    [TRADING_MODES.POSITIONAL]: {
        Trend:      1.30,  // Trend direction is the core positional signal
        Structure:  1.25,  // Support/Resistance levels define the positional thesis
        Breadth:    1.15,  // Market breadth validates structural moves
        Momentum:   0.90,  // Momentum oscillators are noisier over multi-week holds
        Volatility: 0.80,  // Volatility regimes matter less for positional stops
        Volume:     0.85,  // Volume signals can be misleading over longer windows
    },

    // INTRADAY: Momentum is king. Volume confirms. Trend provides backdrop.
    // Structure has minimal influence on fast intraday moves.
    [TRADING_MODES.INTRADAY]: {
        Momentum:   1.40,  // RSI, MACD, StochRSI — the primary intraday read
        Volume:     1.30,  // Volume surge = conviction; VWAP is the intraday anchor
        Volatility: 1.20,  // ATR / BB width drives intraday range expectations
        Trend:      0.85,  // Trend backdrop matters but secondary intraday
        Breadth:    0.70,  // Index breadth is a slow intraday signal
        Structure:  0.60,  // S/R levels take time to form — minimal intraday relevance
    },
};

// =============================
// Utility Functions
// =============================

/**
 * Gets section weights for a specific trading mode
 * @param {string} mode - Trading mode ('positional' | 'swing' | 'intraday')
 * @returns {Array} Section configuration with adjusted weights
 */
export const getSectionWeights = (mode = TRADING_MODES.SWING) => {
    if (mode === TRADING_MODES.SWING) {
        return technicalSections;
    }

    const multipliers = SECTION_MODE_MULTIPLIERS[mode];
    if (!multipliers) return technicalSections;

    return technicalSections.map(section => ({
        ...section,
        w: section.w * (multipliers[section.id] || 1.0)
    }));
};

export default {
    technicalSections,
    SECTION_MODE_MULTIPLIERS,
    getSectionWeights
};
