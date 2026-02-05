/**
 * @file optionsReliability.js
 * @purpose Central source of truth for Options Indicator Reliability scores.
 */

export const OPTIONS_RELIABILITY = {
    // Open Interest
    'max_pain': 0.95,
    'pcr': 0.85,
    'call_wall': 0.85,
    'put_wall': 0.85,

    // Greeks
    'net_delta': 0.95,
    'net_gamma': 0.85,
    'theta_decay': 0.75,
    'vega_risk': 0.75,

    // Volatility
    'atm_iv': 0.75,
    'iv_rank': 0.85,
    'iv_skew': 0.95,
    'hv_iv_spread': 0.75
};

export default OPTIONS_RELIABILITY;
