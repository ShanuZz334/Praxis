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
    // SWING: Balanced — no adjustments, use base weights
    [TRADING_MODES.SWING]: {},

    // POSITIONAL: Risk/stability metrics dominate for multi-week fundamental holds
    [TRADING_MODES.POSITIONAL]: {
        npa:              1.50,  // NPA risk defines long-term fundamental health
        sovereign_risk:   1.40,  // Macro regime for positional thesis
        corp_debt:        1.30,  // Balance sheet strength for multi-week holds
        fiscal_deficit:   1.30,  // Fiscal health is a positional macro signal
        current_account:  1.20,
        // Reduce short-term earnings noise
        eps_yoy:          0.80,  // Trailing earnings less relevant for forward-looking thesis
        earnings_revision: 0.85,
        credit_growth:    0.85
    },

    // INTRADAY: Momentum/catalyst metrics dominate for same-day reactions
    [TRADING_MODES.INTRADAY]: {
        eps_yoy:          1.40,  // Earnings surprise drives intraday moves
        forward_eps:      1.35,  // Forward guidance drives gap-up/gap-down
        earnings_revision: 1.40, // Analyst revision = intraday catalyst
        gdp:              1.25,  // GDP data release is an intraday macro catalyst
        credit_growth:    1.20,  // Credit data surprises move markets intraday
        // Reduce slow-moving structural fundamentals
        npa:              0.70,  // NPA changes are quarterly, not intraday
        sovereign_risk:   0.70,
        corp_debt:        0.75,
        reform_momentum:  0.60   // Policy reform is a slow-moving signal
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
export const getFundamentalsWeights = (mode = TRADING_MODES.SWING) => {
    if (mode === TRADING_MODES.SWING) {
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
