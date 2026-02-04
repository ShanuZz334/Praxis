/**
 * @file fundamentalsCredits.js
 * @purpose Credit configurations for Fundamentals page indicators.
 * @responsibilities
 * - Defines credits for 30 fundamental indicators
 * - Provides mode-specific credit multipliers
 * - Dynamically calculates total credits
 * @key_exports
 * - FUNDAMENTALS_CREDITS - Base credit configuration
 * - TOTAL_FUNDAMENTALS_CREDITS - Dynamic total
 * - getFundamentalsCredits - Gets credits for specific mode
 * @date 2026-02-04
 */

import { TRADING_MODES, getCurrentMode } from '../tradingModes.js';

// =============================
// Base Fundamentals Indicator Credits
// =============================

export const FUNDAMENTALS_CREDITS = {
    // Valuation (5 indicators) - 60 credits
    'nifty_pe': 11,
    'forward_pe': 12,
    'nifty_pb': 10,
    'earnings_yield': 14,
    'mcap_gdp': 13,

    // Earnings (5 indicators) - 52 credits
    'eps_yoy': 12,
    'forward_eps': 11,
    'earnings_revision': 12,
    'sector_earnings': 8,
    'profit_margin': 9,

    // Macro (6 indicators) - 64 credits
    'gdp': 11,
    'cpi': 12,
    'repo': 12,
    'policy_stance': 10,
    'fiscal_deficit': 9,
    'current_account': 10,

    // Liquidity (5 indicators) - 46 credits
    'fii': 10,
    'dii': 9,
    'fii_trend': 10,
    'system_liquidity': 9,
    'mf_flows': 8,

    // Sector (4 indicators) - 29 credits
    'sector_valuation': 7,
    'sector_growth': 8,
    'sector_concentration': 6,
    'cyc_def': 8,

    // Corporate (4 indicators) - 29 credits
    'policy_tailwinds': 7,
    'corp_debt': 8,
    'credit_growth': 8,
    'tax_env': 6,

    // Global (4 indicators) - 32 credits
    'global_growth': 7,
    'crude': 8,
    'usdinr': 8,
    'global_liq': 9,

    // Risk (3 indicators) - 21 credits
    'sovereign_risk': 7,
    'npa': 8,
    'reform_momentum': 6
};

// =============================
// Trading Mode Credit Multipliers
// =============================

export const MODE_CREDIT_MULTIPLIERS = {
    [TRADING_MODES.BALANCED]: {
        // No multipliers - use base credits
    },

    [TRADING_MODES.AGGRESSIVE]: {
        // Higher credits for growth indicators
        eps_yoy: 1.5,
        forward_eps: 1.4,
        earnings_revision: 1.5,
        gdp: 1.4,
        credit_growth: 1.4,
        // Lower credits for risk indicators
        npa: 0.6,
        sovereign_risk: 0.6,
        corp_debt: 0.7
    },

    [TRADING_MODES.CONSERVATIVE]: {
        // Higher credits for risk/stability
        npa: 1.6,
        sovereign_risk: 1.5,
        corp_debt: 1.4,
        fiscal_deficit: 1.4,
        current_account: 1.3,
        // Lower credits for growth
        eps_yoy: 0.6,
        forward_eps: 0.7,
        credit_growth: 0.7
    }
};

// =============================
// Dynamic Total Calculation
// =============================

/**
 * Dynamically calculated total credits
 * This ensures the total always matches the sum of all allocated credits
 */
export const TOTAL_FUNDAMENTALS_CREDITS = Object.values(FUNDAMENTALS_CREDITS).reduce((sum, credit) => sum + credit, 0);

// =============================
// Utility Functions
// =============================

/**
 * Gets fundamentals credits for a specific trading mode
 * @param {string} mode - Trading mode (balanced, aggressive, conservative)
 * @returns {Object} Credit configuration
 */
export const getFundamentalsCredits = (mode = TRADING_MODES.BALANCED) => {
    if (mode === TRADING_MODES.BALANCED) {
        return FUNDAMENTALS_CREDITS;
    }

    const multipliers = MODE_CREDIT_MULTIPLIERS[mode];
    if (!multipliers) return FUNDAMENTALS_CREDITS;

    const adjustedCredits = {};
    for (const [id, baseCredit] of Object.entries(FUNDAMENTALS_CREDITS)) {
        adjustedCredits[id] = Math.round(baseCredit * (multipliers[id] || 1.0));
    }

    return adjustedCredits;
};

export default {
    FUNDAMENTALS_CREDITS,
    TOTAL_FUNDAMENTALS_CREDITS,
    MODE_CREDIT_MULTIPLIERS,
    getFundamentalsCredits
};
