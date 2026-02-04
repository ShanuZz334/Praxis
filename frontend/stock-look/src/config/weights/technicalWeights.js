/**
 * @file technicalWeights.js
 * @purpose Weight configurations for technical indicators across trading modes.
 * @responsibilities
 * - Defines base weights for 167 technical indicators
 * - Provides mode-specific weight multipliers (Balanced, Aggressive, Conservative)
 * - Organizes weights by category (Trend, Momentum, Volatility, Volume, Structure, Breadth)
 * @key_exports
 * - TECHNICAL_WEIGHTS - Base weights for all indicators
 * - MODE_MULTIPLIERS - Trading mode weight adjustments
 * - getTechnicalWeights - Gets weights for specific mode
 * @date 2026-02-04
 */

import { TRADING_MODES, getModeConfig } from '../tradingModes.js';

// =============================
// Base Technical Indicator Weights
// =============================

export const TECHNICAL_WEIGHTS = {
    // TREND INDICATORS
    't_ema_cross': 0.06,
    't_golden_cross': 0.08,
    't_adx': 0.05,
    't_supertrend': 0.07,
    't_ichimoku': 0.08,
    't_consistency': 0.04,

    // MOMENTUM INDICATORS
    'm_rsi': 0.05,
    'm_rsi_slope': 0.04,
    'm_macd_hist': 0.06,
    'm_macd_cross': 0.04,
    'm_stoch': 0.04,
    'm_roc': 0.05,
    'm_thrust': 0.05,
    'm_rsi_range': 0.05,
    'm_macd_impulse': 0.06,
    'm_ppo': 0.04,
    'm_klinger': 0.04,
    'm_tsi': 0.05,

    // VOLATILITY INDICATORS
    'v_atr_trend': 0.04,
    'v_bb_width': 0.05,
    'v_bb_bias': 0.04,
    'v_hist_vol': 0.03,
    'v_regime': 0.03,

    // VOLUME INDICATORS
    'vol_rel': 0.04,
    'vol_obv': 0.05,
    'vol_obv_div': 0.04,
    'vol_accdist': 0.04,
    'vol_vwap_dev': 0.05,

    // STRUCTURE INDICATORS
    's_hhhl': 0.05,
    's_swing': 0.06,
    's_bos': 0.07,
    's_choch': 0.05,
    's_bias': 0.06,
    's_range': 0.05,
    's_trendline': 0.04,
    's_sr_quality': 0.05,

    // BREADTH INDICATORS
    's_breadth': 0.06,
    's_ad_mom': 0.05,

    // FIBONACCI INDICATORS
    'f_382': 0.04,
    'f_50': 0.04,
    'f_618': 0.05,
    'f_cluster': 0.06,
    'f_ext': 0.04,
    'f_depth': 0.03,

    // REVERSAL INDICATORS
    'r_rsi_div': 0.05,
    'r_macd_div': 0.05,
    'r_vol_climax': 0.04,
    'r_sar': 0.04,
    'r_stretch': 0.03,
    'r_risk': 0.06,

    // VWAP INDICATORS
    'vw_anchor': 0.06,
    'vw_band': 0.05,
    'vw_slope': 0.04,
    'vw_accept': 0.04,
    'vw_reclaim': 0.05,
    'vw_align': 0.04,
    'vw_meanrev': 0.03,

    // MARKET PROFILE INDICATORS
    'mp_vah': 0.06,
    'mp_poc': 0.05,
    'mp_width': 0.04,
    'mp_ib': 0.06,
    'mp_ext': 0.05,
    'mp_poor': 0.04,
    'mp_comp': 0.06,

    // OPENING RANGE INDICATORS
    'or_break': 0.06,
    'or_fail': 0.05,
    'sess_hold': 0.05,
    'sess_type': 0.05,
    'sess_bal': 0.03,
    'sess_late': 0.04,

    // VOL-ADJUSTED MOMENTUM
    'vm_norm': 0.05,
    'vm_rsi': 0.04,
    'vm_eff': 0.05,
    'vm_bias': 0.04,
    'vm_qual': 0.06,

    // RELATIVE STRENGTH
    'rs_bn': 0.06,
    'rs_mid': 0.05,
    'rs_dma': 0.05,
    'rs_mom': 0.04,
    'rs_qual': 0.04,
    'rs_lead': 0.05,
    'rs_breadth': 0.06,
    'rs_dur': 0.04,

    // SECTOR ROTATION
    'sec_clock': 0.06,
    'sec_disp': 0.05,
    'sec_align': 0.06,
    'sec_stab': 0.04,
    'sec_risk': 0.06,
    'sec_accel': 0.04,
    'sec_health': 0.07,

    // INTERMARKET
    'im_bond': 0.06,
    'im_fx': 0.05,
    'im_oil': 0.04,
    'im_global': 0.05,
    'im_risk': 0.07,
    'im_div': 0.04,

    // RISK REGIME
    'rr_shift': 0.06,
    'rr_dd': 0.05,
    'rr_tail': 0.05,
    'rr_comp': 0.08,

    // BREAKOUT QUALITY
    'bk_strength': 0.05,
    'bk_55d': 0.06,
    'bk_vol': 0.04,
    'bk_follow': 0.05,
    'bk_fail': 0.06,
    'bk_retest': 0.05,
    'bk_chan': 0.04,
    'bk_chan_fail': 0.05,
    'bk_proj': 0.04,
    'bk_gap': 0.04,
    'bk_burst': 0.03,
    'bk_comp': 0.07,

    // FAILURE & TRAPS
    'tp_bull': 0.05,
    'tp_bear': 0.05,
    'tp_mom_fail': 0.03,
    'tp_tl_fail': 0.04,
    'tp_vwap_fail': 0.04,
    'tp_exh_gap': 0.04,
    'tp_liq': 0.05,
    'tp_comp': 0.06,
    'tp_cont_fail': 0.03,
    'tp_conf_del': 0.03,

    // EXHAUSTION
    'ex_age': 0.04,
    'ex_mom_decay': 0.04,
    'ex_vol_div': 0.05,
    'ex_range_fail': 0.04,
    'ex_wick_up': 0.04,
    'ex_wick_dn': 0.04,
    'ex_clv': 0.04,
    'ex_eff_det': 0.04,
    'ex_depth': 0.03,
    'ex_mom_rst': 0.03,
    'ex_comp': 0.07,
    'ex_term': 0.05,
    'ex_cont_viab': 0.05,

    // MICROSTRUCTURE
    'ms_body': 0.03,
    'ms_dir_cls': 0.04,
    'ms_gap_bias': 0.03,
    'ms_open': 0.04,
    'ms_close': 0.04,
    'ms_micro_pb': 0.03,
    'ms_accel': 0.04,
    'ms_stall': 0.03,
    'ms_mom_rej': 0.04,
    'ms_auction': 0.04,
    'ms_time': 0.04,
    'ms_trend_bias': 0.06,
    'ms_conf': 0.03,
    'ms_noise': 0.04,
    'ms_comp': 0.08,

    // STATISTICAL EDGE
    'st_winrate': 0.05,
    'st_expect': 0.06,
    'st_payoff': 0.04,
    'st_sample': 0.03,
    'st_sharpe': 0.05,
    'st_pf': 0.05,
    'st_dd_rec': 0.04,
    'st_skew': 0.03,
    'st_kurt': 0.03,
    'st_comp': 0.08,

    // REGIME SWITCHING
    'rg_vol_class': 0.06,
    'rg_trend_prob': 0.06,
    'rg_mom_pers': 0.05,
    'rg_mean_rev': 0.05,
    'rg_trans_risk': 0.04,
    'rg_trend_stab': 0.05,
    'rg_range_stab': 0.04,
    'rg_align': 0.06,
    'rg_conflict': 0.04,
    'rg_comp': 0.08,

    // PROBABILITY & FORECAST
    'fc_mc_env': 0.05,
    'fc_exp_ret': 0.05,
    'fc_down_risk': 0.05,
    'fc_skew_adj': 0.04,
    'fc_ci_width': 0.04,
    'fc_prob_pos': 0.05,
    'fc_tail_asym': 0.04,
    'fc_stab': 0.04,
    'fc_bias': 0.05,
    'fc_comp': 0.08,

    // FINAL GOVERNORS
    'gv_agree': 0.05,
    'gv_conflict': 0.04,
    'gv_decay': 0.03,
    'gv_overfit': 0.04,
    'gv_sens': 0.04,
    'gv_comp_idx': 0.03,
    'gv_frag': 0.04,
    'gv_robust': 0.05,
    'gv_floor': 0.03,
    'gv_ceil': 0.03,
    'gv_main': 0.10,
    'gv_convict': 0.06,
    'gv_risk_adj': 0.08,
    'gv_elig': 0.05,
    'gv_size': 0.05,
    'gv_stop': 0.04,
    'gv_target': 0.04,
    'gv_rr': 0.05,
    'gv_exec': 0.05,
    'FINAL_MASTER': 1.00
};

