export const SOURCE_REGISTRY = {
    // ----------------------------------------------------
    // OFFICIAL API (UPSTOX CORE - High Reliability)
    // ----------------------------------------------------
    pe_ratio: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    pb_ratio: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    eps_growth: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    profit_growth: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    revenue_growth: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    roe: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    roce: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    operating_margin: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    free_cash_flow: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    ev_ebitda: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    
    // Technicals (All computed from Upstox candles, effectively official)
    ema_20: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good'], staleness: { maxAgeMinutes: 15 } },
    ema_50: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good'], staleness: { maxAgeMinutes: 15 } },
    ema_200: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good'], staleness: { maxAgeMinutes: 15 } },
    rsi: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good'], staleness: { maxAgeMinutes: 15 } },
    macd: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good'], staleness: { maxAgeMinutes: 15 } },

    // Options (All from Upstox)
    total_call_oi: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good'], staleness: { maxAgeMinutes: 5 } },
    total_put_oi: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good'], staleness: { maxAgeMinutes: 5 } },
    oi_change: { sourceType: 'official_api', primaryProvider: 'Upstox', fallbackChain: ['last_known_good'], staleness: { maxAgeMinutes: 5 } },

    // ----------------------------------------------------
    // UNOFFICIAL SCRAPE (FRAGILE APIS)
    // ----------------------------------------------------
    // Yahoo Finance
    forward_pe: { sourceType: 'unofficial_scrape', primaryProvider: 'Yahoo Finance', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    interest_coverage: { sourceType: 'unofficial_scrape', primaryProvider: 'Yahoo Finance', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    india_vix: { sourceType: 'unofficial_scrape', primaryProvider: 'Yahoo Finance', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 15 } },
    beta: { sourceType: 'unofficial_scrape', primaryProvider: 'Yahoo Finance', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    aluminum: { sourceType: 'unofficial_scrape', primaryProvider: 'Yahoo Finance', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    sp500_futures: { sourceType: 'unofficial_scrape', primaryProvider: 'Yahoo Finance', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 15 } },
    nasdaq_futures: { sourceType: 'unofficial_scrape', primaryProvider: 'Yahoo Finance', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 15 } },
    dow_futures: { sourceType: 'unofficial_scrape', primaryProvider: 'Yahoo Finance', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 15 } },
    nikkei_225: { sourceType: 'unofficial_scrape', primaryProvider: 'Yahoo Finance', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 15 } },
    ftse_100: { sourceType: 'unofficial_scrape', primaryProvider: 'Yahoo Finance', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 15 } },
    dax_40: { sourceType: 'unofficial_scrape', primaryProvider: 'Yahoo Finance', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 15 } },
    hang_seng: { sourceType: 'unofficial_scrape', primaryProvider: 'Yahoo Finance', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 15 } },
    shanghai_composite: { sourceType: 'unofficial_scrape', primaryProvider: 'Yahoo Finance', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 15 } },
    cac_40: { sourceType: 'unofficial_scrape', primaryProvider: 'Yahoo Finance', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 15 } },
    euro_stoxx_50: { sourceType: 'unofficial_scrape', primaryProvider: 'Yahoo Finance', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 15 } },

    // FRED API
    gdp_growth: { sourceType: 'unofficial_scrape', primaryProvider: 'FRED', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    us_10y_yield: { sourceType: 'unofficial_scrape', primaryProvider: 'FRED', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    global_liquidity: { sourceType: 'unofficial_scrape', primaryProvider: 'FRED', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },

    // RBI API
    cpi_inflation: { sourceType: 'unofficial_scrape', primaryProvider: 'RBI', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    repo_rate: { sourceType: 'unofficial_scrape', primaryProvider: 'RBI', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    fiscal_deficit: { sourceType: 'unofficial_scrape', primaryProvider: 'RBI', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    credit_growth: { sourceType: 'unofficial_scrape', primaryProvider: 'RBI', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    system_liquidity: { sourceType: 'unofficial_scrape', primaryProvider: 'RBI', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    npa_ratio: { sourceType: 'unofficial_scrape', primaryProvider: 'RBI', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },

    // NSE Scraping
    promoter_holding: { sourceType: 'unofficial_scrape', primaryProvider: 'NSE', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    nifty_pe: { sourceType: 'unofficial_scrape', primaryProvider: 'NSE', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    nifty_pb: { sourceType: 'unofficial_scrape', primaryProvider: 'NSE', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    dividend_yield_index: { sourceType: 'unofficial_scrape', primaryProvider: 'NSE', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    eps_yoy_index: { sourceType: 'unofficial_scrape', primaryProvider: 'NSE', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    fii_flow: { sourceType: 'unofficial_scrape', primaryProvider: 'NSE', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    dii_flow: { sourceType: 'unofficial_scrape', primaryProvider: 'NSE', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    advance_decline: { sourceType: 'unofficial_scrape', primaryProvider: 'NSE', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },

    // Frankfurter API
    eur_usd: { sourceType: 'unofficial_scrape', primaryProvider: 'Frankfurter', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },
    usd_jpy: { sourceType: 'unofficial_scrape', primaryProvider: 'Frankfurter', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },

    // Alpha Vantage (Rate Limited)
    dxy: { sourceType: 'unofficial_scrape', primaryProvider: 'Alpha Vantage', fallbackChain: ['last_known_good', 'manual_override'], rateLimitBudget: { requestsPerDay: 25, requestsPerMinute: 5 }, staleness: { maxAgeMinutes: 1440 } },
    gold: { sourceType: 'unofficial_scrape', primaryProvider: 'Alpha Vantage', fallbackChain: ['last_known_good', 'manual_override'], rateLimitBudget: { requestsPerDay: 25, requestsPerMinute: 5 }, staleness: { maxAgeMinutes: 1440 } },
    silver: { sourceType: 'unofficial_scrape', primaryProvider: 'Alpha Vantage', fallbackChain: ['last_known_good', 'manual_override'], rateLimitBudget: { requestsPerDay: 25, requestsPerMinute: 5 }, staleness: { maxAgeMinutes: 1440 } },
    copper: { sourceType: 'unofficial_scrape', primaryProvider: 'Alpha Vantage', fallbackChain: ['last_known_good', 'manual_override'], rateLimitBudget: { requestsPerDay: 25, requestsPerMinute: 5 }, staleness: { maxAgeMinutes: 1440 } },
    natural_gas: { sourceType: 'unofficial_scrape', primaryProvider: 'Alpha Vantage', fallbackChain: ['last_known_good', 'manual_override'], rateLimitBudget: { requestsPerDay: 25, requestsPerMinute: 5 }, staleness: { maxAgeMinutes: 1440 } },
    wheat: { sourceType: 'unofficial_scrape', primaryProvider: 'Alpha Vantage', fallbackChain: ['last_known_good', 'manual_override'], rateLimitBudget: { requestsPerDay: 25, requestsPerMinute: 5 }, staleness: { maxAgeMinutes: 1440 } },

    // CoinGecko
    bitcoin: { sourceType: 'unofficial_scrape', primaryProvider: 'CoinGecko', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 15 } },

    // AMFI
    mf_flows: { sourceType: 'unofficial_scrape', primaryProvider: 'AMFI', fallbackChain: ['last_known_good', 'manual_override'], staleness: { maxAgeMinutes: 1440 } },


    // ----------------------------------------------------
    // CALCULATED (Internal Engine)
    // ----------------------------------------------------
    inventory_days: { sourceType: 'calculated', primaryProvider: 'Internal Engine', fallbackChain: ['manual_override'], staleness: { maxAgeMinutes: 1440 } },
    receivable_days: { sourceType: 'calculated', primaryProvider: 'Internal Engine', fallbackChain: ['manual_override'], staleness: { maxAgeMinutes: 1440 } },
    payable_days: { sourceType: 'calculated', primaryProvider: 'Internal Engine', fallbackChain: ['manual_override'], staleness: { maxAgeMinutes: 1440 } },
    iv_rank: { sourceType: 'calculated', primaryProvider: 'Internal Engine', fallbackChain: ['manual_override'], staleness: { maxAgeMinutes: 15 } },
    iv_percentile: { sourceType: 'calculated', primaryProvider: 'Internal Engine', fallbackChain: ['manual_override'], staleness: { maxAgeMinutes: 15 } },
    mcap_to_gdp: { sourceType: 'calculated', primaryProvider: 'Internal Engine', fallbackChain: ['manual_override'], staleness: { maxAgeMinutes: 1440 } },
    earnings_yield_index: { sourceType: 'calculated', primaryProvider: 'Internal Engine', fallbackChain: ['manual_override'], staleness: { maxAgeMinutes: 1440 } },
    fii_trend: { sourceType: 'calculated', primaryProvider: 'Internal Engine', fallbackChain: ['manual_override'], staleness: { maxAgeMinutes: 1440 } },
    sector_concentration: { sourceType: 'calculated', primaryProvider: 'Internal Engine', fallbackChain: ['manual_override'], staleness: { maxAgeMinutes: 1440 } },
    cyclical_vs_defensive: { sourceType: 'calculated', primaryProvider: 'Internal Engine', fallbackChain: ['manual_override'], staleness: { maxAgeMinutes: 1440 } },


    // ----------------------------------------------------
    // PURE MANUAL
    // ----------------------------------------------------
    relative_valuation: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    consensus_rating: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    target_price: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    analyst_count: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    smart_money_flow: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    credit_rating: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    rating_agency: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    rating_outlook: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    move_index: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    forward_eps_index: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    sector_earnings: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    profit_margin_index: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    corp_debt_equity: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    policy_tailwinds: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    sector_valuation: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    sector_growth: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    sovereign_cds: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } },
    reform_momentum: { sourceType: 'manual', primaryProvider: 'User', fallbackChain: [], staleness: { maxAgeMinutes: 1440 } }
};

export function getSourceConfig(cardId) {
    return SOURCE_REGISTRY[cardId] || {
        sourceType: 'manual',
        primaryProvider: 'Unknown',
        fallbackChain: [],
        staleness: { maxAgeMinutes: 1440 }
    };
}
