export const CARD_REGISTRY = {
    // ══════════════════════════════════════════════════════════════════════════
    // MASTER DASHBOARD
    // ══════════════════════════════════════════════════════════════════════════
    praxis_composite_header: {
        id: 'praxis_composite_header',
        type: 'widget',
        displayName: 'Master Dashboard Header',
        page: 'Master',
        section: 'Header',
        appliesTo: 'both',
        legacyIds: ['Master', 'master_header', 'dashboard']
    },
    master_manual_chat: {
        id: 'master_manual_chat',
        type: 'widget',
        displayName: 'Master Manual Chat',
        page: 'Master',
        section: 'General',
        appliesTo: 'both',
        legacyIds: ['master_manual']
    },
    master_qchat: {
        id: 'master_qchat',
        type: 'widget',
        displayName: 'Master QChat Context',
        page: 'Master',
        section: 'General',
        appliesTo: 'both',
        legacyIds: ['qchat_dashboard', 'qchat_global_macros']
    },
    market_heatmap: {
        id: 'market_heatmap',
        type: 'widget',
        displayName: 'Market Heatmap',
        aliases: ['heat map', 'heatmap', 'market heat map'],
        page: 'Master',
        section: 'Widgets',
        appliesTo: 'n/a', // Passive widget
        legacyIds: []
    },
    fii_dii_flow_master: {
        id: 'fii_dii_flow_master',
        type: 'widget',
        displayName: 'Institutional Flow',
        aliases: ['fii dii', 'fii/dii', 'institutional'],
        page: 'Master',
        section: 'Widgets',
        appliesTo: 'n/a', // Passive widget
        legacyIds: ['fii_dii']
    },
    options_pulse: {
        id: 'options_pulse',
        type: 'widget',
        displayName: 'Options Pulse',
        page: 'Master',
        section: 'Widgets',
        appliesTo: 'n/a', // Passive widget
        legacyIds: []
    },
    sector_rotation: {
        id: 'sector_rotation',
        type: 'widget',
        displayName: 'Sector Rotation',
        page: 'Master',
        section: 'Widgets',
        appliesTo: 'n/a', // Passive widget
        legacyIds: []
    },
    volume_shockers: {
        id: 'volume_shockers',
        type: 'widget',
        displayName: 'Most Active',
        page: 'Master',
        section: 'Widgets',
        appliesTo: 'n/a', // Passive widget
        legacyIds: [],
        aliases: ['volume shockers', 'most active contracts', 'active options', 'most active options']
    },
    catalyst_calendar: {
        id: 'catalyst_calendar',
        type: 'widget',
        displayName: 'Catalyst Calendar',
        page: 'Master',
        section: 'Widgets',
        appliesTo: 'n/a', // Passive widget
        legacyIds: [],
        aliases: ['news', 'market news', 'live news', 'catalyst', 'headlines']
    },

    // ══════════════════════════════════════════════════════════════════════════
    // FUNDAMENTALS DASHBOARD
    // ══════════════════════════════════════════════════════════════════════════
    fundamentals_index_header: { id: 'fundamentals_index_header', type: 'widget', displayName: 'Index Header Insight', page: 'Fundamentals', section: 'General', appliesTo: 'indices', legacyIds: [] },
    fundamentals_company_header: { id: 'fundamentals_company_header', type: 'widget', displayName: 'Company Header Insight', page: 'Fundamentals', section: 'General', appliesTo: 'company', legacyIds: [] },
    fund_manual: { id: 'fund_manual', type: 'widget', displayName: 'Fundamental Manual Chat', page: 'Fundamentals', section: 'General', appliesTo: 'both', legacyIds: [] },
    qchat_fundamentals: { id: 'qchat_fundamentals', type: 'widget', displayName: 'Fundamental QChat', page: 'Fundamentals', section: 'General', appliesTo: 'both', legacyIds: [] },

    // Valuation
    pe_ratio: {
        id: 'pe_ratio',
        type: 'card',
        displayName: 'Trailing P/E Ratio',
        aliases: ['pe ratio', 'p/e ratio', 'p/e'],
        page: 'Fundamentals',
        section: 'Valuation',
        appliesTo: 'equity',
        legacyIds: ['pe']
    },
    forward_pe: {
        id: 'forward_pe',
        type: 'card',
        displayName: 'Forward P/E',
        aliases: ['forward pe', 'forward p/e'],
        page: 'Fundamentals',
        section: 'Valuation',
        appliesTo: 'company',
        legacyIds: []
    },
    pb_ratio: { id: 'pb_ratio', type: 'card', displayName: 'P/B Ratio', page: 'Fundamentals', section: 'Valuation', appliesTo: 'company', legacyIds: [] },
    ev_ebitda: { id: 'ev_ebitda', type: 'card', displayName: 'EV/EBITDA', page: 'Fundamentals', section: 'Valuation', appliesTo: 'company', legacyIds: [] },
    earnings_yield: { id: 'earnings_yield', type: 'card', displayName: 'Earnings Yield', page: 'Fundamentals', section: 'Valuation', appliesTo: 'company', legacyIds: [] },
    relative_valuation: { id: 'relative_valuation', type: 'card', displayName: 'Relative Valuation', page: 'Fundamentals', section: 'Valuation', appliesTo: 'company', legacyIds: [] },
    dividend_yield: { id: 'dividend_yield', type: 'card', displayName: 'Dividend Yield', page: 'Fundamentals', section: 'Valuation', appliesTo: 'both', legacyIds: [] },
    nifty_pe: { id: 'nifty_pe', type: 'card', displayName: 'Index P/E', page: 'Fundamentals', section: 'Valuation', appliesTo: 'indices', legacyIds: [] },
    nifty_pb: { id: 'nifty_pb', type: 'card', displayName: 'Index P/B', page: 'Fundamentals', section: 'Valuation', appliesTo: 'indices', legacyIds: [] },
    mcap_gdp: { id: 'mcap_gdp', type: 'card', displayName: 'Market Cap / GDP', page: 'Fundamentals', section: 'Valuation', appliesTo: 'indices', legacyIds: ['market_cap_gdp'] },

    // Earnings
    eps_growth: { id: 'eps_growth', type: 'card', displayName: 'EPS Growth', page: 'Fundamentals', section: 'Earnings', appliesTo: 'company', legacyIds: [] },
    revenue_growth: { id: 'revenue_growth', type: 'card', displayName: 'Revenue Growth', page: 'Fundamentals', section: 'Earnings', appliesTo: 'company', legacyIds: [] },
    profit_growth: { id: 'profit_growth', type: 'card', displayName: 'Profit Growth', page: 'Fundamentals', section: 'Earnings', appliesTo: 'company', legacyIds: [] },
    earnings_trend: { id: 'earnings_trend', type: 'card', displayName: 'Earnings Trend', page: 'Fundamentals', section: 'Earnings', appliesTo: 'company', legacyIds: [] },
    earnings_quality: { id: 'earnings_quality', type: 'card', displayName: 'Earnings Quality', page: 'Fundamentals', section: 'Earnings', appliesTo: 'company', legacyIds: [] },
    eps_yoy: { id: 'eps_yoy', type: 'card', displayName: 'EPS YoY', page: 'Fundamentals', section: 'Earnings', appliesTo: 'both', legacyIds: [] },
    forward_eps: { id: 'forward_eps', type: 'card', displayName: 'Forward EPS', page: 'Fundamentals', section: 'Earnings', appliesTo: 'both', legacyIds: [] },
    profit_margin: { id: 'profit_margin', type: 'card', displayName: 'Profit Margin', page: 'Fundamentals', section: 'Earnings', appliesTo: 'both', legacyIds: [] },

    // Corporate / Financials
    roe: { id: 'roe', type: 'card', displayName: 'ROE', page: 'Fundamentals', section: 'Corporate', appliesTo: 'company', legacyIds: [] },
    roce: { id: 'roce', type: 'card', displayName: 'ROCE', page: 'Fundamentals', section: 'Corporate', appliesTo: 'company', legacyIds: [] },
    roa: { id: 'roa', type: 'card', displayName: 'ROA', page: 'Fundamentals', section: 'Corporate', appliesTo: 'company', legacyIds: [] },
    net_margin: { id: 'net_margin', type: 'card', displayName: 'Net Margin', page: 'Fundamentals', section: 'Corporate', appliesTo: 'company', legacyIds: [] },
    operating_margin: { id: 'operating_margin', type: 'card', displayName: 'Operating Margin', page: 'Fundamentals', section: 'Corporate', appliesTo: 'company', legacyIds: [] },
    debt_to_equity: { id: 'debt_to_equity', type: 'card', displayName: 'Debt to Equity', page: 'Fundamentals', section: 'Corporate', appliesTo: 'company', legacyIds: [] },
    interest_coverage: { id: 'interest_coverage', type: 'card', displayName: 'Interest Coverage', page: 'Fundamentals', section: 'Corporate', appliesTo: 'company', legacyIds: [] },
    free_cash_flow: { id: 'free_cash_flow', type: 'card', displayName: 'Free Cash Flow', page: 'Fundamentals', section: 'Corporate', appliesTo: 'company', legacyIds: [] },
    current_ratio: { id: 'current_ratio', type: 'card', displayName: 'Current Ratio', page: 'Fundamentals', section: 'Corporate', appliesTo: 'company', legacyIds: [] },
    credit_growth: { id: 'credit_growth', type: 'card', displayName: 'Credit Growth', page: 'Fundamentals', section: 'Corporate', appliesTo: 'indices', legacyIds: [] },
    corp_debt: { id: 'corp_debt', type: 'card', displayName: 'Corporate Debt', page: 'Fundamentals', section: 'Corporate', appliesTo: 'indices', legacyIds: [] },

    // Ownership
    promoter_holding: { id: 'promoter_holding', type: 'card', displayName: 'Promoter Holding', page: 'Fundamentals', section: 'Ownership', appliesTo: 'company', legacyIds: [] },
    smart_money_flow: { id: 'smart_money_flow', type: 'card', displayName: 'Smart Money Flow', page: 'Fundamentals', section: 'Ownership', appliesTo: 'company', legacyIds: [] },
    fii_dii_flow: { id: 'fii_dii_flow', type: 'card', displayName: 'FII / DII Flow', page: 'Fundamentals', section: 'Ownership', appliesTo: 'company', legacyIds: [] },

    // Macro
    gdp_growth: { id: 'gdp_growth', type: 'card', displayName: 'GDP Growth', page: 'Fundamentals', section: 'Macro', appliesTo: 'both', legacyIds: [] },
    gdp: { id: 'gdp', type: 'card', displayName: 'Index GDP', page: 'Fundamentals', section: 'Macro', appliesTo: 'indices', legacyIds: [] },
    cpi: { id: 'cpi', type: 'card', displayName: 'CPI', page: 'Fundamentals', section: 'Macro', appliesTo: 'indices', legacyIds: [] },
    repo: { id: 'repo', type: 'card', displayName: 'Repo Rate', page: 'Fundamentals', section: 'Macro', appliesTo: 'indices', legacyIds: [] },
    fiscal_deficit: { id: 'fiscal_deficit', type: 'card', displayName: 'Fiscal Deficit', page: 'Fundamentals', section: 'Macro', appliesTo: 'indices', legacyIds: [] },

    // Liquidity
    fii: { id: 'fii', type: 'card', displayName: 'FII Flow', page: 'Fundamentals', section: 'Liquidity', appliesTo: 'indices', legacyIds: [] },
    dii: { id: 'dii', type: 'card', displayName: 'DII Flow', page: 'Fundamentals', section: 'Liquidity', appliesTo: 'indices', legacyIds: [] },
    fii_trend: { id: 'fii_trend', type: 'card', displayName: 'FII Trend', page: 'Fundamentals', section: 'Liquidity', appliesTo: 'indices', legacyIds: [] },
    system_liquidity: { id: 'system_liquidity', type: 'card', displayName: 'System Liquidity', page: 'Fundamentals', section: 'Liquidity', appliesTo: 'indices', legacyIds: [] },
    mf_flows: { id: 'mf_flows', type: 'card', displayName: 'MF Flows', page: 'Fundamentals', section: 'Liquidity', appliesTo: 'indices', legacyIds: [] },
    advance_decline: { id: 'advance_decline', type: 'card', displayName: 'Advance / Decline', page: 'Fundamentals', section: 'Liquidity', appliesTo: 'indices', legacyIds: [] },

    // Risk
    policy_tailwinds: { id: 'policy_tailwinds', type: 'card', displayName: 'Policy Tailwinds', page: 'Fundamentals', section: 'Risk', appliesTo: 'indices', legacyIds: [] },
    india_vix: { id: 'india_vix', type: 'card', displayName: 'India VIX', page: 'Fundamentals', section: 'Risk', appliesTo: 'indices', legacyIds: [] },

    // Global
    global_liq:       { id: 'global_liq', type: 'card', displayName: 'Global Liquidity', page: 'Fundamentals', section: 'Global', appliesTo: 'indices', legacyIds: [] },

    // General / Peer
    peer_comparison: { id: 'peer_comparison', type: 'card', displayName: 'Peer Comparison', page: 'Fundamentals', section: 'General', appliesTo: 'company', legacyIds: [] },
    analyst_consensus: { id: 'analyst_consensus', type: 'card', displayName: 'Analyst Consensus', page: 'Fundamentals', section: 'General', appliesTo: 'company', legacyIds: [] },
    corporate_actions: { id: 'corporate_actions', type: 'card', displayName: 'Corporate Actions', page: 'Fundamentals', section: 'General', appliesTo: 'company', legacyIds: [] },
    cash_conversion: { id: 'cash_conversion', type: 'card', displayName: 'Cash Conversion', page: 'Fundamentals', section: 'General', appliesTo: 'company', legacyIds: [] },
    sector_dashboard: { id: 'sector_dashboard', type: 'card', displayName: 'Sector Dashboard', page: 'Fundamentals', section: 'General', appliesTo: 'both', legacyIds: [] },

    // ══════════════════════════════════════════════════════════════════════════
    // TECHNICAL DASHBOARD
    // ══════════════════════════════════════════════════════════════════════════
    technical_index_header: { id: 'technical_index_header', type: 'widget', displayName: 'Index Header Insight', page: 'Technical', section: 'General', appliesTo: 'indices', legacyIds: [] },
    technical_company_header: { id: 'technical_company_header', type: 'widget', displayName: 'Company Header Insight', page: 'Technical', section: 'General', appliesTo: 'company', legacyIds: [] },
    tech_manual:             { id: 'tech_manual',             type: 'widget', displayName: 'Technical Manual Chat', page: 'Technical', section: 'General', appliesTo: 'both', legacyIds: [] },
    qchat_technical:         { id: 'qchat_technical',         type: 'widget', displayName: 'Technical QChat',       page: 'Technical', section: 'General', appliesTo: 'both', legacyIds: ['qchat_technicals'] },

    // Trend
    ema_20: { id: 'ema_20', type: 'card', displayName: 'EMA 20', aliases: ['ema 20', 'exponential moving average 20', '20 ema', '20 day ema', 'emma 20', 'year may 20', 'year may 220', 'year me 20'], page: 'Technical', section: 'Trend', appliesTo: 'both', legacyIds: [] },
    ema_50: { id: 'ema_50', type: 'card', displayName: 'EMA 50', aliases: ['ema 50', 'exponential moving average 50', '50 ema', '50 day ema', 'emma 50', 'year may 50', 'year me 50'], page: 'Technical', section: 'Trend', appliesTo: 'both', legacyIds: [] },
    ema_200: { id: 'ema_200', type: 'card', displayName: 'EMA 200', aliases: ['ema 200', 'exponential moving average 200', '200 ema', '200 day ema', 'emma 200', 'year may 200', 'year me 200'], page: 'Technical', section: 'Trend', appliesTo: 'both', legacyIds: [] },
    sma_50: { id: 'sma_50', type: 'card', displayName: 'SMA 50', aliases: ['sma 50', 'simple moving average 50', '50 sma', '50 day sma'], page: 'Technical', section: 'Trend', appliesTo: 'both', legacyIds: [] },
    sma_200: { id: 'sma_200', type: 'card', displayName: 'SMA 200', aliases: ['sma 200', 'simple moving average 200', '200 sma', '200 day sma'], page: 'Technical', section: 'Trend', appliesTo: 'both', legacyIds: [] },
    adx: { id: 'adx', type: 'card', displayName: 'ADX (14)', aliases: ['adx', 'average directional index'], page: 'Technical', section: 'Trend', appliesTo: 'both', legacyIds: [] },
    supertrend: { id: 'supertrend', type: 'card', displayName: 'Supertrend', page: 'Technical', section: 'Trend', appliesTo: 'both', legacyIds: [] },
    beta_correlation: { id: 'beta_correlation', type: 'card', displayName: 'Beta Correlation', page: 'Technical', section: 'Trend', appliesTo: 'both', legacyIds: [] },

    // Momentum
    rsi: { id: 'rsi', type: 'card', displayName: 'RSI (14)', aliases: ['rsi', 'relative strength index'], page: 'Technical', section: 'Momentum', appliesTo: 'both', legacyIds: [] },
    macd: { id: 'macd', type: 'card', displayName: 'MACD', aliases: ['macd', 'moving average convergence divergence', 'mac d', 'macdi'], page: 'Technical', section: 'Momentum', appliesTo: 'both', legacyIds: [] },
    stoch_rsi: { id: 'stoch_rsi', type: 'card', displayName: 'Stoch RSI', page: 'Technical', section: 'Momentum', appliesTo: 'both', legacyIds: [] },
    williams_r: { id: 'williams_r', type: 'card', displayName: 'Williams %R', page: 'Technical', section: 'Momentum', appliesTo: 'both', legacyIds: [] },

    // Volatility
    bb_20_2: { id: 'bb_20_2', type: 'card', displayName: 'Bollinger Bands', page: 'Technical', section: 'Volatility', appliesTo: 'both', legacyIds: [] },
    atr: { id: 'atr', type: 'card', displayName: 'ATR', page: 'Technical', section: 'Volatility', appliesTo: 'both', legacyIds: [] },
    kc: { id: 'kc', type: 'card', displayName: 'Keltner Channels', page: 'Technical', section: 'Volatility', appliesTo: 'both', legacyIds: [] },

    // Volume
    volume_sma: { id: 'volume_sma', type: 'card', displayName: 'Volume SMA', aliases: ['volume sma', 'volume moving average'], page: 'Technical', section: 'Volume', appliesTo: 'both', legacyIds: [] },
    obv: { id: 'obv', type: 'card', displayName: 'OBV', page: 'Technical', section: 'Volume', appliesTo: 'both', legacyIds: [] },
    cmf: { id: 'cmf', type: 'card', displayName: 'CMF', page: 'Technical', section: 'Volume', appliesTo: 'both', legacyIds: [] },
    vwap: { id: 'vwap', type: 'card', displayName: 'VWAP', aliases: ['vwap', 'v wap', 'volume weighted average price'], page: 'Technical', section: 'Volume', appliesTo: 'both', legacyIds: [] },

    // Structure
    support: { id: 'support', type: 'card', displayName: 'Support', page: 'Technical', section: 'Structure', appliesTo: 'both', legacyIds: [] },
    resistance: { id: 'resistance', type: 'card', displayName: 'Resistance', page: 'Technical', section: 'Structure', appliesTo: 'both', legacyIds: [] },
    trendline: { id: 'trendline', type: 'card', displayName: 'Trendline', page: 'Technical', section: 'Structure', appliesTo: 'both', legacyIds: [] },
    pivot: { id: 'pivot', type: 'card', displayName: 'Pivot Points', page: 'Technical', section: 'Structure', appliesTo: 'both', legacyIds: [] },
    fibonacci: { id: 'fibonacci', type: 'card', displayName: 'Fibonacci', page: 'Technical', section: 'Structure', appliesTo: 'both', legacyIds: [] },

    // Breadth
    breadth_ratio: { id: 'breadth_ratio', type: 'card', displayName: 'Breadth Ratio (ADR)', page: 'Technical', section: 'Breadth', appliesTo: 'indices', legacyIds: [] },
    mcclellan: { id: 'mcclellan', type: 'card', displayName: 'McClellan Osc', page: 'Technical', section: 'Breadth', appliesTo: 'indices', legacyIds: [] },
    ad_line: { id: 'ad_line', type: 'card', displayName: 'A/D Line', page: 'Technical', section: 'Breadth', appliesTo: 'indices', legacyIds: [] },
    nh_nl: { id: 'nh_nl', type: 'card', displayName: 'New Highs / Lows', page: 'Technical', section: 'Breadth', appliesTo: 'indices', legacyIds: [] },
    trin: { id: 'trin', type: 'card', displayName: 'TRIN (Arms)', page: 'Technical', section: 'Breadth', appliesTo: 'indices', legacyIds: [] },


    // ══════════════════════════════════════════════════════════════════════════
    // OPTIONS DASHBOARD
    // ══════════════════════════════════════════════════════════════════════════
    options_header: { id: 'options_header', type: 'widget', displayName: 'Options Header Insight', page: 'Options', section: 'General', appliesTo: 'both', legacyIds: [] },
    options_manual:          { id: 'options_manual',          type: 'widget', displayName: 'Options Manual Chat',   page: 'Options',   section: 'General', appliesTo: 'both', legacyIds: ['opt_manual'] },
    qchat_options:           { id: 'qchat_options',           type: 'widget', displayName: 'Options QChat',         page: 'Options',   section: 'General', appliesTo: 'both', legacyIds: [] },

    // Widgets (Data Heavy Components)
    options_prodesk: { id: 'options_prodesk', type: 'widget', displayName: 'ProDesk Action Signal', page: 'Options', section: 'Widgets', appliesTo: 'both', legacyIds: [] },
    options_chain_table: { id: 'options_chain_table', type: 'widget', displayName: 'Options Chain', page: 'Options', section: 'Widgets', appliesTo: 'both', legacyIds: [] },
    options_history_chart: { id: 'options_history_chart', type: 'widget', displayName: 'Options History', page: 'Options', section: 'Widgets', appliesTo: 'both', legacyIds: [] },

    // Volatility
    atm_iv: { id: 'atm_iv', type: 'card', displayName: 'ATM IV', page: 'Options', section: 'Volatility', appliesTo: 'both', legacyIds: [] },
    iv_rank: { id: 'iv_rank', type: 'card', displayName: 'IV Rank', page: 'Options', section: 'Volatility', appliesTo: 'both', legacyIds: [] },
    iv_percentile: { id: 'iv_percentile', type: 'card', displayName: 'IV Percentile', page: 'Options', section: 'Volatility', appliesTo: 'both', legacyIds: [] },

    // Open Interest
    total_call_oi: { id: 'total_call_oi', type: 'card', displayName: 'Total Call OI', page: 'Options', section: 'Open Interest', appliesTo: 'both', legacyIds: [] },
    total_put_oi: { id: 'total_put_oi', type: 'card', displayName: 'Total Put OI', page: 'Options', section: 'Open Interest', appliesTo: 'both', legacyIds: [] },
    oi_change: { id: 'oi_change', type: 'card', displayName: 'OI Change', page: 'Options', section: 'Open Interest', appliesTo: 'both', legacyIds: [] },

    // Greeks
    delta: { id: 'delta', type: 'card', displayName: 'Delta', page: 'Options', section: 'Greeks', appliesTo: 'both', legacyIds: [] },
    gamma: { id: 'gamma', type: 'card', displayName: 'Gamma', page: 'Options', section: 'Greeks', appliesTo: 'both', legacyIds: [] },
    theta: { id: 'theta', type: 'card', displayName: 'Theta', page: 'Options', section: 'Greeks', appliesTo: 'both', legacyIds: [] },
    vega: { id: 'vega', type: 'card', displayName: 'Vega', page: 'Options', section: 'Greeks', appliesTo: 'both', legacyIds: [] },

    // PCR & Market Positioning
    pcr_oi: { id: 'pcr_oi', type: 'card', displayName: 'PCR OI', page: 'Options', section: 'Put-Call Ratio', appliesTo: 'both', legacyIds: [] },
    pcr_volume: { id: 'pcr_volume', type: 'card', displayName: 'PCR Volume', page: 'Options', section: 'Put-Call Ratio', appliesTo: 'both', legacyIds: [] },
    max_pain: { id: 'max_pain', type: 'card', displayName: 'Max Pain', page: 'Options', section: 'Market Positioning', appliesTo: 'both', legacyIds: [] },

    // ══════════════════════════════════════════════════════════════════════════
    // FOREIGN / GLOBAL MACRO DASHBOARD
    // ══════════════════════════════════════════════════════════════════════════

    // General / Chat widgets
    foreign_header:   { id: 'foreign_header',   type: 'widget', displayName: 'Global Macro Header Insight', page: 'Foreign', section: 'General', appliesTo: 'n/a', legacyIds: [] },
    global_manual:    { id: 'global_manual',    type: 'widget', displayName: 'Global Manual Chat',          page: 'Foreign', section: 'General', appliesTo: 'n/a', legacyIds: [] },
    qchat_global:     { id: 'qchat_global',     type: 'widget', displayName: 'Global QChat',                page: 'Foreign', section: 'General', appliesTo: 'n/a', legacyIds: [] },

    // Currency (4)
    dxy:              { id: 'dxy',              type: 'card', displayName: 'Dollar Index (DXY)', page: 'Foreign', section: 'Currency',           appliesTo: 'n/a', legacyIds: [] },
    eurusd:           { id: 'eurusd',           type: 'card', displayName: 'EUR/USD',            page: 'Foreign', section: 'Currency',           appliesTo: 'n/a', legacyIds: [] },
    usdjpy:           { id: 'usdjpy',           type: 'card', displayName: 'USD/JPY',            page: 'Foreign', section: 'Currency',           appliesTo: 'n/a', legacyIds: [] },
    usd_inr:          { id: 'usd_inr',          type: 'card', displayName: 'USD/INR',            page: 'Foreign', section: 'Currency',           appliesTo: 'n/a', legacyIds: [] },

    // US Markets (3)
    sp_futures:       { id: 'sp_futures',       type: 'card', displayName: 'S&P 500',           page: 'Foreign', section: 'US Markets',         appliesTo: 'n/a', legacyIds: [] },
    nasdaq_futures:   { id: 'nasdaq_futures',   type: 'card', displayName: 'Nasdaq 100',        page: 'Foreign', section: 'US Markets',         appliesTo: 'n/a', legacyIds: [] },
    dow_futures:      { id: 'dow_futures',      type: 'card', displayName: 'Dow Jones',         page: 'Foreign', section: 'US Markets',         appliesTo: 'n/a', legacyIds: [] },

    // Global Indices (7)
    nikkei:           { id: 'nikkei',           type: 'card', displayName: 'Nikkei 225',        page: 'Foreign', section: 'Global Indices',     appliesTo: 'n/a', legacyIds: [] },
    ftse:             { id: 'ftse',             type: 'card', displayName: 'FTSE 100',          page: 'Foreign', section: 'Global Indices',     appliesTo: 'n/a', legacyIds: [] },
    dax:              { id: 'dax',              type: 'card', displayName: 'DAX 40',            page: 'Foreign', section: 'Global Indices',     appliesTo: 'n/a', legacyIds: [] },
    hangseng:         { id: 'hangseng',         type: 'card', displayName: 'Hang Seng',         page: 'Foreign', section: 'Global Indices',     appliesTo: 'n/a', legacyIds: [] },
    shanghai:         { id: 'shanghai',         type: 'card', displayName: 'Shanghai Comp',     page: 'Foreign', section: 'Global Indices',     appliesTo: 'n/a', legacyIds: [] },
    cac40:            { id: 'cac40',            type: 'card', displayName: 'CAC 40',            page: 'Foreign', section: 'Global Indices',     appliesTo: 'n/a', legacyIds: [] },
    eurostoxx:        { id: 'eurostoxx',        type: 'card', displayName: 'Euro Stoxx 50',     page: 'Foreign', section: 'Global Indices',     appliesTo: 'n/a', legacyIds: [] },

    // Commodities (8)
    gold:             { id: 'gold',             type: 'card', displayName: 'Gold',              page: 'Foreign', section: 'Commodities',        appliesTo: 'n/a', legacyIds: [] },
    silver:           { id: 'silver',           type: 'card', displayName: 'Silver',            page: 'Foreign', section: 'Commodities',        appliesTo: 'n/a', legacyIds: [] },
    crude:            { id: 'crude',            type: 'card', displayName: 'Brent Crude',       page: 'Foreign', section: 'Commodities',        appliesTo: 'n/a', legacyIds: ['brent_crude'] },
    copper:           { id: 'copper',           type: 'card', displayName: 'Copper',            page: 'Foreign', section: 'Commodities',        appliesTo: 'n/a', legacyIds: [] },
    natgas:           { id: 'natgas',           type: 'card', displayName: 'Natural Gas',       page: 'Foreign', section: 'Commodities',        appliesTo: 'n/a', legacyIds: [] },
    wheat:            { id: 'wheat',            type: 'card', displayName: 'Wheat',             page: 'Foreign', section: 'Commodities',        appliesTo: 'n/a', legacyIds: [] },
    aluminum:         { id: 'aluminum',         type: 'card', displayName: 'Aluminum',          page: 'Foreign', section: 'Commodities',        appliesTo: 'n/a', legacyIds: [] },

    // Rates & Volatility (3)
    us_10y_yield:     { id: 'us_10y_yield',     type: 'card', displayName: 'US 10Y Yield',      page: 'Foreign', section: 'Rates & Volatility', appliesTo: 'n/a', legacyIds: [] },
    vix:              { id: 'vix',              type: 'card', displayName: 'VIX',               page: 'Foreign', section: 'Rates & Volatility', appliesTo: 'n/a', legacyIds: [] },
    move:             { id: 'move',             type: 'card', displayName: 'MOVE Index',        page: 'Foreign', section: 'Rates & Volatility', appliesTo: 'n/a', legacyIds: [] },

    // Digital Assets (1)
    bitcoin:          { id: 'bitcoin',          type: 'card', displayName: 'Bitcoin',           page: 'Foreign', section: 'Digital Assets',     appliesTo: 'n/a', legacyIds: [] },

    // ══════════════════════════════════════════════════════════════════════════
    // EVENTS DASHBOARD (Stubs for future expansion)
    // ══════════════════════════════════════════════════════════════════════════
    events_header:    { id: 'events_header',    type: 'widget', displayName: 'Events Header Insight', page: 'Events', section: 'General', appliesTo: 'both', legacyIds: [] },
    qchat_events:     { id: 'qchat_events',     type: 'widget', displayName: 'Events QChat',          page: 'Events', section: 'General', appliesTo: 'both', legacyIds: [] },
};