// =============================
// Trading Mode Multipliers
// =============================

export const MODE_MULTIPLIERS = {
    [TRADING_MODES.BALANCED]: {
        // No multipliers - use base weights
    },

    [TRADING_MODES.AGGRESSIVE]: {
        // Boost momentum and trend indicators
        momentum: 1.3,
        trend: 1.2,
        breakout: 1.4,
        // Reduce structure and support
        structure: 0.8,
        fibonacci: 0.7,
        trap: 0.7
    },

    [TRADING_MODES.CONSERVATIVE]: {
        // Boost structure and support indicators
        structure: 1.3,
        fibonacci: 1.2,
        support: 1.3,
        trap: 1.4,
        // Reduce momentum
        momentum: 0.7,
        breakout: 0.6
    }
};

// =============================
// Utility Functions
// =============================

/**
 * Gets technical weights for a specific trading mode
 * @param {string} mode - Trading mode
 * @returns {Object} Weight configuration
 */
export const getTechnicalWeights = (mode = TRADING_MODES.BALANCED) => {
    if (mode === TRADING_MODES.BALANCED) {
        return TECHNICAL_WEIGHTS;
    }

    const multipliers = MODE_MULTIPLIERS[mode];
    if (!multipliers) return TECHNICAL_WEIGHTS;

    const adjustedWeights = {};

    for (const [key, baseWeight] of Object.entries(TECHNICAL_WEIGHTS)) {
        let multiplier = 1.0;

        // Apply category-specific multipliers
        if (key.startsWith('m_') && multipliers.momentum) multiplier = multipliers.momentum;
        else if (key.startsWith('t_') && multipliers.trend) multiplier = multipliers.trend;
        else if (key.startsWith('s_') && multipliers.structure) multiplier = multipliers.structure;
        else if (key.startsWith('f_') && multipliers.fibonacci) multiplier = multipliers.fibonacci;
        else if (key.startsWith('bk_') && multipliers.breakout) multiplier = multipliers.breakout;
        else if (key.startsWith('tp_') && multipliers.trap) multiplier = multipliers.trap;

        adjustedWeights[key] = baseWeight * multiplier;
    }

    return adjustedWeights;
};

export default {
    TECHNICAL_WEIGHTS,
    MODE_MULTIPLIERS,
    getTechnicalWeights
};
