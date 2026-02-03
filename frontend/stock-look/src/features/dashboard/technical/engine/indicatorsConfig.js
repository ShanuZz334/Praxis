/**
 * @file indicatorsConfig.js
 * @purpose Defines the configuration, weights, and simulation logic for technical indicators.
 * @responsibilities
 * - Stores metadata for 100+ technical indicators.
 * - Simulates live data values for development/demo purposes.
 * - Maps indicators to 6 main categories (Trend, Momentum, Volatility, Volume, Breadth, Structure).
 * @key_exports
 * - technicalIndicatorsConfig
 * - generateLiveTechnicalData
 * @dependencies
 * - None (Pure configuration & logic)
 * @lifecycle
 * - Core configuration loaded by TechnicalPage and engine.
 * @date 2026-02-03
 */

export const technicalIndicatorsConfig = [
    // --- SECTION A: TREND (Mapped to Trend) ---
    { id: 't_ema_cross', label: '20/50 EMA Trend', category: 'Trend', weight: 0.06, reliability: 0.90, creditAllocation: 3, desc: 'Trend direction strength' },
    { id: 't_golden_cross', label: '50/200 EMA (Primary)', category: 'Trend', weight: 0.08, reliability: 0.95, creditAllocation: 5, desc: 'Institutional trend filter' },
    { id: 't_adx', label: 'ADX (14)', category: 'Trend', weight: 0.05, reliability: 0.85, creditAllocation: 3, desc: 'Trend strength index' },
    { id: 't_supertrend', label: 'Supertrend (10,3)', category: 'Trend', weight: 0.07, reliability: 0.90, creditAllocation: 4, desc: 'Direction + trailing stop' },
    { id: 't_ichimoku', label: 'Ichimoku Cloud', category: 'Trend', weight: 0.08, reliability: 0.85, creditAllocation: 4, desc: 'Cloud support/resistance' },
    { id: 't_consistency', label: 'Trend Consistency', category: 'Trend', weight: 0.04, reliability: 0.80, creditAllocation: 2, desc: '% bars above EMA20' },

    // --- SECTION B: MOMENTUM (Mapped to Momentum) ---
    { id: 'm_rsi', label: 'RSI (14)', category: 'Momentum', weight: 0.05, reliability: 0.85, creditAllocation: 3, desc: 'Mean-reversion momentum' },
    { id: 'm_rsi_slope', label: 'RSI Trend Slope', category: 'Momentum', weight: 0.04, reliability: 0.80, creditAllocation: 1, desc: 'Momentum acceleration' },
    { id: 'm_macd_hist', label: 'MACD Histogram', category: 'Momentum', weight: 0.06, reliability: 0.90, creditAllocation: 4, desc: 'Momentum expansion' },
    { id: 'm_macd_cross', label: 'MACD Signal Cross', category: 'Momentum', weight: 0.04, reliability: 0.85, creditAllocation: 2, desc: 'Confirmation signal' },
    { id: 'm_stoch', label: 'Stochastic (14,3,3)', category: 'Momentum', weight: 0.04, reliability: 0.75, creditAllocation: 2, desc: 'Overbought/oversold' },
    { id: 'm_roc', label: 'Rate of Change (10)', category: 'Momentum', weight: 0.05, reliability: 0.80, creditAllocation: 3, desc: 'Momentum burst detection' },

    // --- SECTION C: VOLATILITY (Mapped to Volatility) ---
    { id: 'v_atr_trend', label: 'ATR Trend', category: 'Volatility', weight: 0.04, reliability: 0.85, creditAllocation: 3, desc: 'Volatility expansion' },
    { id: 'v_bb_width', label: 'Bollinger Band Width', category: 'Volatility', weight: 0.05, reliability: 0.80, creditAllocation: 3, desc: 'Squeeze detection' },
    { id: 'v_bb_bias', label: 'Bollinger Mean Rev', category: 'Volatility', weight: 0.04, reliability: 0.75, creditAllocation: 2, desc: 'Distance to mean' },
    { id: 'v_hist_vol', label: 'Historical Volatility', category: 'Volatility', weight: 0.03, reliability: 0.80, creditAllocation: 2, desc: 'Realized volatility' },
    { id: 'v_regime', label: 'Vol Regime Class', category: 'Volatility', weight: 0.03, reliability: 0.90, creditAllocation: 3, desc: 'Low/Normal/High context' },

    // --- SECTION D: VOLUME & FLOW (Mapped to Volume) ---
    { id: 'vol_rel', label: 'Vol vs 20d Avg', category: 'Volume', weight: 0.04, reliability: 0.80, creditAllocation: 2, desc: 'Relative volume strength' },
    { id: 'vol_obv', label: 'On-Balance Volume', category: 'Volume', weight: 0.05, reliability: 0.85, creditAllocation: 3, desc: 'Trend confirmation' },
    { id: 'vol_obv_div', label: 'OBV Divergence', category: 'Volume', weight: 0.04, reliability: 0.80, creditAllocation: 2, desc: 'Flow/Price disagreement' },
    { id: 'vol_accdist', label: 'Acc/Dist Line', category: 'Volume', weight: 0.04, reliability: 0.85, creditAllocation: 3, desc: 'Institutional proxy' },
    { id: 'vol_vwap_dev', label: 'VWAP Deviation', category: 'Volume', weight: 0.05, reliability: 0.90, creditAllocation: 4, desc: 'Reversion risk' },

    // --- SECTION E: STRUCTURE (Mapped to Breadth/Structure) ---
    { id: 's_hhhl', label: 'HH/HL Structure', category: 'Structure', weight: 0.05, reliability: 0.85, creditAllocation: 3, desc: 'Pattern integrity' },
    { id: 's_breadth', label: 'Market Breadth', category: 'Breadth', weight: 0.06, reliability: 0.90, creditAllocation: 3, desc: '% stocks > 50DMA' },
    { id: 's_ad_mom', label: 'A/D Momentum', category: 'Breadth', weight: 0.05, reliability: 0.85, creditAllocation: 3, desc: 'Breadth impulse' },

    // --- SECTION F: MARKET STRUCTURE (Mapped to Structure) ---
    { id: 's_swing', label: 'Swing Integrity', category: 'Structure', weight: 0.06, reliability: 0.90, creditAllocation: 4, desc: '3-point swing check' },
    { id: 's_bos', label: 'Break of Structure', category: 'Structure', weight: 0.07, reliability: 0.92, creditAllocation: 4, desc: 'Trend continuation' },
    { id: 's_choch', label: 'Change of Character', category: 'Structure', weight: 0.05, reliability: 0.85, creditAllocation: 2, desc: 'Early reversal warning' },
    { id: 's_bias', label: 'Structure Bias Score', category: 'Structure', weight: 0.06, reliability: 0.90, creditAllocation: 4, desc: 'Composite bias' },
    { id: 's_range', label: 'Range Respect', category: 'Structure', weight: 0.05, reliability: 0.85, creditAllocation: 2, desc: 'Midpoint holding' },
    { id: 's_trendline', label: 'Trendline Respect', category: 'Structure', weight: 0.04, reliability: 0.80, creditAllocation: 1, desc: 'Touchpoint validation' },
    { id: 's_sr_quality', label: 'S/R Reaction Quality', category: 'Structure', weight: 0.05, reliability: 0.85, creditAllocation: 2, desc: 'Bounce/Rejection strength' },

    // --- SECTION G: FIBONACCI (Mapped to Support/Resistance -> Structure) ---
    { id: 'f_382', label: 'Fib 38.2% Hold', category: 'Structure', weight: 0.04, reliability: 0.80, creditAllocation: 2, desc: 'Continuation signal' },
    { id: 'f_50', label: 'Fib 50% Mean Rev', category: 'Structure', weight: 0.04, reliability: 0.78, creditAllocation: 1, desc: 'Equilibrium zone' },
    { id: 'f_618', label: 'Fib 61.8% Critical', category: 'Structure', weight: 0.05, reliability: 0.85, creditAllocation: 2, desc: 'Trend failure level' },
    { id: 'f_cluster', label: 'Fib Cluster Strength', category: 'Structure', weight: 0.06, reliability: 0.90, creditAllocation: 3, desc: 'Confluence zones' },
    { id: 'f_ext', label: 'Extension Target', category: 'Structure', weight: 0.04, reliability: 0.80, creditAllocation: 1, desc: '1.618 projection' },
    { id: 'f_depth', label: 'Retracement Depth', category: 'Structure', weight: 0.03, reliability: 0.75, creditAllocation: 1, desc: 'Trend health check' },

    // --- SECTION H: ADVANCED MOMENTUM (Mapped to Momentum) ---
    { id: 'm_thrust', label: 'Momentum Thrust', category: 'Momentum', weight: 0.05, reliability: 0.85, creditAllocation: 3, desc: 'Top 30% closes' },
    { id: 'm_rsi_range', label: 'RSI Range Shift', category: 'Momentum', weight: 0.05, reliability: 0.88, creditAllocation: 3, desc: 'Regime change (40-80)' },
    { id: 'm_macd_impulse', label: 'MACD Impulse', category: 'Momentum', weight: 0.06, reliability: 0.90, creditAllocation: 3, desc: 'Triple filter alignment' },
    { id: 'm_ppo', label: 'PPO', category: 'Momentum', weight: 0.04, reliability: 0.80, creditAllocation: 2, desc: 'Percentage Price Osc' },
    { id: 'm_klinger', label: 'Klinger Osc', category: 'Momentum', weight: 0.04, reliability: 0.78, creditAllocation: 2, desc: 'Vol-Momentum hybrid' },
    { id: 'm_tsi', label: 'True Strength Index', category: 'Momentum', weight: 0.05, reliability: 0.85, creditAllocation: 3, desc: 'Double smoothed mom' },

    // --- SECTION I: REVERSALS (Mapped to Momentum/Trend) ---
    { id: 'r_rsi_div', label: 'RSI Divergence', category: 'Momentum', weight: 0.05, reliability: 0.90, creditAllocation: 3, desc: 'Price/Oscillator mismatch' },
    { id: 'r_macd_div', label: 'MACD Divergence', category: 'Momentum', weight: 0.05, reliability: 0.88, creditAllocation: 3, desc: 'Exhaustion signal' },
    { id: 'r_vol_climax', label: 'Volume Climax', category: 'Volume', weight: 0.04, reliability: 0.85, creditAllocation: 2, desc: 'Stopping volume' },
    { id: 'r_sar', label: 'Parabolic SAR Flip', category: 'Trend', weight: 0.04, reliability: 0.80, creditAllocation: 2, desc: 'Reversal confirmation' },
    { id: 'r_stretch', label: 'Trend Stretch', category: 'Trend', weight: 0.03, reliability: 0.75, creditAllocation: 1, desc: 'Extension from mean' },
    { id: 'r_risk', label: 'Reversal Risk Score', category: 'Volatility', weight: 0.06, reliability: 0.90, creditAllocation: 4, desc: 'Composite exhaustion' },

    // --- SECTION J: VWAP (Mapped to Volume/Trend) ---
    { id: 'vw_anchor', label: 'Anchored VWAP', category: 'Trend', weight: 0.06, reliability: 0.92, creditAllocation: 5, desc: 'Institutional cost basis' },
    { id: 'vw_band', label: 'VWAP Bands', category: 'Volatility', weight: 0.05, reliability: 0.88, creditAllocation: 3, desc: 'StdDev from VWAP' },
    { id: 'vw_slope', label: 'VWAP Slope', category: 'Trend', weight: 0.04, reliability: 0.85, creditAllocation: 3, desc: 'Accumulation bias' },
    { id: 'vw_accept', label: 'VWAP Acceptance', category: 'Volume', weight: 0.04, reliability: 0.80, creditAllocation: 3, desc: '% closes > VWAP' },
    { id: 'vw_reclaim', label: 'VWAP Reclaim', category: 'Trend', weight: 0.05, reliability: 0.90, creditAllocation: 3, desc: 'Institutional defense' },
    { id: 'vw_align', label: 'Session Alignment', category: 'Trend', weight: 0.04, reliability: 0.85, creditAllocation: 2, desc: 'Daily/Weekly sync' },
    { id: 'vw_meanrev', label: 'VWAP Mean Rev Risk', category: 'Volatility', weight: 0.03, reliability: 0.80, creditAllocation: 1, desc: 'Stretch penalty' },

    // --- SECTION K: MARKET PROFILE (Mapped to Volume) ---
    { id: 'mp_vah', label: 'Value Area High', category: 'Volume', weight: 0.06, reliability: 0.90, creditAllocation: 3, desc: 'Acceptance > VAH' },
    { id: 'mp_poc', label: 'POC Migration', category: 'Volume', weight: 0.05, reliability: 0.88, creditAllocation: 3, desc: 'Value migration' },
    { id: 'mp_width', label: 'Value Area Width', category: 'Volatility', weight: 0.04, reliability: 0.80, creditAllocation: 2, desc: 'Expansion/Contraction' },
    { id: 'mp_ib', label: 'IB Break', category: 'Momentum', weight: 0.06, reliability: 0.92, creditAllocation: 4, desc: 'Initial Balance range' },
    { id: 'mp_ext', label: 'Range Extension', category: 'Momentum', weight: 0.05, reliability: 0.88, creditAllocation: 3, desc: 'Directional conviction' },
    { id: 'mp_poor', label: 'Poor High/Low', category: 'Structure', weight: 0.04, reliability: 0.80, creditAllocation: 2, desc: 'Weak auction' },
    { id: 'mp_comp', label: 'Value Acceptance', category: 'Volume', weight: 0.06, reliability: 0.90, creditAllocation: 3, desc: 'Composite profile' },

    // --- SECTION L: OPENING RANGE (Mapped to Momentum) ---
    { id: 'or_break', label: 'ORB (30m)', category: 'Momentum', weight: 0.06, reliability: 0.92, creditAllocation: 4, desc: 'Opening range breakout' },
    { id: 'or_fail', label: 'ORB Failure', category: 'Momentum', weight: 0.05, reliability: 0.88, creditAllocation: 2, desc: 'Trap/Reversal' },
    { id: 'sess_hold', label: 'Session High/Low', category: 'Structure', weight: 0.05, reliability: 0.90, creditAllocation: 2, desc: 'Trend day confirmation' },
    { id: 'sess_type', label: 'Profile Type', category: 'Trend', weight: 0.05, reliability: 0.90, creditAllocation: 3, desc: 'Trend vs Range day' },
    { id: 'sess_bal', label: 'Midday Balance', category: 'Volatility', weight: 0.03, reliability: 0.80, creditAllocation: 1, desc: 'Chop filter' },
    { id: 'sess_late', label: 'Late Session Bias', category: 'Momentum', weight: 0.04, reliability: 0.85, creditAllocation: 2, desc: 'Closing conviction' },

    // --- SECTION M: VOL-ADJ MOMENTUM (Mapped to Momentum) ---
    { id: 'vm_norm', label: 'ATR-Norm Momentum', category: 'Momentum', weight: 0.05, reliability: 0.88, creditAllocation: 3, desc: 'Vol-adjusted ROC' },
    { id: 'vm_rsi', label: 'Vol-Adj RSI', category: 'Momentum', weight: 0.04, reliability: 0.85, creditAllocation: 1, desc: 'Noise dampened RSI' },
    { id: 'vm_eff', label: 'Efficiency Ratio', category: 'Trend', weight: 0.05, reliability: 0.90, creditAllocation: 4, desc: 'Kaufman efficiency' },
    { id: 'vm_bias', label: 'Directional Vol', category: 'Volatility', weight: 0.04, reliability: 0.85, creditAllocation: 2, desc: 'Upside vs Downside vol' },
    { id: 'vm_qual', label: 'Execution Quality', category: 'Structure', weight: 0.06, reliability: 0.92, creditAllocation: 4, desc: 'Cleanliness of move' },

    // --- SECTION N: RELATIVE STRENGTH (Mapped to Breadth) ---
    { id: 'rs_bn', label: 'Nifty vs BankNifty', category: 'Breadth', weight: 0.06, reliability: 0.92, creditAllocation: 4, desc: 'Sector leadership' },
    { id: 'rs_mid', label: 'Nifty vs Midcap', category: 'Breadth', weight: 0.05, reliability: 0.90, creditAllocation: 3, desc: 'Risk appetite' },
    { id: 'rs_dma', label: 'Index vs 200DMA', category: 'Trend', weight: 0.05, reliability: 0.88, creditAllocation: 2, desc: 'Long-term structure' },
    { id: 'rs_mom', label: 'RS Momentum', category: 'Breadth', weight: 0.04, reliability: 0.85, creditAllocation: 2, desc: 'Leadership accel' },
    { id: 'rs_qual', label: 'RS Trend Quality', category: 'Breadth', weight: 0.04, reliability: 0.85, creditAllocation: 2, desc: 'Performance stability' },
    { id: 'rs_lead', label: 'Leader/Laggard', category: 'Breadth', weight: 0.05, reliability: 0.90, creditAllocation: 3, desc: 'Quantile ranking' },
    { id: 'rs_breadth', label: 'Leadership Breadth', category: 'Breadth', weight: 0.06, reliability: 0.92, creditAllocation: 3, desc: '% sectors > Index' },
    { id: 'rs_dur', label: 'Persistence', category: 'Breadth', weight: 0.04, reliability: 0.85, creditAllocation: 1, desc: 'Leadership duration' },

    // --- SECTION O: SECTOR ROTATION (Mapped to Breadth) ---
    { id: 'sec_clock', label: 'Sector Rotation', category: 'Breadth', weight: 0.06, reliability: 0.92, creditAllocation: 2, desc: 'RRG Velocity' },
    { id: 'sec_disp', label: 'Sector Dispersion', category: 'Volatility', weight: 0.05, reliability: 0.88, creditAllocation: 1, desc: 'Return variance' },
    { id: 'sec_align', label: 'Sector Alignment', category: 'Breadth', weight: 0.06, reliability: 0.90, creditAllocation: 3, desc: '% sectors in uptrend' },
    { id: 'sec_stab', label: 'Rotation Stability', category: 'Breadth', weight: 0.04, reliability: 0.85, creditAllocation: 2, desc: 'Churn rate' },
    { id: 'sec_risk', label: 'Defensive/Cyclical', category: 'Breadth', weight: 0.06, reliability: 0.92, creditAllocation: 3, desc: 'Risk-on ratio' },
    { id: 'sec_accel', label: 'Sector Accel', category: 'Momentum', weight: 0.04, reliability: 0.85, creditAllocation: 2, desc: '2nd derivative' },
    { id: 'sec_health', label: 'Rotation Health', category: 'Breadth', weight: 0.07, reliability: 0.93, creditAllocation: 4, desc: 'Market internal structure' },

    // --- SECTION P: INTERMARKET (Mapped to Breadth/Macro) ---
    { id: 'im_bond', label: 'Equity/Bond Ratio', category: 'Breadth', weight: 0.06, reliability: 0.92, creditAllocation: 3, desc: 'Yield spread signal' },
    { id: 'im_fx', label: 'USDINR Correlation', category: 'Breadth', weight: 0.05, reliability: 0.88, creditAllocation: 2, desc: 'Currency stress' },
    { id: 'im_oil', label: 'Crude Sensitivity', category: 'Breadth', weight: 0.04, reliability: 0.85, creditAllocation: 2, desc: 'Input cost drag' },
    { id: 'im_global', label: 'Global Correlation', category: 'Breadth', weight: 0.05, reliability: 0.88, creditAllocation: 2, desc: 'SPX/DAX beta' },
    { id: 'im_risk', label: 'Risk-On/Off', category: 'Breadth', weight: 0.07, reliability: 0.93, creditAllocation: 4, desc: 'Cross-asset composite' },
    { id: 'im_div', label: 'Intermarket Div', category: 'Breadth', weight: 0.04, reliability: 0.85, creditAllocation: 1, desc: 'Warning signal' },

    // --- SECTION Q: RISK REGIME (Mapped to Volatility) ---
    { id: 'rr_shift', label: 'Vol Regime Shift', category: 'Volatility', weight: 0.06, reliability: 0.92, creditAllocation: 3, desc: 'Vol expansion alert' },
    { id: 'rr_dd', label: 'Drawdown Index', category: 'Volatility', weight: 0.05, reliability: 0.90, creditAllocation: 3, desc: 'Pain index' },
    { id: 'rr_tail', label: 'Tail Risk Signal', category: 'Volatility', weight: 0.05, reliability: 0.88, creditAllocation: 2, desc: 'Skewness alert' },
    { id: 'rr_comp', label: 'Composite Risk', category: 'Volatility', weight: 0.08, reliability: 0.95, creditAllocation: 5, desc: 'Master risk gauge' },

    // --- SECTION R: BREAKOUT QUALITY (Mapped to Structure/Momentum) ---
    { id: 'bk_strength', label: '20D Breakout Strength', category: 'Momentum', weight: 0.05, reliability: 0.90, creditAllocation: 2, desc: 'Dist > High * Vol' },
    { id: 'bk_55d', label: '55D High Breakout', category: 'Structure', weight: 0.06, reliability: 0.92, creditAllocation: 3, desc: 'Structural breakout' },
    { id: 'bk_vol', label: 'Volume Expansion', category: 'Volume', weight: 0.04, reliability: 0.85, creditAllocation: 2, desc: 'Breakout conviction' },
    { id: 'bk_follow', label: 'Follow-Through', category: 'Trend', weight: 0.05, reliability: 0.88, creditAllocation: 2, desc: '% continuation bars' },
    { id: 'bk_fail', label: 'Failed Breakout', category: 'Structure', weight: 0.06, reliability: 0.92, creditAllocation: 3, desc: 'Range trap detection' },
    { id: 'bk_retest', label: 'Breakout Retest', category: 'Structure', weight: 0.05, reliability: 0.90, creditAllocation: 2, desc: 'Support confirmation' },
    { id: 'bk_chan', label: 'Channel Expansion', category: 'Structure', weight: 0.04, reliability: 0.85, creditAllocation: 2, desc: 'Volatility breakout' },
    { id: 'bk_chan_fail', label: 'Channel Breakdown', category: 'Structure', weight: 0.05, reliability: 0.88, creditAllocation: 2, desc: 'Trend failure' },
    { id: 'bk_proj', label: 'Measured Move', category: 'Structure', weight: 0.04, reliability: 0.80, creditAllocation: 1, desc: 'Target projection' },
    { id: 'bk_gap', label: 'Gap Continuation', category: 'Structure', weight: 0.04, reliability: 0.85, creditAllocation: 1, desc: 'Gap and Go' },
    { id: 'bk_burst', label: 'Accel Burst', category: 'Momentum', weight: 0.03, reliability: 0.80, creditAllocation: 1, desc: 'Slope spike' },
    { id: 'bk_comp', label: 'Composite Breakout', category: 'Momentum', weight: 0.07, reliability: 0.93, creditAllocation: 4, desc: 'Master breakout score' },

    // --- SECTION S: FAILURE & TRAPS (Mapped to Structure) ---
    { id: 'tp_bull', label: 'Bull Trap Prob', category: 'Structure', weight: 0.05, reliability: 0.90, creditAllocation: 2, desc: 'Volume fade rejection' },
    { id: 'tp_bear', label: 'Bear Trap Prob', category: 'Structure', weight: 0.05, reliability: 0.90, creditAllocation: 2, desc: 'Breakdown reclaim' },
    { id: 'tp_mom_fail', label: 'False Momentum', category: 'Momentum', weight: 0.03, reliability: 0.80, creditAllocation: 1, desc: 'Oscillator failure' },
    { id: 'tp_tl_fail', label: 'Failed TL Break', category: 'Structure', weight: 0.04, reliability: 0.85, creditAllocation: 1, desc: 'Trendline rejection' },
    { id: 'tp_vwap_fail', label: 'Failed VWAP Reclaim', category: 'Trend', weight: 0.04, reliability: 0.88, creditAllocation: 2, desc: 'Institutional reject' },
    { id: 'tp_exh_gap', label: 'Exhaustion Gap', category: 'Structure', weight: 0.04, reliability: 0.85, creditAllocation: 1, desc: 'Gap fade' },
    { id: 'tp_liq', label: 'Liquidity Sweep', category: 'Structure', weight: 0.05, reliability: 0.90, creditAllocation: 3, desc: 'Stop hunt detection' },
    { id: 'tp_comp', label: 'Trap Risk Score', category: 'Structure', weight: 0.06, reliability: 0.92, creditAllocation: 3, desc: 'Composite failure risk' },
    { id: 'tp_cont_fail', label: 'Failed Continuation', category: 'Trend', weight: 0.03, reliability: 0.80, creditAllocation: 1, desc: 'Flag failure' },
    { id: 'tp_conf_del', label: 'Confirm Delay', category: 'Trend', weight: 0.03, reliability: 0.75, creditAllocation: 1, desc: 'Hesitation penalty' },

    // --- SECTION T: EXHAUSTION (Mapped to Trend/Momentum) ---
    { id: 'ex_age', label: 'Trend Age', category: 'Trend', weight: 0.04, reliability: 0.85, creditAllocation: 2, desc: 'Bars since breakout' },
    { id: 'ex_mom_decay', label: 'Momentum Decay', category: 'Momentum', weight: 0.04, reliability: 0.85, creditAllocation: 2, desc: 'Slope flattening' },
    { id: 'ex_vol_div', label: 'Vol Divergence', category: 'Volatility', weight: 0.05, reliability: 0.90, creditAllocation: 2, desc: 'Vol up / Price flat' },
    { id: 'ex_range_fail', label: 'Range Fail', category: 'Structure', weight: 0.04, reliability: 0.85, creditAllocation: 1, desc: 'Expansion failure' },
    { id: 'ex_wick_up', label: 'Upper Wick Dom', category: 'Structure', weight: 0.04, reliability: 0.80, creditAllocation: 1, desc: 'Distribution signs' },
    { id: 'ex_wick_dn', label: 'Lower Wick Dom', category: 'Structure', weight: 0.04, reliability: 0.80, creditAllocation: 1, desc: 'Accumulation signs' },
    { id: 'ex_clv', label: 'Close Loc Value', category: 'Momentum', weight: 0.04, reliability: 0.85, creditAllocation: 1, desc: 'Close vs Range' },
    { id: 'ex_eff_det', label: 'Efficiency Drop', category: 'Trend', weight: 0.04, reliability: 0.88, creditAllocation: 1, desc: 'Noise increasing' },
    { id: 'ex_depth', label: 'Pullback Depth', category: 'Trend', weight: 0.03, reliability: 0.80, creditAllocation: 1, desc: 'Retracement escalation' },
    { id: 'ex_mom_rst', label: 'Failed Reset', category: 'Momentum', weight: 0.03, reliability: 0.80, creditAllocation: 1, desc: 'Oscillator stuck' },
    { id: 'ex_comp', label: 'Exhaustion Score', category: 'Trend', weight: 0.07, reliability: 0.93, creditAllocation: 3, desc: 'Composite fatigue' },
    { id: 'ex_term', label: 'Term Probability', category: 'Trend', weight: 0.05, reliability: 0.90, creditAllocation: 2, desc: 'Reversal likelihood' },
    { id: 'ex_cont_viab', label: 'Viability Score', category: 'Trend', weight: 0.05, reliability: 0.90, creditAllocation: 2, desc: 'Fuel remaining' },

    // --- SECTION U: MICROSTRUCTURE (Mapped to Structure/Volume) ---
    { id: 'ms_body', label: 'Body Dominance', category: 'Structure', weight: 0.03, reliability: 0.80, creditAllocation: 1, desc: 'Candle strength' },
    { id: 'ms_dir_cls', label: 'Close Consistency', category: 'Trend', weight: 0.04, reliability: 0.85, creditAllocation: 1, desc: 'Directional closes' },
    { id: 'ms_gap_bias', label: 'Overnight Bias', category: 'Structure', weight: 0.03, reliability: 0.75, creditAllocation: 1, desc: 'Gap fade/follow' },
    { id: 'ms_open', label: 'Opening Drive', category: 'Momentum', weight: 0.04, reliability: 0.85, creditAllocation: 1, desc: 'First 30m intensity' },
    { id: 'ms_close', label: 'Closing Conviction', category: 'Momentum', weight: 0.04, reliability: 0.88, creditAllocation: 1, desc: 'Last hour strength' },
    { id: 'ms_micro_pb', label: 'Micro Pullback', category: 'Trend', weight: 0.03, reliability: 0.80, creditAllocation: 1, desc: 'Intraday dip buy' },
    { id: 'ms_accel', label: 'Price Accel', category: 'Momentum', weight: 0.04, reliability: 0.85, creditAllocation: 1, desc: 'Vol-confirmed spike' },
    { id: 'ms_stall', label: 'Stalling Index', category: 'Momentum', weight: 0.03, reliability: 0.80, creditAllocation: 1, desc: 'Highs rejection' },
    { id: 'ms_mom_rej', label: 'Mom Rejection', category: 'Momentum', weight: 0.04, reliability: 0.85, creditAllocation: 1, desc: 'Extreme fade' },
    { id: 'ms_auction', label: 'Auction Imbal', category: 'Volume', weight: 0.04, reliability: 0.85, creditAllocation: 1, desc: 'Aggressor imbalance' },
    { id: 'ms_time', label: 'Time-at-Price', category: 'Volume', weight: 0.04, reliability: 0.88, creditAllocation: 2, desc: 'Price acceptance' },
    { id: 'ms_trend_bias', label: 'Micro Trend Bias', category: 'Structure', weight: 0.06, reliability: 0.92, creditAllocation: 2, desc: 'Intraday structure' },
    { id: 'ms_conf', label: 'Short-Term Conf', category: 'Trend', weight: 0.03, reliability: 0.80, creditAllocation: 1, desc: 'Recent bar quality' },
    { id: 'ms_noise', label: 'Noise Ratio', category: 'Volatility', weight: 0.04, reliability: 0.90, creditAllocation: 2, desc: 'Clean vs choppy' },
    { id: 'ms_comp', label: 'Price Behavior', category: 'Structure', weight: 0.08, reliability: 0.95, creditAllocation: 4, desc: 'Master price score' },

    // --- SECTION V: STATISTICAL EDGE (Mapped to Trend/Structure) ---
    { id: 'st_winrate', label: 'Trend Win-Rate', category: 'Trend', weight: 0.05, reliability: 0.90, creditAllocation: 2, desc: 'Rolling success rate' },
    { id: 'st_expect', label: 'Expectancy Score', category: 'Structure', weight: 0.06, reliability: 0.92, creditAllocation: 2, desc: 'Risk/Reward * WinRate' },
    { id: 'st_payoff', label: 'Payoff Stability', category: 'Structure', weight: 0.04, reliability: 0.85, creditAllocation: 1, desc: 'Consistency of returns' },
    { id: 'st_sample', label: 'Sample Adequacy', category: 'Structure', weight: 0.03, reliability: 0.90, creditAllocation: 1, desc: 'Observation confidence' },
    { id: 'st_sharpe', label: 'Rolling Sharpe', category: 'Trend', weight: 0.05, reliability: 0.90, creditAllocation: 1, desc: 'Risk-adjusted return' },
    { id: 'st_pf', label: 'Profit Factor', category: 'Trend', weight: 0.05, reliability: 0.92, creditAllocation: 1, desc: 'Gross Win / Gross Loss' },
    { id: 'st_dd_rec', label: 'DD Recovery', category: 'Volatility', weight: 0.04, reliability: 0.88, creditAllocation: 1, desc: 'Resilience index' },
    { id: 'st_skew', label: 'Signal Skewness', category: 'Structure', weight: 0.03, reliability: 0.80, creditAllocation: 1, desc: 'Distribution bias' },
    { id: 'st_kurt', label: 'Signal Kurtosis', category: 'Structure', weight: 0.03, reliability: 0.80, creditAllocation: 1, desc: 'Fat tail risk' },
    { id: 'st_comp', label: 'Statistical Edge', category: 'Structure', weight: 0.08, reliability: 0.95, creditAllocation: 4, desc: 'Master edge score' },

    // --- SECTION W: REGIME SWITCHING (Mapped to Structure/Trend) ---
    { id: 'rg_vol_class', label: 'Vol Regime', category: 'Volatility', weight: 0.06, reliability: 0.92, creditAllocation: 2, desc: 'HMM State Classifier' },
    { id: 'rg_trend_prob', label: 'Trend Probability', category: 'Trend', weight: 0.06, reliability: 0.92, creditAllocation: 2, desc: 'Bayesian likelihood' },
    { id: 'rg_mom_pers', label: 'Mom Persistence', category: 'Momentum', weight: 0.05, reliability: 0.90, creditAllocation: 1, desc: 'Continuation odds' },
    { id: 'rg_mean_rev', label: 'Mean Rev Prob', category: 'Momentum', weight: 0.05, reliability: 0.90, creditAllocation: 1, desc: 'Reversion likelihood' },
    { id: 'rg_trans_risk', label: 'Transition Risk', category: 'Structure', weight: 0.04, reliability: 0.88, creditAllocation: 1, desc: 'Regime change alert' },
    { id: 'rg_trend_stab', label: 'Trend Stability', category: 'Trend', weight: 0.05, reliability: 0.90, creditAllocation: 1, desc: 'Duration * Vol' },
    { id: 'rg_range_stab', label: 'Range Stability', category: 'Structure', weight: 0.04, reliability: 0.88, creditAllocation: 1, desc: 'Balance duration' },
    { id: 'rg_align', label: 'Regime Alignment', category: 'Structure', weight: 0.06, reliability: 0.93, creditAllocation: 2, desc: 'Multi-factor sync' },
    { id: 'rg_conflict', label: 'Regime Conflict', category: 'Structure', weight: 0.04, reliability: 0.88, creditAllocation: 1, desc: 'Disagreement warning' },
    { id: 'rg_comp', label: 'Regime Confidence', category: 'Structure', weight: 0.08, reliability: 0.95, creditAllocation: 4, desc: 'Master regime score' },

    // --- SECTION X: PROBABILITY & FORECAST (Mapped to Structure) ---
    { id: 'fc_mc_env', label: 'Monte Carlo Box', category: 'Structure', weight: 0.05, reliability: 0.90, creditAllocation: 1, desc: 'Return envelope' },
    { id: 'fc_exp_ret', label: 'Expected Return', category: 'Trend', weight: 0.05, reliability: 0.92, creditAllocation: 2, desc: '30-day mean' },
    { id: 'fc_down_risk', label: 'Downside Risk', category: 'Volatility', weight: 0.05, reliability: 0.92, creditAllocation: 1, desc: 'VaR estimation' },
    { id: 'fc_skew_adj', label: 'Skew-Adj Expect', category: 'Structure', weight: 0.04, reliability: 0.88, creditAllocation: 1, desc: 'Asymmetric target' },
    { id: 'fc_ci_width', label: 'Forecast Conf', category: 'Structure', weight: 0.04, reliability: 0.90, creditAllocation: 1, desc: 'CI Width (Inverse)' },
    { id: 'fc_prob_pos', label: 'Win Probability', category: 'Trend', weight: 0.05, reliability: 0.92, creditAllocation: 2, desc: '% Sim Positive' },
    { id: 'fc_tail_asym', label: 'Tail Asymmetry', category: 'Volatility', weight: 0.04, reliability: 0.88, creditAllocation: 1, desc: 'Left vs Right tail' },
    { id: 'fc_stab', label: 'Forecast Stability', category: 'Structure', weight: 0.04, reliability: 0.90, creditAllocation: 1, desc: 'Prediction consistency' },
    { id: 'fc_bias', label: 'Prob Bias Index', category: 'Trend', weight: 0.05, reliability: 0.92, creditAllocation: 1, desc: 'Bull/Bear skew' },
    { id: 'fc_comp', label: 'Forecast Quality', category: 'Structure', weight: 0.08, reliability: 0.95, creditAllocation: 3, desc: 'Prediction confidence' },

    // --- SECTION Y: FINAL GOVERNORS (Mapped to All) ---
    { id: 'gv_agree', label: 'Signal Agreement', category: 'Breadth', weight: 0.05, reliability: 0.92, creditAllocation: 2, desc: '% Indicators aligned' },
    { id: 'gv_conflict', label: 'Conflict Density', category: 'Breadth', weight: 0.04, reliability: 0.90, creditAllocation: 1, desc: 'Noise penalty' },
    { id: 'gv_decay', label: 'Confidence Decay', category: 'Trend', weight: 0.03, reliability: 0.88, creditAllocation: 1, desc: 'Stale signal penalty' },
    { id: 'gv_overfit', label: 'Overfitting Risk', category: 'Structure', weight: 0.04, reliability: 0.90, creditAllocation: 1, desc: 'Complexity penalty' },
    { id: 'gv_sens', label: 'Sensitivity', category: 'Structure', weight: 0.04, reliability: 0.90, creditAllocation: 1, desc: 'Reaction speed' },
    { id: 'gv_comp_idx', label: 'Conf Compression', category: 'Structure', weight: 0.03, reliability: 0.88, creditAllocation: 1, desc: 'Precision check' },
    { id: 'gv_frag', label: 'Signal Fragility', category: 'Volatility', weight: 0.04, reliability: 0.90, creditAllocation: 1, desc: 'Stress test' },
    { id: 'gv_robust', label: 'Regime Robustness', category: 'Trend', weight: 0.05, reliability: 0.92, creditAllocation: 2, desc: 'All-weather score' },
    { id: 'gv_floor', label: 'Conf Floor gov', category: 'Structure', weight: 0.03, reliability: 0.95, creditAllocation: 1, desc: 'Min confidence' },
    { id: 'gv_ceil', label: 'Conf Ceiling gov', category: 'Structure', weight: 0.03, reliability: 0.95, creditAllocation: 1, desc: 'Max confidence' },
    { id: 'gv_main', label: 'Confidence Gov', category: 'Structure', weight: 0.10, reliability: 0.98, creditAllocation: 4, desc: 'Final confidence' },
    { id: 'gv_convict', label: 'Conviction Index', category: 'Trend', weight: 0.06, reliability: 0.95, creditAllocation: 4, desc: 'Score * Conf' },
    { id: 'gv_risk_adj', label: 'Risk-Adj Score', category: 'Trend', weight: 0.08, reliability: 0.98, creditAllocation: 5, desc: 'Final UI Score' },
    { id: 'gv_elig', label: 'Trade Eligible', category: 'Structure', weight: 0.05, reliability: 0.95, creditAllocation: 1, desc: 'Go/No-Go' },
    { id: 'gv_size', label: 'Position Sizing', category: 'Vol', weight: 0.05, reliability: 0.95, creditAllocation: 1, desc: 'Size recommendation' },
    { id: 'gv_stop', label: 'Stop Quality', category: 'Structure', weight: 0.04, reliability: 0.90, creditAllocation: 1, desc: 'Structural stop' },
    { id: 'gv_target', label: 'Target Realism', category: 'Structure', weight: 0.04, reliability: 0.90, creditAllocation: 1, desc: 'Vol-adj target' },
    { id: 'gv_rr', label: 'R:R Validity', category: 'Structure', weight: 0.05, reliability: 0.92, creditAllocation: 1, desc: 'Asymmetry check' },
    { id: 'gv_exec', label: 'Exec Feasibility', category: 'Liquidity', weight: 0.05, reliability: 0.92, creditAllocation: 1, desc: 'Slippage risk' },
    { id: 'FINAL_MASTER', label: 'MASTER TECH SCORE', category: 'Trend', weight: 1.00, reliability: 0.99, creditAllocation: 5, desc: 'THE FINAL VERDICT' }
];

