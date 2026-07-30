/**
 * @file tradingModes.js
 * @purpose Defines trading mode profiles and mode selection logic.
 * @responsibilities
 * - Defines available trading modes (Balanced, Aggressive, Conservative)
 * - Provides mode selector utility
 * - Integrates with user preferences
 * @key_exports
 * - TRADING_MODES - Mode definitions
 * - getCurrentMode - Gets active mode from user preferences
 * - getModeConfig - Gets config for specific mode
 * @date 2026-02-04
 */

// =============================
// Trading Mode Definitions
// =============================

export const TRADING_MODES = {
    POSITIONAL: 'positional',
    SWING:      'swing',
    INTRADAY:   'intraday',
};

export const MODE_METADATA = {
    [TRADING_MODES.POSITIONAL]: {
        name: 'Positional',
        description: 'Heavy weight on valuation quality, earnings compounding, and balance sheet strength. Holding period: weeks to months.',
        riskLevel: 'Low-Medium',
        focus: 'Fundamental Quality & Entry Point',
        icon: '📐',
        horizon: 'Weeks – Months',
    },
    [TRADING_MODES.SWING]: {
        name: 'Swing',
        description: 'Balanced weight across all indicators. Equal focus on fundamentals, flows, and breadth. Holding period: days to weeks.',
        riskLevel: 'Medium',
        focus: 'Balanced Analysis',
        icon: '⚖️',
        horizon: 'Days – Weeks',
    },
    [TRADING_MODES.INTRADAY]: {
        name: 'Intraday',
        description: 'Heavy weight on institutional flows, market breadth, and VIX. Trailing valuation metrics are locked to neutral. Holding period: same day.',
        riskLevel: 'High',
        focus: 'Flows, Breadth & Risk Environment',
        icon: '⚡',
        horizon: 'Same Day',
    },
};


// =============================
// Mode Selection Utilities
// =============================

/**
 * Gets the current trading mode from user preferences
 * @param {Object} userPreferences - User preferences object
 * @returns {string} Current trading mode
 */
export const getCurrentMode = (userPreferences) => {
    if (!userPreferences || !userPreferences.tradingMode) {
        return TRADING_MODES.SWING;
    }

    const mode = userPreferences.tradingMode.toLowerCase();

    if (Object.values(TRADING_MODES).includes(mode)) {
        return mode;
    }

    return TRADING_MODES.SWING;
};

/**
 * Gets configuration for a specific mode from a config object
 * @param {Object} config - Configuration object with mode variants
 * @param {string} mode - Trading mode
 * @returns {*} Configuration for the specified mode
 */
export const getModeConfig = (config, mode = TRADING_MODES.BALANCED) => {
    if (!config) return null;

    if (config[mode]) {
        return config[mode];
    }

    return config[TRADING_MODES.SWING] || config;
};

/**
 * Applies mode multipliers to a base configuration
 * @param {Object} baseConfig - Base configuration
 * @param {Object} multipliers - Mode-specific multipliers
 * @returns {Object} Modified configuration
 */
export const applyModeMultipliers = (baseConfig, multipliers) => {
    if (!multipliers) return baseConfig;

    return {
        ...baseConfig,
        weight: baseConfig.weight * (multipliers.weight || 1),
        creditAllocation: Math.round(baseConfig.creditAllocation * (multipliers.credit || 1))
    };
};

export default {
    TRADING_MODES,
    MODE_METADATA,
    getCurrentMode,
    getModeConfig,
    applyModeMultipliers
};
