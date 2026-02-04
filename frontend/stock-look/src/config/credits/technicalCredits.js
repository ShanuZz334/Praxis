/**
 * @file technicalCredits.js
 * @purpose Credit allocation configurations for technical indicators across trading modes.
 * @responsibilities
 * - Defines base credit allocations for 167 technical indicators
 * - Provides mode-specific credit multipliers (Balanced, Aggressive, Conservative)
 * - Manages total credit budget (500 credits)
 * @key_exports
 * - TECHNICAL_CREDITS - Base credits for all indicators
 * - TOTAL_TECHNICAL_CREDITS - Total credit budget
 * - MODE_CREDIT_MULTIPLIERS - Trading mode credit adjustments
 * - getTechnicalCredits - Gets credits for specific mode
 * @date 2026-02-04
 */

import { TRADING_MODES, getModeConfig } from '../tradingModes.js';

// =============================
// Total Credit Budget
// =============================

// Dynamically calculated from sum of all credits below
// This ensures the total always matches actual allocations

// =============================
// Base Technical Indicator Credits
// =============================

export const TECHNICAL_CREDITS = {
    // TREND INDICATORS
    't_ema_cross': 3,
    't_golden_cross': 5,
    't_adx': 3,
    't_supertrend': 4,
    't_ichimoku': 4,
    't_consistency': 2,

    // MOMENTUM INDICATORS
    'm_rsi': 3,
    'm_rsi_slope': 1,
    'm_macd_hist': 4,
    'm_macd_cross': 2,
    'm_stoch': 2,
    'm_roc': 3,
    'm_thrust': 3,
    'm_rsi_range': 3,
    'm_macd_impulse': 3,
    'm_ppo': 2,
    'm_klinger': 2,
    'm_tsi': 3,

    // VOLATILITY INDICATORS
    'v_atr_trend': 3,
    'v_bb_width': 3,
    'v_bb_bias': 2,
    'v_hist_vol': 2,
    'v_regime': 3,

    // VOLUME INDICATORS
    'vol_rel': 2,
    'vol_obv': 3,
    'vol_obv_div': 2,
    'vol_accdist': 3,
    'vol_vwap_dev': 4,

    // STRUCTURE INDICATORS
    's_hhhl': 3,
    's_swing': 4,
    's_bos': 4,
    's_choch': 2,
    's_bias': 4,
    's_range': 2,
    's_trendline': 1,
    's_sr_quality': 2,

    // BREADTH INDICATORS
    's_breadth': 3,
    's_ad_mom': 3,

    // FIBONACCI INDICATORS
    'f_382': 2,
    'f_50': 1,
    'f_618': 2,
    'f_cluster': 3,
    'f_ext': 1,
    'f_depth': 1,

    // REVERSAL INDICATORS
    'r_rsi_div': 3,
    'r_macd_div': 3,
    'r_vol_climax': 2,
    'r_sar': 2,
    'r_stretch': 1,
    'r_risk': 4,

    // VWAP INDICATORS
    'vw_anchor': 5,
    'vw_band': 3,
    'vw_slope': 3,
    'vw_accept': 3,
    'vw_reclaim': 3,
    'vw_align': 2,
    'vw_meanrev': 1,

    // MARKET PROFILE INDICATORS
    'mp_vah': 3,
    'mp_poc': 3,
    'mp_width': 2,
    'mp_ib': 4,
    'mp_ext': 3,
    'mp_poor': 2,
    'mp_comp': 3,

    // OPENING RANGE INDICATORS
    'or_break': 4,
    'or_fail': 2,
    'sess_hold': 2,
    'sess_type': 3,
    'sess_bal': 1,
    'sess_late': 2,

    // VOL-ADJUSTED MOMENTUM
    'vm_norm': 3,
    'vm_rsi': 1,
    'vm_eff': 4,
    'vm_bias': 2,
    'vm_qual': 4,

    // RELATIVE STRENGTH
    'rs_bn': 4,
    'rs_mid': 3,
    'rs_dma': 2,
    'rs_mom': 2,
    'rs_qual': 2,
    'rs_lead': 3,
    'rs_breadth': 3,
    'rs_dur': 1,

    // SECTOR ROTATION
    'sec_clock': 2,
    'sec_disp': 1,
    'sec_align': 3,
    'sec_stab': 2,
    'sec_risk': 3,
    'sec_accel': 2,
    'sec_health': 4,

    // INTERMARKET
    'im_bond': 3,
    'im_fx': 2,
    'im_oil': 2,
    'im_global': 2,
    'im_risk': 4,
    'im_div': 1,

    // RISK REGIME
    'rr_shift': 3,
    'rr_dd': 3,
    'rr_tail': 2,
    'rr_comp': 5,

    // BREAKOUT QUALITY
    'bk_strength': 2,
    'bk_55d': 3,
    'bk_vol': 2,
    'bk_follow': 2,
    'bk_fail': 3,
    'bk_retest': 2,
    'bk_chan': 2,
    'bk_chan_fail': 2,
    'bk_proj': 1,
    'bk_gap': 1,
    'bk_burst': 1,
    'bk_comp': 4,

    // FAILURE & TRAPS
    'tp_bull': 2,
    'tp_bear': 2,
    'tp_mom_fail': 1,
    'tp_tl_fail': 1,
    'tp_vwap_fail': 2,
    'tp_exh_gap': 1,
    'tp_liq': 3,
    'tp_comp': 3,
    'tp_cont_fail': 1,
    'tp_conf_del': 1,

    // EXHAUSTION
    'ex_age': 2,
    'ex_mom_decay': 2,
    'ex_vol_div': 2,
    'ex_range_fail': 1,
    'ex_wick_up': 1,
    'ex_wick_dn': 1,
    'ex_clv': 1,
    'ex_eff_det': 1,
    'ex_depth': 1,
    'ex_mom_rst': 1,
    'ex_comp': 3,
    'ex_term': 2,
    'ex_cont_viab': 2,

    // MICROSTRUCTURE
    'ms_body': 1,
    'ms_dir_cls': 1,
    'ms_gap_bias': 1,
    'ms_open': 1,
    'ms_close': 1,
    'ms_micro_pb': 1,
    'ms_accel': 1,
    'ms_stall': 1,
    'ms_mom_rej': 1,
    'ms_auction': 1,
    'ms_time': 2,
    'ms_trend_bias': 2,
    'ms_conf': 1,
    'ms_noise': 2,
    'ms_comp': 4,

    // STATISTICAL EDGE
    'st_winrate': 2,
    'st_expect': 2,
    'st_payoff': 1,
    'st_sample': 1,
    'st_sharpe': 1,
    'st_pf': 1,
    'st_dd_rec': 1,
    'st_skew': 1,
    'st_kurt': 1,
    'st_comp': 4,

    // REGIME SWITCHING
    'rg_vol_class': 2,
    'rg_trend_prob': 2,
    'rg_mom_pers': 1,
    'rg_mean_rev': 1,
    'rg_trans_risk': 1,
    'rg_trend_stab': 1,
    'rg_range_stab': 1,
    'rg_align': 2,
    'rg_conflict': 1,
    'rg_comp': 4,

    // PROBABILITY & FORECAST
    'fc_mc_env': 1,
    'fc_exp_ret': 2,
    'fc_down_risk': 1,
    'fc_skew_adj': 1,
    'fc_ci_width': 1,
    'fc_prob_pos': 2,
    'fc_tail_asym': 1,
    'fc_stab': 1,
    'fc_bias': 1,
    'fc_comp': 3,

    // FINAL GOVERNORS
    'gv_agree': 2,
    'gv_conflict': 1,
    'gv_decay': 1,
    'gv_overfit': 1,
    'gv_sens': 1,
    'gv_comp_idx': 1,
    'gv_frag': 1,
    'gv_robust': 2,
    'gv_floor': 1,
    'gv_ceil': 1,
    'gv_main': 4,
    'gv_convict': 4,
    'gv_risk_adj': 5,
    'gv_elig': 1,
    'gv_size': 1,
    'gv_stop': 1,
    'gv_target': 1,
    'gv_rr': 1,
    'gv_exec': 1,
    'FINAL_MASTER': 5
};

