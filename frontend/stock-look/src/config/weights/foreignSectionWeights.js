/**
 * @file foreignSectionWeights.js
 * @purpose Section weight configurations for Global Macro page categories.
 * @responsibilities
 * - Defines weights for 4 global market sections (Currency, Commodities, Rates, Indices)
 * - Provides POSITIONAL / SWING / INTRADAY mode-specific section weight multipliers
 * @key_exports
 * - globalSections - Section definitions with weights
 * - getForeignSectionWeights - Gets section weights for specific mode
 * @date 2026-08-14
 */

import { TRADING_MODES } from '../tradingModes.js';

// =============================
// Base Section Weights
// =============================

export const globalSections = [
    { id: "currency",    label: "FX",        w: 0.25, icon: "CircleDollarSign" },
    { id: "indices",     label: "Indices",   w: 0.30, icon: "BarChart2" },
    { id: "commodities", label: "Commod",    w: 0.20, icon: "Fuel" },
    { id: "rates",       label: "Rates",     w: 0.25, icon: "TrendingUp" }
];

// =============================
// Trading Mode Section Multipliers
// =============================

export const SECTION_MODE_MULTIPLIERS = {
    // POSITIONAL: Macro regime signals dominate — Rates & Vol determine multi-week direction
    [TRADING_MODES.POSITIONAL]: {
        rates:       1.35,  // US10Y + VIX + MOVE define the macro regime for weekly holds
        currency:    1.20,  // Structural FX flows (DXY, USDINR) matter for positional entries
        commodities: 1.10,  // Gold/Crude as regime indicators
        indices:     0.75,  // Global index levels change slowly — less urgent positionally
    },

    // SWING: Balanced — use base weights
    [TRADING_MODES.SWING]: {},

    // INTRADAY: Price-action signals dominate — US Futures + FX move fastest intraday
    [TRADING_MODES.INTRADAY]: {
        indices:     1.40,  // US/Global index futures are the primary intraday signal
        currency:    1.25,  // DXY & FX pairs drive intraday cross-asset moves
        commodities: 0.80,  // Crude/Gold move slowly intraday vs futures
        rates:       0.70,  // US10Y yield changes are slow intraday signals
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
export const getForeignSectionWeights = (mode = TRADING_MODES.SWING) => {
    if (mode === TRADING_MODES.SWING) {
        return globalSections;
    }

    const multipliers = SECTION_MODE_MULTIPLIERS[mode];
    if (!multipliers) return globalSections;

    return globalSections.map(section => ({
        ...section,
        w: section.w * (multipliers[section.id] || 1.0)
    }));
};

export default {
    globalSections,
    SECTION_MODE_MULTIPLIERS,
    getForeignSectionWeights
};
