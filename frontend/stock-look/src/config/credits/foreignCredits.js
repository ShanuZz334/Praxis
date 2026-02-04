/**
 * @file foreignCredits.js
 * @purpose Credit configurations for Foreign Markets page indicators.
 * @responsibilities
 * - Defines credits for 22 global market indicators
 * - Provides mode-specific credit multipliers
 * - Dynamically calculates total credits
 * @key_exports
 * - FOREIGN_CREDITS - Base credit configuration
 * - TOTAL_FOREIGN_CREDITS - Dynamic total
 * - getForeignCredits - Gets credits for specific mode
 * @date 2026-02-04
 */

import { TRADING_MODES, getCurrentMode } from '../tradingModes.js';

// =============================
// Base Foreign Market Indicator Credits
// =============================

export const FOREIGN_CREDITS = {
    // Currency (3 indicators) - 26 credits
    'dxy': 9,
    'eurusd': 8,
    'usdjpy': 9,

    // Global Indices (9 indicators) - 66 credits
    'sp500': 9,
    'nasdaq': 9,
    'nikkei': 8,
    'ftse': 7,
    'dax': 7,
    'hangseng': 6,
    'shanghai': 6,
    'cac40': 7,
    'eurostoxx': 7,

    // Commodities (7 indicators) - 47 credits
    'gold': 8,
    'crude': 8,
    'copper': 7,
    'silver': 7,
    'natgas': 6,
    'wheat': 6,
    'aluminum': 6,

    // Rates & Volatility (3 indicators) - 27 credits
    'us10y': 10,
    'vix': 9,
    'move': 8
};

// =============================
// Trading Mode Credit Multipliers
// =============================

export const MODE_CREDIT_MULTIPLIERS = {
    [TRADING_MODES.BALANCED]: {
        // No multipliers - use base credits
    },

    [TRADING_MODES.AGGRESSIVE]: {
        // Higher credits for risk-on indicators
        nasdaq: 1.5,
        sp500: 1.4,
        crude: 1.4,
        copper: 1.3,
        // Lower credits for safe-haven
        gold: 0.6,
        us10y: 0.7,
        vix: 0.6
    },

    [TRADING_MODES.CONSERVATIVE]: {
        // Higher credits for safe-haven
        gold: 1.6,
        us10y: 1.5,
        vix: 1.4,
        dxy: 1.3,
        // Lower credits for risk-on
        nasdaq: 0.6,
        crude: 0.7,
        copper: 0.6
    }
};

// =============================
// Dynamic Total Calculation
// =============================

/**
 * Dynamically calculated total credits
 * This ensures the total always matches the sum of all allocated credits
 */
export const TOTAL_FOREIGN_CREDITS = Object.values(FOREIGN_CREDITS).reduce((sum, credit) => sum + credit, 0);

// =============================
// Utility Functions
// =============================

/**
 * Gets foreign market credits for a specific trading mode
 * @param {string} mode - Trading mode (balanced, aggressive, conservative)
 * @returns {Object} Credit configuration
 */
export const getForeignCredits = (mode = TRADING_MODES.BALANCED) => {
    if (mode === TRADING_MODES.BALANCED) {
        return FOREIGN_CREDITS;
    }

    const multipliers = MODE_CREDIT_MULTIPLIERS[mode];
    if (!multipliers) return FOREIGN_CREDITS;

    const adjustedCredits = {};
    for (const [id, baseCredit] of Object.entries(FOREIGN_CREDITS)) {
        adjustedCredits[id] = Math.round(baseCredit * (multipliers[id] || 1.0));
    }

    return adjustedCredits;
};

export default {
    FOREIGN_CREDITS,
    TOTAL_FOREIGN_CREDITS,
    MODE_CREDIT_MULTIPLIERS,
    getForeignCredits
};
