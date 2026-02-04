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
    BALANCED: 'balanced',
    AGGRESSIVE: 'aggressive',
    CONSERVATIVE: 'conservative'
};

export const MODE_METADATA = {
    [TRADING_MODES.BALANCED]: {
        name: 'Balanced',
        description: 'Equal weight distribution across all indicators',
        riskLevel: 'Medium',
        focus: 'All-around analysis',
        icon: '⚖️'
    },
    [TRADING_MODES.AGGRESSIVE]: {
        name: 'Aggressive',
        description: 'Higher weights on momentum and trend-following indicators',
        riskLevel: 'High',
        focus: 'Momentum & Trend',
        icon: '🚀'
    },
    [TRADING_MODES.CONSERVATIVE]: {
        name: 'Conservative',
        description: 'Higher weights on structure, support/resistance, and mean-reversion',
        riskLevel: 'Low',
        focus: 'Structure & Support',
        icon: '🛡️'
    }
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
        return TRADING_MODES.BALANCED;
    }

    const mode = userPreferences.tradingMode.toLowerCase();

    if (Object.values(TRADING_MODES).includes(mode)) {
        return mode;
    }

    return TRADING_MODES.BALANCED;
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

    return config[TRADING_MODES.BALANCED] || config;
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
