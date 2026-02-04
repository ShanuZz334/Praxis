/**
 * @file optionsSectionWeights.js
 * @purpose Section weight configurations for Options page categories.
 * @responsibilities
 * - Defines weights for 3 options sections (Open Interest, Greeks, Volatility)
 * - Provides mode-specific section weight multipliers
 * @key_exports
 * - optionsSections - Section definitions with weights
 * - getOptionsSectionWeights - Gets section weights for specific mode
 * @date 2026-02-04
 */

import { TRADING_MODES, getCurrentMode } from '../tradingModes.js';

// =============================
// Base Section Weights
// =============================

export const optionsSections = [
    { id: 'Open Interest', label: 'Open Interest', w: 0.4 },
    { id: 'Greeks', label: 'Greeks', w: 0.35 },
    { id: 'Volatility', label: 'Volatility', w: 0.25 }
];

// =============================
// Trading Mode Section Multipliers
// =============================

export const SECTION_MODE_MULTIPLIERS = {
    [TRADING_MODES.BALANCED]: {
        // No multipliers - use base weights
    },

    [TRADING_MODES.AGGRESSIVE]: {
        'Open Interest': 1.3,
        'Greeks': 1.4,
        'Volatility': 0.7
    },

    [TRADING_MODES.CONSERVATIVE]: {
        'Open Interest': 1.0,
        'Greeks': 0.8,
        'Volatility': 1.5
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
export const getOptionsSectionWeights = (userPreferences = null) => {
    const mode = getCurrentMode(userPreferences);

    if (mode === TRADING_MODES.BALANCED) {
        return optionsSections;
    }

    const multipliers = SECTION_MODE_MULTIPLIERS[mode];
    if (!multipliers) return optionsSections;

    return optionsSections.map(section => ({
        ...section,
        w: section.w * (multipliers[section.id] || 1.0)
    }));
};

export default {
    optionsSections,
    SECTION_MODE_MULTIPLIERS,
    getOptionsSectionWeights
};
