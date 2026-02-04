/**
 * @file foreignSectionWeights.js
 * @purpose Section weight configurations for Foreign Markets page categories.
 * @responsibilities
 * - Defines weights for 4 global market sections (Currency, Indices, Commodities, Rates)
 * - Provides mode-specific section weight multipliers
 * @key_exports
 * - globalSections - Section definitions with weights
 * - getForeignSectionWeights - Gets section weights for specific mode
 * @date 2026-02-04
 */

import { TRADING_MODES, getCurrentMode } from '../tradingModes.js';

// =============================
// Base Section Weights
// =============================

export const globalSections = [
    { id: "currency", label: "FX", w: 0.30, icon: "💱" },
    { id: "indices", label: "Indices", w: 0.35, icon: "📊" },
    { id: "commodities", label: "Commod", w: 0.20, icon: "🛢️" },
    { id: "rates", label: "Rates", w: 0.15, icon: "📈" }
];

// =============================
// Trading Mode Section Multipliers
// =============================

export const SECTION_MODE_MULTIPLIERS = {
    [TRADING_MODES.BALANCED]: {
        // No multipliers - use base weights
    },

    [TRADING_MODES.AGGRESSIVE]: {
        'indices': 1.4,
        'commodities': 1.3,
        'currency': 1.0,
        'rates': 0.7
    },

    [TRADING_MODES.CONSERVATIVE]: {
        'rates': 1.5,
        'currency': 1.3,
        'commodities': 1.1,
        'indices': 0.7
    }
};

// =============================
// Utility Functions
// =============================

/**
 * Gets section weights for a specific trading mode
 * @param {Object} userPreferences - User preferences object
 * @returns {Array} Section configuration with adjusted weights
 */
export const getForeignSectionWeights = (userPreferences = null) => {
    const mode = getCurrentMode(userPreferences);

    if (mode === TRADING_MODES.BALANCED) {
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