// Total credits for Technical page
export const TOTAL_TECHNICAL_CREDITS = 500;

// =============================
// Helper Functions
// =============================

// SEEDED RANDOM for consistency across pages
let _seed = 5678;
function seededRandom() {
    const x = Math.sin(_seed++) * 10000;
    return x - Math.floor(x);
}

function generateHistory(baseValue, volatility, count = 7) {
    const history = [];
    let current = baseValue;
    for (let i = 0; i < count; i++) {
        const change = (seededRandom() - 0.5) * volatility;
        current += change;
        history.push(current);
    }
    return history.reverse(); // Newest first
}

// =============================
// Simulation Engine
// =============================

export function generateLiveTechnicalData() {
    _seed = 5678; // Reset seed for deterministic output across pages
    // Market Context BASE (e.g., Nifty 50 Index level)
    const BASE_PRICE = 21450 + (seededRandom() * 200 - 100);
    const cardCount = technicalIndicatorsConfig.length;

    return technicalIndicatorsConfig.map(config => {
        let raw = 0;
        let unit = '';
        let normalized = 0; // -1 to 1
        let trendState = "Stable";

        // Random Noise (-1 to 1)
        const noise = (seededRandom() * 2 - 1);

        // 1. DETERMINE VALUE RANGES BASED ON ID/CATEGORY
        const id = config.id.toLowerCase();
        const label = config.label.toLowerCase();

        // --- OSCILLATORS (0-100) ---
        if (label.includes('rsi') || label.includes('stoch') || label.includes('adx') || label.includes('cci') || label.includes('mfi')) {
            raw = 50 + (noise * 30); // 20 to 80 range
            unit = '';
            // Normalize: 0=Sold, 100=Bought. 
            normalized = (raw - 50) / 40;
            if (label.includes('adx')) {
                raw = 25 + Math.abs(noise * 20); // ADX usually 15-60
                normalized = (raw - 25) / 25;
            }

            // --- MACD / OSCILLATORS (Centered on 0) ---
        } else if (label.includes('macd') || label.includes('roc') || label.includes('slope') || label.includes('bias')) {
            raw = noise * 5; // -5 to +5
            unit = '';
            normalized = raw / 4;

            // --- PRICE SENSITIVE (Trend Lines, MA, Bands) ---
        } else if (label.includes('ema') || label.includes('sma') || label.includes('bollinger') || label.includes('kelter') || label.includes('supertrend') || label.includes('vwap') || label.includes('sar')) {
            // Price Level
            raw = BASE_PRICE + (noise * 100);
            unit = '';
            // Normalized based on relation to Base Price (mock)
            normalized = (raw - BASE_PRICE) / 100;

            // --- VOLATILITY (ATR - Price Units) ---
        } else if (label.includes('atr') || label.includes('width')) {
            if (label.includes('width')) {
                raw = 2 + Math.abs(noise); // Band width %
                unit = '%';
            } else {
                raw = 145 + (noise * 20); // Nifty ATR approx
                unit = 'pts';
            }
            normalized = -noise;

            // --- RATIOS & PERCENTAGES ---
        } else if (label.includes('percent') || label.includes('ratio') || label.includes('yield') || label.includes('beta') || label.includes('correlation') || label.includes('prob') || label.includes('win')) {
            raw = 1 + (noise * 0.5);
            unit = 'x';
            if (label.includes('percent') || label.includes('yield') || label.includes('return') || label.includes('prob') || label.includes('win')) {
                if (label.includes('prob') || label.includes('win')) {
                    raw = 65 + (noise * 20); // 45-85%
                } else {
                    raw = (noise * 5); // -5% to +5%
                }
                unit = '%';
            }
            normalized = raw / 2;

            // --- SCORES & INDICES (0-100) ---
        } else if (label.includes('score') || label.includes('index') || label.includes('strength') || label.includes('quality') || label.includes('integrity') || label.includes('health')) {
            raw = 75 + (noise * 20); // 55-95
            unit = '/100';
            normalized = (raw - 50) / 40;

            // --- GENERIC FALLBACK ---
        } else {
            // Default based on category
            if (config.category === 'Volume' || config.category === 'Breadth') {
                raw = 1000000 + (noise * 200000);
                unit = 'Vol';
                if (label.includes('rel')) { raw = 1.2 + (noise * 0.5); unit = 'x'; }
            } else {
                raw = 50 + (noise * 30); // Default to oscillator-like
                unit = '';
            }
        }

        // 2. REFINE NORMALIZATION & TREND STATE
        normalized = Math.max(-1, Math.min(1, normalized));


        if (normalized > 0.5) trendState = "Accelerating";
        else if (normalized > 0.2) trendState = "Stable";
        else if (normalized < -0.2) trendState = "Weak";
        else if (normalized < -0.5) trendState = "Fading";

        // 3. GENERATE 7-DAY HISTORY FOR SPARKLINE/BARS
        const histVol = Math.abs(raw * 0.05); // 5% fluctuation
        const history = generateHistory(raw, histVol, 7);

        return {
            ...config,
            normalized, // Internal Logic
            raw: typeof raw === 'number' ? raw.toFixed(2) : raw, // UI Display
            unit, // UI Display
            trendState, // UI Context
            creditScore: config.reliability,
            score: 50 + (normalized * 50),
            history // For charts
        };
    });
}
