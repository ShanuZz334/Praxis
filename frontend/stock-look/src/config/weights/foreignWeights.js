/**
 * @file foreignWeights.js
 * @purpose Weight configurations for Global Macro page indicators.
 * @responsibilities
 * - Defines weights for 25 global market indicators
 * - Provides POSITIONAL / SWING / INTRADAY mode-specific weight multipliers
 * @key_exports
 * - FOREIGN_WEIGHTS - Base weight configuration
 * - getForeignWeights - Gets weights for specific mode
 * @date 2026-08-14
 */

import { TRADING_MODES } from '../tradingModes.js';

// =============================
// Base Global Macro Indicator Weights
// =============================

export const FOREIGN_WEIGHTS = {
    // Currency (3 indicators - sum: 0.21)
    'dxy':            0.09,
    'usd_inr':        0.08,
    'usdjpy':         0.04,

    // Global Indices (7 indicators - sum: 0.39)
    'sp_futures':     0.09,
    'nasdaq_futures': 0.08,
    'nikkei':         0.05,
    'dax':            0.05,
    'ftse':           0.04,
    'hangseng':       0.04,
    'shanghai':       0.04,

    // Commodities (5 indicators - sum: 0.19)
    'crude':          0.06,
    'gold':           0.05,
    'copper':         0.03,
    'silver':         0.03,
    'natgas':         0.02,

    // Rates & Volatility (4 indicators - sum: 0.21)
    'us_10y_yield':   0.08,
    'vix':            0.06,
    'move':           0.04,
    'bitcoin':        0.03,
};

// =============================
// Trading Mode Weight Multipliers
// =============================

export const MODE_WEIGHT_MULTIPLIERS = {
    // POSITIONAL: Macro regime signals — slow-moving structural indicators dominate
    [TRADING_MODES.POSITIONAL]: {
        // Rates & Vol: macro regime framework for weekly/monthly holds
        us_10y_yield:   1.40,  // Bond market sets the rate regime for equities
        vix:            1.30,  // Structural volatility regime — not just intraday spike
        move:           1.25,  // Bond volatility index — macro stress indicator
        // Currency: structural dollar flows
        dxy:            1.25,  // Dollar strength drives global capital flows
        usd_inr:        1.20,  // USDINR directly impacts Indian equities
        // Safe-havens amplified for risk assessment
        gold:           1.20,  // Gold as regime hedge signal
        // Risk-on speculative assets dampened
        bitcoin:        0.60,  // Crypto noise outweighs signal for multi-week holds
        // Fast-moving futures less relevant positionally
        nasdaq_futures: 0.80,  // Short-term tech momentum not useful for positional
        natgas:         0.80,
    },

    // SWING: Balanced — no multipliers
    [TRADING_MODES.SWING]: {},

    // INTRADAY: Price-action signals — fast-moving assets dominate
    [TRADING_MODES.INTRADAY]: {
        // US Futures amplified — most reactive intraday signals
        sp_futures:     1.40,  // S&P futures lead intraday Indian market direction
        nasdaq_futures: 1.35,  // Nasdaq futures drive intraday tech sentiment
        // Volatility amplified — instant risk-on/off read
        vix:            1.35,  // VIX spike = immediate risk-off across all markets
        // Currency amplified — FX pairs move fast intraday
        dxy:            1.20,
        usd_inr:        1.25,  // USDINR is one of the fastest intraday signals
        // Bitcoin amplified — extreme intraday volatility proxy
        bitcoin:        1.15,
        // Slow macro signals dampened — they don't move intraday
        us_10y_yield:   0.70,  // Yield barely moves intraday
        move:           0.65,  // MOVE index is a weekly metric
    },
};

// =============================
// Utility Functions
// =============================

/**
 * Gets foreign market weights for a specific trading mode
 * @param {string} mode - Trading mode ('positional' | 'swing' | 'intraday')
 * @returns {Object} Weight configuration
 */
export const getForeignWeights = (mode = TRADING_MODES.SWING) => {
    if (mode === TRADING_MODES.SWING) {
        return FOREIGN_WEIGHTS;
    }

    const multipliers = MODE_WEIGHT_MULTIPLIERS[mode];
    if (!multipliers) return FOREIGN_WEIGHTS;

    const adjustedWeights = {};
    for (const [id, baseWeight] of Object.entries(FOREIGN_WEIGHTS)) {
        adjustedWeights[id] = baseWeight * (multipliers[id] || 1.0);
    }

    return adjustedWeights;
};

export default {
    FOREIGN_WEIGHTS,
    MODE_WEIGHT_MULTIPLIERS,
    getForeignWeights
};
