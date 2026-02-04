/**
 * @file fundamentalsWeights.js
 * @purpose Weight configurations for Fundamentals page indicators.
 * @responsibilities
 * - Defines weights for 30 fundamental indicators across 8 categories
 * - Provides mode-specific weight multipliers
 * @key_exports
 * - FUNDAMENTALS_WEIGHTS - Base weight configuration
 * - getFundamentalsWeights - Gets weights for specific mode
 * @date 2026-02-04
 */

import { TRADING_MODES, getCurrentMode } from '../tradingModes.js';

// =============================
// Base Fundamentals Indicator Weights
// =============================

export const FUNDAMENTALS_WEIGHTS = {
    // Valuation (5 indicators)
    'nifty_pe': 0.08,
    'forward_pe': 0.09,
    'nifty_pb': 0.07,
    'earnings_yield': 0.10,
    'mcap_gdp': 0.09,

    // Earnings (5 indicators)
    'eps_yoy': 0.09,
    'forward_eps': 0.08,
    'earnings_revision': 0.09,
    'sector_earnings': 0.06,
    'profit_margin': 0.07,

    // Macro (6 indicators)
    'gdp': 0.08,
    'cpi': 0.09,
    'repo': 0.09,
    'policy_stance': 0.07,
    'fiscal_deficit': 0.07,
    'current_account': 0.07,

    // Liquidity (5 indicators)
    'fii': 0.07,
    'dii': 0.07,
    'fii_trend': 0.07,
    'system_liquidity': 0.07,
    'mf_flows': 0.06,

    // Sector (4 indicators)
    'sector_valuation': 0.05,
    'sector_growth': 0.06,
    'sector_concentration': 0.04,
    'cyc_def': 0.06,

    // Corporate (4 indicators)
    'policy_tailwinds': 0.05,
    'corp_debt': 0.06,
    'credit_growth': 0.06,
    'tax_env': 0.04,

    // Global (4 indicators)
    'global_growth': 0.05,
    'crude': 0.06,
    'usdinr': 0.06,
    'global_liq': 0.07,

    // Risk (3 indicators)
    'sovereign_risk': 0.05,
    'npa': 0.06,
    'reform_momentum': 0.04
};

// =============================
// Trading Mode Weight Multipliers
// =============================

export const MODE_WEIGHT_MULTIPLIERS = {
    [TRADING_MODES.BALANCED]: {
        // No multipliers - use base weights
    },

    [TRADING_MODES.AGGRESSIVE]: {
        // Focus on growth and momentum
        eps_yoy: 1.4,
        forward_eps: 1.3,
        earnings_revision: 1.4,
        gdp: 1.3,
        credit_growth: 1.3,
        // Reduce defensive focus
        npa: 0.7,
        sovereign_risk: 0.7,
        corp_debt: 0.8
    },

    [TRADING_MODES.CONSERVATIVE]: {
        // Focus on risk and stability
        npa: 1.5,
        sovereign_risk: 1.4,
        corp_debt: 1.3,
        fiscal_deficit: 1.3,
        current_account: 1.2,
        // Reduce growth focus
        eps_yoy: 0.7,
        forward_eps: 0.8,
        credit_growth: 0.8
    }
};

// =============================
// Utility Functions
// =============================

/**
 * Gets fundamentals weights for a specific trading mode
 * @param {string} mode - Trading mode (balanced, aggressive, conservative)
 * @returns {Object} Weight configuration
 */
export const getFundamentalsWeights = (mode = TRADING_MODES.BALANCED) => {
    if (mode === TRADING_MODES.BALANCED) {
        return FUNDAMENTALS_WEIGHTS;
    }

    const multipliers = MODE_WEIGHT_MULTIPLIERS[mode];
    if (!multipliers) return FUNDAMENTALS_WEIGHTS;

    const adjustedWeights = {};
    for (const [id, baseWeight] of Object.entries(FUNDAMENTALS_WEIGHTS)) {
        adjustedWeights[id] = baseWeight * (multipliers[id] || 1.0);
    }

    return adjustedWeights;
};

export default {
    FUNDAMENTALS_WEIGHTS,
    MODE_WEIGHT_MULTIPLIERS,
    getFundamentalsWeights
};
