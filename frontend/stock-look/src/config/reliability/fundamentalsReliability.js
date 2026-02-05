/**
 * @file fundamentalsReliability.js
 * @purpose Central source of truth for Fundamental Indicator Reliability scores.
 */

export const FUNDAMENTALS_RELIABILITY = {
    // Valuation
    'nifty_pe': 0.75,
    'forward_pe': 0.80,
    'nifty_pb': 0.70,
    'earnings_yield': 0.90,
    'mcap_gdp': 0.85,

    // Earnings
    'eps_yoy': 0.90,
    'forward_eps': 0.85,
    'earnings_revision': 0.95,
    'sector_earnings': 0.75,
    'profit_margin': 0.80,

    // Macro
    'gdp': 0.90,
    'cpi': 0.95,
    'repo': 0.95,
    'policy_stance': 0.90,
    'fiscal_deficit': 0.80,
    'current_account': 0.85,

    // Liquidity
    'fii': 0.95,
    'dii': 0.85,
    'fii_trend': 0.95,
    'system_liquidity': 0.90,
    'mf_flows': 0.85,

    // Sector
    'sector_valuation': 0.75,
    'sector_growth': 0.80,
    'sector_concentration': 0.70,
    'cyc_def': 0.85,

    // Corporate
    'policy_tailwinds': 0.80,
    'corp_debt': 0.85,
    'credit_growth': 0.90,
    'tax_env': 0.70,

    // Global
    'global_growth': 0.80,
    'crude': 0.85,
    'usdinr': 0.90,
    'global_liq': 0.95,

    // Risk
    'sovereign_risk': 0.85,
    'npa': 0.95,
    'reform_momentum': 0.75
};

export default FUNDAMENTALS_RELIABILITY;
