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
    // Currency (4 indicators)
    'dxy':            0.10,
    'usd_inr':        0.09,
    'eurusd':         0.07,
    'usdjpy':         0.07,

    // Global Indices (9 indicators)
    'sp_futures':     0.09,
    'nasdaq_futures': 0.08,
    'dow_futures':    0.07,
    'nikkei':         0.07,
    'ftse':           0.06,
    'dax':            0.06,
    'hangseng':       0.05,
    'shanghai':       0.05,
    'cac40':          0.05,
    'eurostoxx':      0.05,

    // Commodities (7 indicators)
    'crude':          0.08,
    'gold':           0.08,
    'copper':         0.06,
    'silver':         0.05,
    'natgas':         0.05,
    'wheat':          0.04,
    'aluminum':       0.04,

    // Rates & Volatility (4 indicators)
    'us_10y_yield':   0.10,
    'vix':            0.09,
    'move':           0.07,
    'bitcoin':        0.05,
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
        wheat:          0.75,
        aluminum:       0.75,
    },

    // SWING: Balanced — no multipliers
    [TRADING_MODES.SWING]: {},

    // INTRADAY: Price-action signals — fast-moving assets dominate
    [TRADING_MODES.INTRADAY]: {
        // US Futures amplified — most reactive intraday signals
        sp_futures:     1.40,  // S&P futures lead intraday Indian market direction
        nasdaq_futures: 1.35,  // Nasdaq futures drive intraday tech sentiment
        dow_futures:    1.25,
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
        wheat:          0.60,  // Agricultural commodities irrelevant intraday
        aluminum:       0.60,
        cac40:          0.80,  // European markets close by Indian afternoon
        eurostoxx:      0.80,
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