// =============================
// Trading Mode Credit Multipliers
// =============================

export const MODE_CREDIT_MULTIPLIERS = {
    [TRADING_MODES.BALANCED]: {
        // No multipliers - use base credits
    },

    [TRADING_MODES.AGGRESSIVE]: {
        // Boost credits for strong momentum/trend signals
        momentum: 1.5,
        trend: 1.3,
        breakout: 1.6,
        // Reduce credits for caution signals
        trap: 0.6,
        exhaustion: 0.7
    },

    [TRADING_MODES.CONSERVATIVE]: {
        // Boost credits for structure and risk management
        structure: 1.4,
        trap: 1.6,
        exhaustion: 1.5,
        fibonacci: 1.3,
        // Reduce credits for aggressive signals
        momentum: 0.6,
        breakout: 0.5
    }
};

// =============================
// Dynamic Total Calculation
// =============================

/**
 * Dynamically calculated total credits
 * This ensures the total always matches the sum of all allocated credits
 */
export const TOTAL_TECHNICAL_CREDITS = Object.values(TECHNICAL_CREDITS).reduce((sum, credit) => sum + credit, 0);

// =============================
// Utility Functions
// =============================

/**
 * Gets technical credits for a specific trading mode
 * @param {string} mode - Trading mode
 * @returns {Object} Credit configuration
 */
export const getTechnicalCredits = (mode = TRADING_MODES.BALANCED) => {
    if (mode === TRADING_MODES.BALANCED) {
        return TECHNICAL_CREDITS;
    }

    const multipliers = MODE_CREDIT_MULTIPLIERS[mode];
    if (!multipliers) return TECHNICAL_CREDITS;

    const adjustedCredits = {};

    for (const [key, baseCredit] of Object.entries(TECHNICAL_CREDITS)) {
        let multiplier = 1.0;

        // Apply category-specific multipliers
        if (key.startsWith('m_') && multipliers.momentum) multiplier = multipliers.momentum;
        else if (key.startsWith('t_') && multipliers.trend) multiplier = multipliers.trend;
        else if (key.startsWith('s_') && multipliers.structure) multiplier = multipliers.structure;
        else if (key.startsWith('f_') && multipliers.fibonacci) multiplier = multipliers.fibonacci;
        else if (key.startsWith('bk_') && multipliers.breakout) multiplier = multipliers.breakout;
        else if (key.startsWith('tp_') && multipliers.trap) multiplier = multipliers.trap;
        else if (key.startsWith('ex_') && multipliers.exhaustion) multiplier = multipliers.exhaustion;

        adjustedCredits[key] = Math.round(baseCredit * multiplier);
    }

    return adjustedCredits;
};

export default {
    TECHNICAL_CREDITS,
    TOTAL_TECHNICAL_CREDITS,
    MODE_CREDIT_MULTIPLIERS,
    getTechnicalCredits
};
