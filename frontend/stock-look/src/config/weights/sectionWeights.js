/**
 * @file sectionWeights.js
 * @purpose Section weight configurations for technical analysis categories.
 * @responsibilities
 * - Defines weights for 6 main technical sections (Trend, Momentum, Volatility, Volume, Breadth, Structure)
 * - Provides mode-specific section weight multipliers
 * @key_exports
 * - technicalSections - Section definitions with weights
 * - getSectionWeights - Gets section weights for specific mode
 * @date 2026-02-04
 */

import { TRADING_MODES, getCurrentMode } from '../tradingModes.js';

// =============================
// Base Section Weights
// =============================

export const technicalSections = [
    { id: 'Trend', label: 'Trend', w: 0.25, icon: '📈' },
    { id: 'Momentum', label: 'Mom', w: 0.20, icon: '🚀' },
    { id: 'Volatility', label: 'Vol', w: 0.15, icon: '⚡' },
    { id: 'Volume', label: 'Vol', w: 0.15, icon: '📊' },
    { id: 'Breadth', label: 'Brd', w: 0.15, icon: '🌍' },
    { id: 'Structure', label: 'Str', w: 0.10, icon: '🏗️' }
];

// =============================
// Trading Mode Section Multipliers
// =============================

export const SECTION_MODE_MULTIPLIERS = {
    [TRADING_MODES.BALANCED]: {
        // No multipliers - use base weights
    },

    [TRADING_MODES.AGGRESSIVE]: {
        Trend: 1.2,
        Momentum: 1.4,
        Volatility: 0.9,
        Volume: 1.0,
        Breadth: 1.0,
        Structure: 0.7
    },

    [TRADING_MODES.CONSERVATIVE]: {
        Trend: 1.0,
        Momentum: 0.7,
        Volatility: 1.2,
        Volume: 1.1,
        Breadth: 1.1,
        Structure: 1.4
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
export const getSectionWeights = (userPreferences = null) => {
    const mode = getCurrentMode(userPreferences);

    if (mode === TRADING_MODES.BALANCED) {
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
