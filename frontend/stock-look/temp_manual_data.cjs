

exports.manualData = {
    // --- 1. DASHBOARD ---
    praxis_composite_header: {
        title: "Master Dashboard",
        description: "The central nervous system of Stocky. Synthesizes data to produce unified scoring and regime identification.",
        topics: [
            {
                id: "stocky_score",
                title: "Stocky Score (0-100)",
                description: "The Stocky Score is a proprietary composite index that summarizes the overall bullish or bearish conviction of the market as interpreted by our system. It aggregates signals from multiple intelligence engines, weighs them by reliability, and normalizes the output onto a 0 to 100 scale.",
                calculation: "Score = Sum of (Weight x Component Score) x 100\n\nWhere:\n• s_i = normalized score from component i (0 to 1)\n• w_i = weight of component i\n• n = total number of components\n\nThe result is scaled to a 0-100 range for intuitive interpretation.",
                weight: "100% of Top-Level Signal",
                interpretation: "Scores above 60 generally indicate bullish conditions, while scores below 40 suggest bearish conditions. Values between 40 and 60 reflect neutral or consolidating environments.",
                interpretationVisual: [
                    { range: "0 - 20", label: "Extreme Bearish", color: "text-red-500" },
                    { range: "20 - 40", label: "Bearish", color: "text-amber-500" },
                    { range: "40 - 60", label: "Neutral / Chop", color: "text-yellow-500" },
                    { range: "60 - 80", label: "Bullish", color: "text-emerald-500" },
                    { range: "80 - 100", label: "Extreme Bullish", color: "text-emerald-400" }
                ],
                proTip: "Scores > 80 often precede short-term corrections (overbought).\nScores < 20 often precede bounces.",
                dataSources: "Price Action, Trend Strength, Volatility, Flow Metrics, On-chain Data, Macro Signals, and Sentiment Indicators.",
                updateFrequency: "Real-time\n(Updates on every new data tick)",
                confidenceImpact: "Adjusted by Conviction Meter and Risk Radar status."
            },
            {
                id: "market_regime",
                title: "Market Regime Label",
                description: "Classifies the current market state into one of 4 distinct quadrants based on the interplay between directional trend and realized volatility.",
                calculation: "Regime = f(TrendStrength, IV_Rank)\n\nWhere:\n• TrendStrength is derived from ADX and Moving Average slopes.\n• IV_Rank (Implied Volatility Rank) determines the volatility environment.",
                weight: "Qualitative Overlay",
                interpretation: "Trend (Low Vol): Smooth directional moves.\nChop (Low Vol): Sideways, range-bound.\nVolatile Trend (High Vol): Aggressive moves with deep pullbacks.\nCrash/Panic (High Vol): Violent downside.",
                proTip: "Adjust your strategy type (Credit vs Debit) based on this label, not just price direction. Selling premium works best in Chop/Volatile environments.",
                dataSources: "Spot Price, Options Implied Volatility (IV), ADX.",
                updateFrequency: "Real-time",
                confidenceImpact: "High. Dictates strategy selection."
            },
            {
                id: "conviction_meter",
                title: "Conviction Meter",
                description: "Measures the mathematical agreement (correlation) between the different underlying intelligence engines (Technical, Fundamental, Options, etc.).",
                calculation: "Conviction = 1 - (Standard Deviation of Scores / Mean of Scores)\n\nWhere:\n• StdDev_{scores} = standard deviation of individual engine scores.\n• Mean_{scores} = mean of individual engine scores.",
                weight: "R-Metric (Reliability)",
                interpretation: "High Conviction: All engines point in the same direction. Signals are trustworthy.\nLow Conviction: Engines are conflicted. Signals may be false or noisy.",
                interpretationVisual: [
                    { range: "Low", label: "Conflicted", color: "text-red-500" },
                    { range: "Med", label: "Mixed", color: "text-yellow-500" },
                    { range: "High", label: "Aligned", color: "text-emerald-500" }
                ],
                proTip: "High Conviction trades allow for larger position sizing. Low Conviction requires reduced sizing or staying in cash.",
                dataSources: "Internal System Component Scores.",
                updateFrequency: "Real-time",
                confidenceImpact: "Directly scales position sizing limits."
            },
            {
                id: "risk_radar",
                title: "Risk Radar Status",
                description: "Real-time monitoring of systemic macro risk factors and liquidity conditions.",
                calculation: "Risk_{sys} = w_1(VIX_{z}) + w_2(HYG_{spread}) + w_3(DXY_{vol})\n\nWhere:\n• VIX_z = Z-score of VIX\n• HYG_spread = High-Yield credit spreads\n• DXY_vol = Dollar index volatility",
                weight: "Veto Power",
                interpretation: "Normal: Standard risk environment.\nElevated: Heightened caution required.\nCritical: Systemic risk detected. Long exposure should be minimized or hedged.",
                interpretationVisual: [
                    { range: "Normal", label: "Risk-On", color: "text-emerald-500" },
                    { range: "Elevated", label: "Caution", color: "text-amber-500" },
                    { range: "Critical", label: "Risk-Off", color: "text-red-500" }
                ],
                proTip: "Never buy the dip when Risk Radar is 'Critical'. Wait for a downgrade to 'Elevated'.",
                dataSources: "VIX, Credit Default Swaps (CDS), Yield Curve, DXY.",
                updateFrequency: "Tick-by-tick (where available), otherwise daily.",
                confidenceImpact: "Overrides all bullish signals when Critical."
            },
            {
                id: "signal_alignment",
                title: "Signal Alignment Matrix",
                description: "A cross-engine correlation matrix that compares the directional signals of Technical, Fundamental, Options, and Global engines.",
                calculation: "Alignment = Sum of (Engine Direction x Engine Weight)\n\nWhere:\n• Engine is 1 (Bullish), -1 (Bearish), or 0 (Neutral)",
                weight: "Core Visualization",
                interpretation: "The Alignment Matrix visualizes the degree of consensus across all distinct intelligence models. When 3 or more engines align in the same direction, the probability of a sustained, high-momentum trend increases drastically. Conversely, conflicting signals suggest a fragmented market where participants are undecided, usually resulting in choppy price action.",
                interpretationVisual: [
                    { range: "0 - 1", label: "Conflicted", color: "text-red-500" },
                    { range: "2", label: "Moderate Alignment", color: "text-amber-500" },
                    { range: "3", label: "Strong Trend", color: "text-emerald-400" },
                    { range: "4", label: "Perfect Alignment", color: "text-emerald-500" }
                ],
                proTip: "Look for divergence. If Technicals are extremely Bullish but Options are heavily Bearish, smart money is fading the rally.",
                dataSources: "System Component Scores.",
                updateFrequency: "Real-time.",
                confidenceImpact: "High. Dictates macro conviction."
            },
            {
                id: "trade_readiness",
                title: "Trade Readiness Panel",
                description: "A pre-flight checklist that analyzes volatility, upcoming events, liquidity, and portfolio risk before executing a trade.",
                calculation: "Readiness = f(VIX, EarningsDate, Liquidity, Exposure)\n\nWhere:\n• All parameters must pass threshold limits.",
                weight: "Risk Gatekeeper",
                interpretation: "This acts as your final safety check before capital is deployed. It scans for impending binary events (like Earnings or Fed meetings), ensures liquidity is sufficient to avoid slippage, and verifies that the VIX is within acceptable trading bands. If the panel flashes red or warning, execution should be halted or position sizing drastically reduced.",
                interpretationVisual: [
                    { range: "Fail", label: "Halt Execution", color: "text-red-500" },
                    { range: "Warning", label: "Reduce Sizing", color: "text-amber-500" },
                    { range: "Pass", label: "Clear to Trade", color: "text-emerald-500" }
                ],
                proTip: "Never override a failed Trade Readiness check on a Friday afternoon.",
                dataSources: "Macro events, Volatility indices, Account Risk limits.",
                updateFrequency: "Real-time / Pre-trade.",
                confidenceImpact: "Absolute veto power over execution."
            },
            {
                id: "actionable_ideas",
                title: "Algorithmic Actionable Ideas",
                description: "Machine-generated trade setups based on converging signals across multiple intelligence engines.",
                calculation: "Setup Quality = Technical Confluence + Fundamental Catalyst + Favorable Options Skew",
                weight: "Execution Layer",
                interpretation: "These algorithms scan the market for optimal setups, removing human bias. However, these are high-probability setups, not guaranteed winners. A 'High Quality' setup implies that the structural edge is heavily in your favor, but you must always apply your own risk management and confirm the entry with live price action.",
                interpretationVisual: [
                    { range: "Low Quality", label: "Skip/Discard", color: "text-red-500" },
                    { range: "Med Quality", label: "Monitor Setup", color: "text-yellow-500" },
                    { range: "High Quality", label: "Prime Execution", color: "text-emerald-500" }
                ],
                proTip: "Filter these ideas through the Trade Readiness Panel before execution.",
                dataSources: "System-wide Convergence Scanners.",
                updateFrequency: "Intraday / Daily.",
                confidenceImpact: "Dependent on Setup Quality Score."
            },
            {
                id: "pro_desk",
                title: "Pro Desk Picks",
                description: "Hand-curated trade setups from experienced analysts, providing human context to algorithmic data.",
                calculation: "Selection = Algorithmic Screening + Human Qualitative Overlay\n\nWhere:\n• Human analysts evaluate macro context and narrative.",
                weight: "Premium Alpha",
                interpretation: "While algorithms excel at processing raw data, they lack the ability to interpret nuance, rumors, or complex geopolitical shifts. Pro Desk Picks combine the rigid data screening of the algorithmic engines with the 'street feel' of human analysts to find deeply asymmetric risk/reward opportunities.",
                interpretationVisual: [
                    { range: "Contrarian", label: "Fade the Crowd", color: "text-purple-500" },
                    { range: "Trend Play", label: "Follow the Flow", color: "text-blue-500" },
                    { range: "Macro Shift", label: "Structural Change", color: "text-amber-500" }
                ],
                proTip: "Pay attention to the 'Why' in the analyst's notes, not just the entry price.",
                dataSources: "Human Analyst Curators.",
                updateFrequency: "Daily / Weekly.",
                confidenceImpact: "High conviction."
            },
            {
                id: "system_alerts",
                title: "Real-Time System Alerts",
                description: "Push notifications triggered by extreme deviations in volatility, massive options flow, or breaking macro news.",
                calculation: "Trigger = Current Value > (Rolling Mean + 3 x Standard Deviation)",
                weight: "Monitoring",
                interpretation: "The system constantly scans for standard deviation anomalies across all markets. When a metric breaches its 3-sigma band, an alert is fired. 'Critical' alerts demand immediate attention as they often signal black swan events or massive institutional block trades, necessitating immediate portfolio hedging.",
                interpretationVisual: [
                    { range: "Info", label: "Standard Flow", color: "text-blue-500" },
                    { range: "Warning", label: "Elevated Risk", color: "text-amber-500" },
                    { range: "Critical", label: "Immediate Action", color: "text-red-500" }
                ],
                proTip: "A sudden cluster of volatility alerts usually precedes a major directional move.",
                dataSources: "Data feed anomalies, News aggregators.",
                updateFrequency: "Real-time (Push).",
                confidenceImpact: "Dependent on alert severity."
            }
        ]
    },

    // --- 2. FUNDAMENTAL ---
    fundamental: {
        title: "Fundamental Engine",
        description: "Evaluates the intrinsic value, financial health, and institutional flow of the underlying assets.",
        topics: [
{
          "id": "fundamental_engine_score",
          "title": "Fundamental Engine Score",
          "description": "The aggregated composite score of all 36 underlying fundamental, macro, and liquidity metrics, heavily weighted towards institutional flow and liquidity.",
          "calculation": "Score = Sum of (Weight x Normalized Metric)",
          "weight": "Top-Level Aggregate",
          "interpretation": "This score represents the structural 'gravity' of the market. High scores mean any dips will likely be bought aggressively by institutions, as the underlying economy and valuations support higher prices. Low scores suggest that even strong technical rallies are built on a weak foundation and are prone to sudden collapse.",
          "interpretationVisual": [
                    {
                              "range": "< 30",
                              "label": "Structural Weakness",
                              "color": "text-red-500"
                    },
                    {
                              "range": "30 - 45",
                              "label": "Bearish Bias",
                              "color": "text-amber-500"
                    },
                    {
                              "range": "45 - 55",
                              "label": "Neutral Setup",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "55 - 75",
                              "label": "Bullish Foundation",
                              "color": "text-emerald-400"
                    },
                    {
                              "range": "> 75",
                              "label": "Institutional Buying",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Fundamental scores move much slower than Technical scores. Use this to determine your long-term portfolio bias, not intraday entries.",
          "dataSources": "Aggregation of all 36 Fundamental sub-modules.",
          "updateFrequency": "Real-time aggregation (driven by tick data on sub-modules).",
          "confidenceImpact": "Absolute macro direction setter."
            },
{
          "id": "ai_interpretation_desk",
          "title": "Fundamental AI Interpretation",
          "description": "A natural language generation engine that synthesizes the 36 raw data feeds into a human-readable summary of the current economic environment.",
          "calculation": "N/A",
          "isBehavioral": true,
          "weight": "Qualitative Insight",
          "interpretation": "The AI Interpretation Desk serves as your virtual macro-economist. It highlights the driving factors behind the current score—whether it's surging FII flows, a collapsing PE ratio, or shifting Reserve Bank policy.",
          "proTip": "Always read the 'Key Headwind' highlighted by the AI to know what could invalidate your bullish thesis.",
          "dataSources": "LLM synthesis of internal data feeds.",
          "updateFrequency": "Daily or upon major metric deviation.",
          "confidenceImpact": "High for narrative understanding."
            },
{
          "id": "nifty_pe",
          "title": "Nifty P/E Ratio",
          "description": "The Price-to-Earnings ratio of the benchmark index. It measures the aggregate valuation of the top 50 companies.",
          "calculation": "P/E = Index Value / Aggregate Trailing EPS",
          "weight": "High",
          "interpretation": "A low P/E suggests the market is cheap relative to historical earnings, often marking secular bottoms. A high P/E implies high growth expectations, but makes the market highly vulnerable to earnings misses or rising interest rates.",
          "interpretationVisual": [
                    {
                              "range": "< 15",
                              "label": "Deep Value",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "15 - 20",
                              "label": "Fair Value",
                              "color": "text-emerald-400"
                    },
                    {
                              "range": "20 - 25",
                              "label": "Overvalued",
                              "color": "text-amber-500"
                    },
                    {
                              "range": "> 25",
                              "label": "Bubble Territory",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Never short a high P/E market if central banks are cutting rates (high liquidity supports high valuations).",
          "dataSources": "NSE EOD Reports.",
          "updateFrequency": "Daily (Price) / Quarterly (Earnings).",
          "confidenceImpact": "High long-term."
            },
{
          "id": "forward_pe",
          "title": "Forward P/E",
          "description": "Uses projected earnings (rather than past earnings) to determine valuation.",
          "calculation": "Forward P/E = Current Price / Estimated Future EPS",
          "weight": "High",
          "interpretation": "Markets are forward-looking mechanisms. If Forward P/E is significantly lower than Trailing P/E, analysts expect massive earnings growth in the upcoming quarters.",
          "interpretationVisual": [
                    {
                              "range": "< 14",
                              "label": "Cheap",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "14 - 18",
                              "label": "Fair",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 18",
                              "label": "Expensive",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Forward P/E is only as good as the analyst estimates. In a recession, estimates are always cut too late, making the Forward P/E look artificially cheap.",
          "dataSources": "Consensus Analyst Estimates.",
          "updateFrequency": "Weekly / Monthly.",
          "confidenceImpact": "High."
            },
{
          "id": "nifty_pb",
          "title": "Nifty P/B Ratio",
          "description": "Price-to-Book ratio for the benchmark index. Compares market cap to the net asset value of the companies.",
          "calculation": "P/B = Index Market Cap / Aggregate Book Value",
          "weight": "Medium",
          "interpretation": "Historically, the index finds unbreakable structural support when P/B approaches 2.5, and encounters massive resistance above 4.5.",
          "interpretationVisual": [
                    {
                              "range": "< 2.5",
                              "label": "Generational Buy",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "2.5 - 3.5",
                              "label": "Fair",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 4.0",
                              "label": "Expensive",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Highly relevant for heavy-asset sectors like Banking and Manufacturing, less relevant for IT and Services.",
          "dataSources": "NSE EOD Reports.",
          "updateFrequency": "Quarterly.",
          "confidenceImpact": "Moderate."
            },
{
          "id": "earnings_yield",
          "title": "Earnings Yield",
          "description": "The inverse of the P/E ratio, showing the percentage of earnings generated per unit of investment.",
          "calculation": "Yield = (EPS / Price) x 100",
          "weight": "Medium",
          "interpretation": "Must be compared against the 10-Year Bond Yield. If the bond yield is higher than the earnings yield, capital will structurally flow out of equities and into bonds.",
          "interpretationVisual": [
                    {
                              "range": "< 4%",
                              "label": "Unattractive",
                              "color": "text-red-500"
                    },
                    {
                              "range": "4% - 6%",
                              "label": "Fair",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 6%",
                              "label": "Highly Attractive",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "The 'Fed Model' strictly uses this metric to determine equity risk premiums.",
          "dataSources": "Derived from P/E.",
          "updateFrequency": "Daily.",
          "confidenceImpact": "High during rate hike cycles."
            },
{
          "id": "mcap_gdp",
          "title": "Market Cap to GDP (Buffett Indicator)",
          "description": "Compares the total value of all publicly traded stocks to the country's Gross Domestic Product.",
          "calculation": "Ratio = (Total Market Cap / Gross Domestic Product) x 100",
          "weight": "Medium",
          "interpretation": "Warren Buffett's favorite macro valuation metric. A ratio over 100% traditionally indicates the stock market is growing faster than the actual underlying economy (overvalued).",
          "interpretationVisual": [
                    {
                              "range": "< 70%",
                              "label": "Significantly Undervalued",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "70% - 90%",
                              "label": "Fair Value",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "90% - 115%",
                              "label": "Overvalued",
                              "color": "text-amber-500"
                    },
                    {
                              "range": "> 115%",
                              "label": "Bubble",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "In emerging markets with high informal economies (like India), structural financialization pushes this metric higher over time.",
          "dataSources": "Exchange Data, Government GDP Prints.",
          "updateFrequency": "Quarterly.",
          "confidenceImpact": "Low for intraday, High for decade-long investing."
            },
{
          "id": "eps_yoy",
          "title": "EPS Growth (YoY)",
          "description": "The year-over-year percentage growth in aggregate earnings per share for the index.",
          "calculation": "Growth = ((Current EPS - Last Year EPS) / Last Year EPS) x 100",
          "weight": "High",
          "interpretation": "Consistent double-digit EPS growth is the primary driver of sustained bull markets. Stagnant or negative EPS YoY inevitably leads to multiple compression (falling P/E).",
          "interpretationVisual": [
                    {
                              "range": "< 0%",
                              "label": "Earnings Recession",
                              "color": "text-red-500"
                    },
                    {
                              "range": "0% - 10%",
                              "label": "Slow Growth",
                              "color": "text-amber-500"
                    },
                    {
                              "range": "10% - 20%",
                              "label": "Strong Growth",
                              "color": "text-emerald-400"
                    },
                    {
                              "range": "> 20%",
                              "label": "Boom",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Market tops occur when EPS YoY peaks. The market discounts the future 6-9 months in advance.",
          "dataSources": "Corporate Filings Aggregation.",
          "updateFrequency": "Quarterly.",
          "confidenceImpact": "High."
            },
{
          "id": "forward_eps",
          "title": "Forward EPS Estimates",
          "description": "The street's consensus estimate for the index's earnings over the next 12 months.",
          "calculation": "Weighted average of institutional analyst projections.",
          "weight": "High",
          "interpretation": "Rising forward estimates support higher stock prices today. Falling estimates force institutions to liquidate.",
          "proTip": "Pay attention to the 'rate of change' of these estimates, rather than just the absolute number.",
          "dataSources": "Bloomberg / Institutional Consensus.",
          "updateFrequency": "Weekly.",
          "confidenceImpact": "High."
            },
{
          "id": "earnings_revision",
          "title": "Earnings Revision Breadth",
          "description": "The ratio of upward earnings revisions to downward earnings revisions by analysts.",
          "calculation": "Breadth = (Upward Revisions - Downward Revisions) / Total Revisions",
          "weight": "Medium",
          "interpretation": "A leading indicator for Forward EPS. If analysts are scrambling to upgrade their targets across the board, the market is in a powerful structural uptrend.",
          "interpretationVisual": [
                    {
                              "range": "< -0.5",
                              "label": "Mass Downgrades",
                              "color": "text-red-500"
                    },
                    {
                              "range": "-0.5 - 0",
                              "label": "Weakening",
                              "color": "text-amber-500"
                    },
                    {
                              "range": "0 - 0.5",
                              "label": "Improving",
                              "color": "text-emerald-400"
                    },
                    {
                              "range": "> 0.5",
                              "label": "Mass Upgrades",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "This metric often bottoms out before the actual stock market bottoms.",
          "dataSources": "Analyst Note Aggregation.",
          "updateFrequency": "Weekly.",
          "confidenceImpact": "Moderate."
            },
{
          "id": "sector_earnings",
          "title": "Sector Earnings Breadth",
          "description": "Measures how many different sectors are contributing to the aggregate EPS growth.",
          "calculation": "Percentage of 11 GICS sectors showing positive YoY earnings growth.",
          "weight": "Low",
          "interpretation": "Broad-based earnings growth across many sectors is healthy. If only 1 or 2 sectors (e.g., Tech and Energy) are carrying the entire index's earnings, the market is highly fragile.",
          "proTip": "Narrow earnings breadth often precedes major market corrections.",
          "dataSources": "Sector-level EPS data.",
          "updateFrequency": "Quarterly.",
          "confidenceImpact": "Moderate."
            },
{
          "id": "profit_margin",
          "title": "Net Profit Margin",
          "description": "The aggregate net profit margin of the benchmark constituents.",
          "calculation": "Margin = (Net Income / Total Revenue) x 100",
          "weight": "Medium",
          "interpretation": "Expanding margins mean companies have pricing power (can raise prices without losing demand). Contracting margins mean inflation or competition is eating into profits.",
          "interpretationVisual": [
                    {
                              "range": "< 10%",
                              "label": "Margin Squeeze",
                              "color": "text-red-500"
                    },
                    {
                              "range": "10% - 15%",
                              "label": "Average",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 15%",
                              "label": "High Profitability",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "During periods of high inflation (CPI), watch this metric closely to see if companies can pass costs onto consumers.",
          "dataSources": "Corporate Filings.",
          "updateFrequency": "Quarterly.",
          "confidenceImpact": "High during inflationary periods."
            },
{
          "id": "gdp",
          "title": "GDP Growth Rate",
          "description": "The annualized growth rate of the country's Gross Domestic Product.",
          "calculation": "Percentage change in the value of all goods and services produced.",
          "weight": "Macro Overlay",
          "interpretation": "Strong GDP growth attracts Foreign Institutional Investors (FIIs). Two consecutive quarters of negative growth define a technical recession.",
          "interpretationVisual": [
                    {
                              "range": "< 4%",
                              "label": "Sluggish",
                              "color": "text-red-500"
                    },
                    {
                              "range": "4% - 6%",
                              "label": "Steady",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 6%",
                              "label": "High Growth",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Stock markets are forward-looking. The market usually bottoms exactly when the GDP numbers look their absolute worst.",
          "dataSources": "Government Statistical Office.",
          "updateFrequency": "Quarterly.",
          "confidenceImpact": "High."
            },
{
          "id": "cpi",
          "title": "CPI Inflation",
          "description": "Consumer Price Index. Measures the rate at which the general level of prices for goods and services is rising.",
          "calculation": "Year-over-year percentage change in a standardized basket of goods.",
          "weight": "Macro Overlay",
          "interpretation": "Runaway inflation (>6%) forces the central bank to hike interest rates, draining liquidity from the stock market. Deflation (<0%) signals a severe economic depression.",
          "interpretationVisual": [
                    {
                              "range": "< 2%",
                              "label": "Deflation Risk",
                              "color": "text-amber-500"
                    },
                    {
                              "range": "2% - 5%",
                              "label": "Goldilocks Zone",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "5% - 7%",
                              "label": "Elevated",
                              "color": "text-amber-500"
                    },
                    {
                              "range": "> 7%",
                              "label": "Destructive",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "In an inflationary environment, shift capital from Growth stocks (Tech) to Value stocks (Energy, Commodities).",
          "dataSources": "Government Statistical Office.",
          "updateFrequency": "Monthly.",
          "confidenceImpact": "Extreme during rate hike cycles."
            },
{
          "id": "repo",
          "title": "Central Bank Policy Rate (Repo)",
          "description": "The rate at which the central bank lends money to commercial banks. The absolute foundation of asset pricing.",
          "calculation": "Base Interest Rate set by the Monetary Policy Committee.",
          "weight": "Macro Overlay",
          "interpretation": "Higher rates make borrowing expensive, slowing corporate growth and increasing the attractiveness of risk-free bonds over stocks. Lower rates act as rocket fuel for equities.",
          "proTip": "Don't fight the Fed (or the RBI). If they are aggressively hiking, reduce equity exposure.",
          "dataSources": "Central Bank Announcements.",
          "updateFrequency": "Bi-monthly (or emergency).",
          "confidenceImpact": "Absolute."
            },
{
          "id": "policy_stance",
          "title": "Monetary Policy Stance",
          "description": "The qualitative forward guidance provided by the central bank.",
          "calculation": "Categorical: Dovish (Easing), Neutral, Hawkish (Tightening)",
          "isBehavioral": true,
          "weight": "Macro Overlay",
          "interpretation": "Markets trade on expectations. A shift in 'stance' from Hawkish to Neutral often triggers a massive stock market rally before the actual rate cuts even begin.",
          "interpretationVisual": [
                    {
                              "range": "Hawkish",
                              "label": "Liquidity Drain",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Data Dependent",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Dovish",
                              "label": "Liquidity Injection",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Read the central bank meeting minutes carefully. A single word change can move markets by 2%.",
          "dataSources": "Central Bank Press Conferences.",
          "updateFrequency": "Bi-monthly.",
          "confidenceImpact": "High."
            },
{
          "id": "fiscal_deficit",
          "title": "Fiscal Deficit to GDP",
          "description": "The shortfall in a government's income compared with its spending.",
          "calculation": "Deficit = ((Total Expenditure - Total Revenue) / GDP) x 100",
          "weight": "Low",
          "interpretation": "A ballooning deficit can lead to sovereign rating downgrades and runaway inflation. However, controlled deficit spending (on infrastructure) drives corporate profits.",
          "proTip": "Monitor this closely during election years when governments tend to overspend.",
          "dataSources": "Ministry of Finance.",
          "updateFrequency": "Annual/Quarterly.",
          "confidenceImpact": "Low."
            },
{
          "id": "current_account",
          "title": "Current Account Deficit (CAD)",
          "description": "A measurement of a country's trade where the value of the goods and services it imports exceeds the value of the products it exports.",
          "calculation": "CAD = Total Exports - Total Imports",
          "weight": "Low",
          "interpretation": "A widening CAD puts immense depreciation pressure on the domestic currency, which in turn causes Foreign Investors (FIIs) to sell domestic equities.",
          "proTip": "For oil-importing nations, watch Crude Oil prices. If Crude spikes, CAD spikes, and the domestic currency falls.",
          "dataSources": "Trade Data.",
          "updateFrequency": "Quarterly.",
          "confidenceImpact": "Moderate."
            },
{
          "id": "fii",
          "title": "FII Net Flows",
          "description": "Net daily investment by Foreign Institutional Investors in the cash market.",
          "calculation": "FII Net = FII Gross Buys - FII Gross Sells",
          "weight": "Extremely High",
          "interpretation": "FIIs are the 'whales' of emerging markets. Sustained net buying invariably drives the index to new highs. Sustained selling creates heavy overhead supply.",
          "interpretationVisual": [
                    {
                              "range": "< -1000cr",
                              "label": "Heavy Selling",
                              "color": "text-red-500"
                    },
                    {
                              "range": "-1000 to 0",
                              "label": "Mild Selling",
                              "color": "text-amber-500"
                    },
                    {
                              "range": "0 to 1000cr",
                              "label": "Mild Buying",
                              "color": "text-emerald-400"
                    },
                    {
                              "range": "> 1000cr",
                              "label": "Aggressive Buying",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Look for correlation. If FIIs are buying cash equity AND buying Index Futures, it is an incredibly strong bullish signal.",
          "dataSources": "Exchange EOD Data.",
          "updateFrequency": "Daily.",
          "confidenceImpact": "Absolute."
            },
{
          "id": "dii",
          "title": "DII Net Flows",
          "description": "Net daily investment by Domestic Institutional Investors (Mutual Funds, Insurance Companies).",
          "calculation": "DII Net = DII Gross Buys - DII Gross Sells",
          "weight": "High",
          "interpretation": "DIIs often act as the counter-party to FIIs. When FIIs dump, DIIs (fueled by massive retail SIP inflows) absorb the shock, preventing market crashes.",
          "proTip": "A day where BOTH FIIs and DIIs buy heavily almost guarantees a gap-up the following morning.",
          "dataSources": "Exchange EOD Data.",
          "updateFrequency": "Daily.",
          "confidenceImpact": "High."
            },
{
          "id": "fii_trend",
          "title": "FII Flow Momentum",
          "description": "The 20-day moving average of FII net flows, smoothing out daily noise.",
          "calculation": "Trend = 20-Day Simple Moving Average of FII Net Flows",
          "weight": "Medium",
          "interpretation": "A single day of FII buying is noise. A flip in the 20-day trend from negative to positive signals a structural allocation shift by global funds.",
          "proTip": "Use this to determine the primary trend, and use technicals to time the entry.",
          "dataSources": "Derived from FII flows.",
          "updateFrequency": "Daily.",
          "confidenceImpact": "High."
            },
{
          "id": "system_liquidity",
          "title": "Banking System Liquidity",
          "description": "The surplus or deficit of funds in the commercial banking system.",
          "calculation": "Net liquidity absorbed or injected by the central bank via LAF (Liquidity Adjustment Facility).",
          "weight": "Medium",
          "interpretation": "Excess liquidity chases yield, ultimately finding its way into the stock market. Deficit liquidity forces banks to raise rates, suffocating equity valuations.",
          "interpretationVisual": [
                    {
                              "range": "Deficit",
                              "label": "Tight Liquidity",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Balanced",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Surplus",
                              "label": "High Liquidity",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Liquidity drives markets more than earnings do. In a surplus environment, bad news is ignored.",
          "dataSources": "Central Bank Daily Operations.",
          "updateFrequency": "Daily.",
          "confidenceImpact": "High."
            },
{
          "id": "mf_flows",
          "title": "Retail SIP / Mutual Fund Flows",
          "description": "Monthly inflows from retail investors via Systematic Investment Plans.",
          "calculation": "Total monthly gross inflows into equity mutual funds.",
          "weight": "Medium",
          "interpretation": "Consistent, massive SIP inflows provide a permanent 'bid' under the market, structurally dampening volatility and preventing deep crashes.",
          "proTip": "If SIP flows ever start declining month-over-month, the market loses its primary shock absorber.",
          "dataSources": "AMFI Data.",
          "updateFrequency": "Monthly.",
          "confidenceImpact": "High for structural support."
            },
{
          "id": "sector_valuation",
          "title": "Sector Valuation Disparity",
          "description": "Measures the standard deviation of P/E ratios across the 11 major sectors.",
          "calculation": "Standard Deviation of Sector P/Es",
          "weight": "Low",
          "interpretation": "High disparity means a few sectors (e.g., Tech/AI) are in a massive bubble while others are dirt cheap. Low disparity implies broad market participation.",
          "proTip": "When disparity is at historical highs, prepare for a 'Rotation' where money flows out of the expensive winners and into the cheap losers.",
          "dataSources": "Sector Index Data.",
          "updateFrequency": "Weekly.",
          "confidenceImpact": "Low."
            },
{
          "id": "sector_growth",
          "title": "Leading Sector Growth",
          "description": "Identifies which specific sector is contributing the most to index earnings growth.",
          "calculation": "Max(Sector EPS YoY Contribution)",
          "weight": "Low",
          "interpretation": "The market leader. If the leading sector breaks down technically, the entire index will likely follow.",
          "proTip": "Never short the leading sector until its earnings growth explicitly decelerates.",
          "dataSources": "Quarterly Earnings.",
          "updateFrequency": "Quarterly.",
          "confidenceImpact": "Moderate."
            },
{
          "id": "sector_concentration",
          "title": "Market Concentration",
          "description": "The percentage of total index market cap held by the top 5 largest stocks.",
          "calculation": "(Sum of Top 5 Market Caps / Total Index Market Cap) x 100",
          "weight": "Low",
          "interpretation": "High concentration (>40%) makes the index highly vulnerable to the performance of just a handful of mega-cap companies.",
          "proTip": "In highly concentrated markets, the broader index might look bullish while the 'average' stock is actually in a bear market. Check the Equal-Weight Index.",
          "dataSources": "Index Constituents.",
          "updateFrequency": "Daily.",
          "confidenceImpact": "Low."
            },
{
          "id": "cyc_def",
          "title": "Cyclical vs Defensive Performance",
          "description": "The ratio of the performance of cyclical sectors (Auto, Metals, Realty) against defensive sectors (FMCG, Pharma).",
          "calculation": "Ratio = Cyclical Index Price / Defensive Index Price",
          "weight": "Medium",
          "interpretation": "A rising ratio indicates intense 'Risk-On' sentiment and economic optimism. A falling ratio means smart money is hiding in safe havens, anticipating a slowdown.",
          "interpretationVisual": [
                    {
                              "range": "< 0.8",
                              "label": "Defensive Flight",
                              "color": "text-red-500"
                    },
                    {
                              "range": "0.8 - 1.2",
                              "label": "Neutral",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 1.2",
                              "label": "Aggressive Risk-On",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "This is a brilliant leading indicator for the broader market regime.",
          "dataSources": "Sector Indices.",
          "updateFrequency": "Daily.",
          "confidenceImpact": "High."
            },
{
          "id": "corp_debt",
          "title": "Corporate Deleveraging",
          "description": "The aggregate debt levels of the top 500 listed companies.",
          "calculation": "Aggregate Debt-to-Equity YoY change.",
          "weight": "Low",
          "interpretation": "A deleveraging cycle (companies paying off debt) leads to cleaner balance sheets and higher structural valuations over the long term.",
          "proTip": "Highly leveraged companies get annihilated during interest rate hike cycles. Avoid them.",
          "dataSources": "Corporate Balance Sheets.",
          "updateFrequency": "Quarterly.",
          "confidenceImpact": "Low."
            },
{
          "id": "credit_growth",
          "title": "Bank Credit Growth",
          "description": "The rate at which commercial banks are lending money to businesses and consumers.",
          "calculation": "YoY percentage change in outstanding bank credit.",
          "weight": "Medium",
          "interpretation": "Double-digit credit growth indicates a booming, expansionary economy. Stagnant credit growth implies a recession or systemic banking fear.",
          "interpretationVisual": [
                    {
                              "range": "< 5%",
                              "label": "Contraction",
                              "color": "text-red-500"
                    },
                    {
                              "range": "5% - 10%",
                              "label": "Stable",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 10%",
                              "label": "Expansion",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Credit growth is the lifeblood of the Banking sector, which holds the highest weightage in most global indices.",
          "dataSources": "Central Bank Data.",
          "updateFrequency": "Fortnightly.",
          "confidenceImpact": "High for Financials."
            },
{
          "id": "tax_env",
          "title": "Corporate Tax Environment",
          "description": "The prevailing statutory corporate tax rate and surcharge environment.",
          "calculation": "Effective Tax Rate.",
          "isBehavioral": true,
          "weight": "Low",
          "interpretation": "Tax cuts instantly boost EPS without any change in underlying sales, leading to immediate massive rallies. Tax hikes crush EPS.",
          "proTip": "Monitor government budgets. Tax policy changes cause structural, multi-year repricing of assets.",
          "dataSources": "Government Budget.",
          "updateFrequency": "Annual.",
          "confidenceImpact": "Extreme upon announcement."
            },
{
          "id": "policy_tailwinds",
          "title": "Government Policy Tailwinds",
          "description": "Subsidies, infrastructure spending, or protectionist tariffs benefiting specific sectors (e.g., PLI schemes).",
          "calculation": "Capital Allocation in Government Budgets.",
          "isBehavioral": true,
          "weight": "Medium",
          "interpretation": "Sectors blessed with government subsidies will structurally outperform for years, completely detached from traditional valuation metrics.",
          "proTip": "Follow the government's money. It provides a massive margin of safety for investments in those sectors.",
          "dataSources": "Government Policy Announcements.",
          "updateFrequency": "Ad-hoc.",
          "confidenceImpact": "High for specific sectors."
            },
{
          "id": "global_growth",
          "title": "Global Growth Synchronization",
          "description": "Measures whether the major global economies (US, EU, China) are expanding simultaneously.",
          "calculation": "Global PMI Composite Index.",
          "weight": "Medium",
          "interpretation": "Synchronized global growth creates massive tailwinds for emerging markets and export-heavy sectors (IT, Pharma).",
          "interpretationVisual": [
                    {
                              "range": "< 48",
                              "label": "Global Contraction",
                              "color": "text-red-500"
                    },
                    {
                              "range": "48 - 52",
                              "label": "Mixed/Stagnant",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 52",
                              "label": "Synchronized Expansion",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "A US recession will pull down domestic IT stocks, regardless of how strong the domestic economy is.",
          "dataSources": "Global Purchasing Managers' Index (PMI).",
          "updateFrequency": "Monthly.",
          "confidenceImpact": "Moderate."
            },
{
          "id": "crude",
          "title": "Crude Oil (Brent)",
          "description": "The global benchmark price for oil. Acts as a proxy for both global demand and domestic inflation (for importing nations).",
          "calculation": "Spot Price per Barrel.",
          "weight": "High",
          "interpretation": "For importing nations, oil > $90/bbl destroys the trade deficit, imports inflation, and crushes corporate margins. Oil < $70/bbl is massively bullish.",
          "interpretationVisual": [
                    {
                              "range": "< $70",
                              "label": "Massive Tailwind",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "$70 - $85",
                              "label": "Neutral",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> $85",
                              "label": "Inflationary Headwind",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "A 10% spike in oil prices directly correlates to a sharp drop in FMCG, Paint, and Aviation stocks.",
          "dataSources": "ICE.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High."
            },
{
          "id": "usdinr",
          "title": "USD/INR Exchange Rate",
          "description": "The strength of the US Dollar against the domestic currency.",
          "calculation": "Spot Exchange Rate.",
          "weight": "Medium",
          "interpretation": "A rapidly depreciating domestic currency triggers FII selling (as their dollar-adjusted returns turn negative) and increases imported inflation.",
          "interpretationVisual": [
                    {
                              "range": "Appreciating",
                              "label": "Bullish for FIIs",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Stable",
                              "label": "Neutral",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Depreciating Fast",
                              "label": "Capital Flight Risk",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "A strong dollar acts as a wrecking ball for emerging market equities.",
          "dataSources": "Forex Market.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High."
            },
{
          "id": "global_liq",
          "title": "Global Liquidity Index",
          "description": "The combined balance sheet size of the G4 Central Banks (Fed, ECB, BOJ, PBOC).",
          "calculation": "Sum of G4 Central Bank Assets",
          "weight": "High",
          "interpretation": "Global liquidity drives all risk assets. If global central banks are printing money, stocks and crypto will go up regardless of valuations.",
          "proTip": "When liquidity is expanding, buy high-beta growth stocks. When contracting, hide in defensive cash-flow generators.",
          "dataSources": "Central Bank Balance Sheets.",
          "updateFrequency": "Weekly.",
          "confidenceImpact": "Absolute."
            },
{
          "id": "sovereign_risk",
          "title": "Sovereign Risk Premium",
          "description": "The extra yield investors demand to hold domestic government bonds over US Treasuries.",
          "calculation": "Spread = Domestic 10Y Yield - US 10Y Yield",
          "weight": "Low",
          "interpretation": "A spiking spread indicates global investors fear domestic political instability or fiscal ruin.",
          "proTip": "Rarely moves dramatically, but when it does, it signals a major systemic crisis.",
          "dataSources": "Bond Markets.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Low."
            },
{
          "id": "npa",
          "title": "Banking System NPAs",
          "description": "Non-Performing Assets. The percentage of loans issued by banks that are in default or arrears.",
          "calculation": "Gross NPA = (Defaulted Loans / Total Gross Advances) x 100",
          "weight": "Medium",
          "interpretation": "High NPAs paralyze the banking system, halting credit growth and crashing the broader economy. Low/falling NPAs signal a healthy, aggressive banking sector.",
          "interpretationVisual": [
                    {
                              "range": "< 3%",
                              "label": "Clean Balance Sheets",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "3% - 6%",
                              "label": "Manageable",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 6%",
                              "label": "Systemic Risk",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Bank stocks lead the market. If NPAs are falling structurally, buy the banking index.",
          "dataSources": "Central Bank Reports.",
          "updateFrequency": "Quarterly.",
          "confidenceImpact": "High."
            },
{
          "id": "reform_momentum",
          "title": "Reform Momentum",
          "description": "Qualitative assessment of the government's ability and willingness to pass structural economic reforms.",
          "calculation": "N/A",
          "isBehavioral": true,
          "weight": "Low",
          "interpretation": "Privatization, labor laws, and tax simplification drive long-term FII allocations. Political gridlock stalls growth.",
          "proTip": "Markets price in reforms long before they impact GDP.",
          "dataSources": "Parliamentary Sessions, News.",
          "updateFrequency": "Ad-hoc.",
          "confidenceImpact": "Moderate."
            }
        ]
    },

    // --- 3. TECHNICAL ---
    technical: {
        title: "Technical Engine",
        description: "Analyzes price action, momentum, trend strength, and chart patterns to identify optimal entry/exit points.",
        topics: [

{
          "id": "rsi",
          "title": "RSI (Relative Strength Index)",
          "description": "A momentum oscillator that measures the speed and change of price movements. Identifies overbought or oversold conditions.",
          "calculation": "RSI = 100 - (100 / (1 + RS))\\nWhere: RS = Average Gain / Average Loss over a specified period (typically 14).",
          "weight": "15% of Technical Engine",
          "interpretation": "RSI > 70: Overbought (due for a pullback).\\nRSI < 30: Oversold (due for a bounce).",
          "interpretationVisual": [
                    {
                              "range": "0 - 30",
                              "label": "Oversold",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "30 - 50",
                              "label": "Bearish Zone",
                              "color": "text-amber-500"
                    },
                    {
                              "range": "50 - 70",
                              "label": "Bullish Zone",
                              "color": "text-emerald-400"
                    },
                    {
                              "range": "70 - 100",
                              "label": "Overbought",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "In strong uptrends, RSI can stay overbought (>70) for long periods. Look for bearish divergence instead of blindly shorting.",
          "dataSources": "Time-series price data (Close).",
          "updateFrequency": "Real-time (per candle).",
          "confidenceImpact": "High for mean-reversion entries."
            },
{
          "id": "macd",
          "title": "MACD (Moving Average Convergence Divergence)",
          "description": "A trend-following momentum indicator that shows the relationship between two moving averages of a security's price.",
          "calculation": "MACD Line = 12-period EMA - 26-period EMA\\nSignal Line = 9-period EMA of MACD Line\\nHistogram = MACD Line - Signal Line",
          "weight": "15% of Technical Engine",
          "interpretation": "Bullish: MACD crosses above Signal Line.\\nBearish: MACD crosses below Signal Line.",
          "interpretationVisual": [
                    {
                              "range": "Below 0 & Crossing Up",
                              "label": "Bullish Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Above 0 & Expanding",
                              "label": "Strong Uptrend",
                              "color": "text-emerald-400"
                    },
                    {
                              "range": "Above 0 & Crossing Down",
                              "label": "Bearish Reversal",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Below 0 & Expanding",
                              "label": "Strong Downtrend",
                              "color": "text-red-400"
                    }
          ],
          "proTip": "The most powerful MACD signals occur when a crossover happens far below or far above the zero line.",
          "dataSources": "Exponential Moving Averages.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High for trend confirmation."
            },
{
          "id": "stoch_rsi",
          "title": "Stochastic RSI",
          "description": "An oscillator that measures the level of the RSI relative to its high-low range over a set period.",
          "calculation": "StochRSI = (RSI - Min RSI) / (Max RSI - Min RSI)",
          "weight": "5% of Technical Engine",
          "interpretation": "Hyper-sensitive. >80 is overbought, <20 is oversold.",
          "interpretationVisual": [
                    {
                              "range": "0 - 20",
                              "label": "Oversold",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "20 - 80",
                              "label": "Neutral Channel",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "80 - 100",
                              "label": "Overbought",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Used best for precise entries when the main trend is already established.",
          "dataSources": "RSI Values.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Low (Very noisy)."
            },
{
          "id": "cci",
          "title": "CCI (Commodity Channel Index)",
          "description": "Measures a security's variation from its statistical mean.",
          "calculation": "CCI = (Typical Price - SMA of Typical Price) / (0.015 x Mean Deviation)\\nWhere: Typical Price = (High + Low + Close) / 3",
          "weight": "5% of Technical Engine",
          "interpretation": "CCI > +100 implies overbought. CCI < -100 implies oversold.",
          "interpretationVisual": [
                    {
                              "range": "< -100",
                              "label": "Oversold",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "-100 to 100",
                              "label": "Neutral",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 100",
                              "label": "Overbought",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Often leads price reversals earlier than RSI.",
          "dataSources": "Typical Price.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Low to Moderate."
            },
{
          "id": "williams_r",
          "title": "Williams %R",
          "description": "A momentum indicator that moves between 0 and -100, measuring overbought and oversold levels.",
          "calculation": "%R = (Highest High - Close) / (Highest High - Lowest Low) x -100",
          "weight": "5% of Technical Engine",
          "interpretation": "Values above -20 indicate overbought conditions. Values below -80 indicate oversold conditions.",
          "interpretationVisual": [
                    {
                              "range": "-100 to -80",
                              "label": "Oversold",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "-80 to -20",
                              "label": "Trending",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "-20 to 0",
                              "label": "Overbought",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Williams %R acts incredibly fast. Use it to catch the exact bottom of a pullback in an established uptrend.",
          "dataSources": "High, Low, Close.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate."
            },
{
          "id": "awesome_oscillator",
          "title": "Awesome Oscillator (AO)",
          "description": "Calculates market momentum by comparing recent momentum to historical momentum.",
          "calculation": "AO = SMA(Median Price, 5) - SMA(Median Price, 34)",
          "weight": "5% of Technical Engine",
          "interpretation": "Zero line crossovers indicate a shift in momentum. 'Saucer' patterns above/below the zero line signal trend continuation.",
          "interpretationVisual": [
                    {
                              "range": "Green Histogram",
                              "label": "Momentum Increasing",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Red Histogram",
                              "label": "Momentum Decreasing",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Look for 'Twin Peaks' divergence below the zero line for a highly reliable buy signal.",
          "dataSources": "Median Price.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate."
            },
{
          "id": "mfi",
          "title": "Money Flow Index (MFI)",
          "description": "A volume-weighted version of RSI. Identifies buying and selling pressure by analyzing both price and volume.",
          "calculation": "MFI = 100 - (100 / (1 + Money Flow Ratio))",
          "weight": "5% of Technical Engine",
          "interpretation": "Since it incorporates volume, MFI > 80 is a much stronger overbought signal than regular RSI > 70.",
          "interpretationVisual": [
                    {
                              "range": "< 20",
                              "label": "Oversold (Accumulation)",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "20 - 80",
                              "label": "Neutral Flow",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 80",
                              "label": "Overbought (Distribution)",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "If price makes a higher high but MFI makes a lower high, massive institutional distribution is occurring.",
          "dataSources": "Price and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High for divergence setups."
            },
{
          "id": "roc",
          "title": "Rate of Change (ROC)",
          "description": "Measures the percentage change in price between the current price and the price a certain number of periods ago.",
          "calculation": "ROC = ((Current Close - Close n periods ago) / Close n periods ago) x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "A sharp spike in ROC indicates a sudden surge in buying pressure (a momentum ignition event).",
          "interpretationVisual": [
                    {
                              "range": "Rising > 0",
                              "label": "Accelerating Upside",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Falling < 0",
                              "label": "Accelerating Downside",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "ROC hovering near zero means the market is entirely directionless and consolidating.",
          "dataSources": "Historical Close Prices.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Low."
            },
{
          "id": "adx",
          "title": "ADX (Average Directional Index)",
          "description": "Measures the absolute strength of a trend, regardless of its direction.",
          "calculation": "ADX = 100 x MA of Absolute(+DI - -DI) / (+DI + -DI)",
          "weight": "10% of Technical Engine",
          "interpretation": "ADX < 20: Weak or no trend (Chop).\\nADX > 25: Strong trend.\\nADX > 40: Extreme trend.",
          "interpretationVisual": [
                    {
                              "range": "0 - 20",
                              "label": "Chop/Sideways",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "20 - 25",
                              "label": "Building",
                              "color": "text-emerald-400"
                    },
                    {
                              "range": "25 - 40",
                              "label": "Strong Trend",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "> 40",
                              "label": "Extreme/Exhaustion",
                              "color": "text-purple-500"
                    }
          ],
          "proTip": "When ADX is below 20, use mean-reversion strategies. When ADX is above 25, use trend-following strategies.",
          "dataSources": "High, Low, Close price data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Dictates the 'Regime' of the market."
            },
{
          "id": "supertrend",
          "title": "Supertrend",
          "description": "A trend-following indicator overlay based on Average True Range (ATR).",
          "calculation": "Upper = (High + Low) / 2 + (Multiplier x ATR)\\nLower = (High + Low) / 2 - (Multiplier x ATR)",
          "weight": "5% of Technical Engine",
          "interpretation": "Price closing above Supertrend flips it to Bullish (Green). Price closing below flips it to Bearish (Red).",
          "interpretationVisual": [
                    {
                              "range": "Price < Supertrend",
                              "label": "Bearish Control",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Price > Supertrend",
                              "label": "Bullish Control",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Terrible in choppy markets (generates false signals). Excellent in strong trending markets.",
          "dataSources": "ATR, Median Price.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate (lagging indicator)."
            },
{
          "id": "ema_crossover",
          "title": "EMA Crossover",
          "description": "Generates signals when a short-term Exponential Moving Average crosses a long-term one.",
          "calculation": "Signal = EMA(Fast) - EMA(Slow)",
          "weight": "5% of Technical Engine",
          "interpretation": "Golden Cross (e.g., 50 crosses above 200) = Long-term Bullish.\\nDeath Cross (e.g., 50 crosses below 200) = Long-term Bearish.",
          "interpretationVisual": [
                    {
                              "range": "Fast > Slow",
                              "label": "Bullish Trend",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Fast < Slow",
                              "label": "Bearish Trend",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Crossovers are lagging. The market has often already moved significantly by the time the cross occurs.",
          "dataSources": "Moving Averages.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate."
            },
{
          "id": "parabolic_sar",
          "title": "Parabolic SAR (Stop and Reverse)",
          "description": "Places trailing stop dots above or below price candles. Designed to lock in profits during a trend.",
          "calculation": "SAR = Prior SAR + Prior AF x (Prior EP - Prior SAR)",
          "weight": "5% of Technical Engine",
          "interpretation": "Dots below price = Uptrend. Dots above price = Downtrend. When price tags the dot, the trend reverses.",
          "interpretationVisual": [
                    {
                              "range": "Dots Below",
                              "label": "Long / Hold",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Dots Above",
                              "label": "Short / Sell",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Never use SAR in a sideways market; you will get chopped out repeatedly.",
          "dataSources": "Price, Acceleration Factor (AF).",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Low."
            },
{
          "id": "ichimoku",
          "title": "Ichimoku Cloud",
          "description": "A comprehensive, all-in-one indicator that provides support/resistance, momentum, and trend direction.",
          "calculation": "Senkou Span A = (Tenkan-sen + Kijun-sen) / 2\\nSenkou Span B = (52-period High + Low) / 2",
          "weight": "5% of Technical Engine",
          "interpretation": "Price above the cloud is bullish. Price inside the cloud is neutral (do not trade). Price below the cloud is bearish.",
          "interpretationVisual": [
                    {
                              "range": "Below Cloud",
                              "label": "Bearish",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Inside Cloud",
                              "label": "No Trade Zone",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Above Cloud",
                              "label": "Bullish",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "A 'Kumo Twist' (when the future cloud flips from red to green) is often a leading indicator for a macro trend change.",
          "dataSources": "Multiple Midpoints of Highs/Lows.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High for macro trend."
            },
{
          "id": "hma",
          "title": "Hull Moving Average (HMA)",
          "description": "A fast, smooth moving average that almost completely eliminates lag while remaining incredibly smooth.",
          "calculation": "HMA = WMA(2 x WMA(n/2) - WMA(n)), sqrt(n)",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to identify the absolute current short-term trend. It changes color incredibly fast when momentum shifts.",
          "interpretationVisual": [
                    {
                              "range": "Sloping Down",
                              "label": "Bearish",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Sloping Up",
                              "label": "Bullish",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Perfect for swing trading entries when used in conjunction with a longer-term EMA.",
          "dataSources": "Weighted Moving Averages.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate."
            },
{
          "id": "vwap",
          "title": "VWAP (Volume Weighted Average Price)",
          "description": "The average price a security has traded at throughout the day, based on both volume and price. The most important indicator for day traders.",
          "calculation": "VWAP = Sum of (Typical Price x Volume) / Sum of Volume",
          "weight": "10% of Technical Engine",
          "interpretation": "Institutions use VWAP to ensure they get good execution. If price is below VWAP, it is 'cheap' intraday. If above, it is 'expensive'.",
          "interpretationVisual": [
                    {
                              "range": "Below VWAP",
                              "label": "Intraday Bearish",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Near VWAP",
                              "label": "Fair Value",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Above VWAP",
                              "label": "Intraday Bullish",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "In a strong trend, the VWAP line acts as an unbreakable dynamic support/resistance level. Buy the first pullback to VWAP.",
          "dataSources": "Intraday Price and Volume.",
          "updateFrequency": "Real-time (Resets Daily).",
          "confidenceImpact": "Absolute for Day Trading."
            },
{
          "id": "bollinger_bands",
          "title": "Bollinger Bands",
          "description": "Volatility bands placed above and below a moving average based on standard deviations.",
          "calculation": "Upper Band = 20-SMA + (2 x 20-StdDev)\\nLower Band = 20-SMA - (2 x 20-StdDev)",
          "weight": "5% of Technical Engine",
          "interpretation": "Price tagging the Upper Band implies overbought. A 'squeeze' (bands narrowing) precedes massive moves.",
          "interpretationVisual": [
                    {
                              "range": "Below Lower Band",
                              "label": "Oversold Deviation",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Inside Bands",
                              "label": "Normal Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Above Upper Band",
                              "label": "Overbought Deviation",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "In a strong trend, price will constantly hug the upper or lower band without reversing. Don't fade it.",
          "dataSources": "SMA, Standard Deviation.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate."
            },
{
          "id": "keltner_channels",
          "title": "Keltner Channels",
          "description": "Volatility-based bands that use Average True Range (ATR) rather than standard deviation.",
          "calculation": "Upper Band = 20-EMA + (2 x ATR)\\nLower Band = 20-EMA - (2 x ATR)",
          "weight": "5% of Technical Engine",
          "interpretation": "Smoother than Bollinger Bands. A close outside the Keltner Channel often indicates the start of a new momentum trend, not a reversal.",
          "interpretationVisual": [
                    {
                              "range": "Breakout Down",
                              "label": "Bearish Momentum",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Inside Channel",
                              "label": "Ranging",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout Up",
                              "label": "Bullish Momentum",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Combine Bollinger Bands and Keltner Channels. When Bollinger goes completely inside Keltner, a massive 'Squeeze' breakout is imminent.",
          "dataSources": "EMA, ATR.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate."
            },
{
          "id": "donchian",
          "title": "Donchian Channels",
          "description": "Bands formed by taking the highest high and the lowest low over a set period (e.g., 20 days).",
          "calculation": "Upper = Highest High of last N periods\\nLower = Lowest Low of last N periods",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to trade pure breakouts. When price hits the upper channel, you buy. When it hits the lower channel, you short.",
          "interpretationVisual": [
                    {
                              "range": "Hitting Lower",
                              "label": "New Lows",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Middle",
                              "label": "Consolidation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Hitting Upper",
                              "label": "New Highs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "This is the exact indicator used by the legendary 'Turtle Traders' to make millions in the 1980s.",
          "dataSources": "Highs and Lows.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Low."
            },
{
          "id": "atr",
          "title": "ATR (Average True Range)",
          "description": "Measures market volatility by decomposing the entire range of an asset price for that period.",
          "calculation": "ATR = Moving Average of True Ranges",
          "weight": "Risk Management",
          "interpretation": "High ATR means the market is wildly volatile. Low ATR means the market is dead and consolidating.",
          "interpretationVisual": [
                    {
                              "range": "Expanding",
                              "label": "Volatility Increasing",
                              "color": "text-red-400"
                    },
                    {
                              "range": "Contracting",
                              "label": "Volatility Decreasing",
                              "color": "text-emerald-400"
                    }
          ],
          "proTip": "Always place your stop-loss at least 1.5x ATR away from your entry to avoid getting hunted by market maker wicks.",
          "dataSources": "Price Range, Gaps.",
          "updateFrequency": "Daily / Real-time.",
          "confidenceImpact": "High for Stop Loss placement."
            },
{
          "id": "chaikin_vol",
          "title": "Chaikin Volatility",
          "description": "Measures volatility by comparing the spread between a security's high and low prices.",
          "calculation": "Chaikin Vol = EMA of (High - Low)",
          "weight": "Low",
          "interpretation": "A rapid increase in volatility over a short period indicates that a bottom is near (panic selling). A decrease indicates a top.",
          "interpretationVisual": [
                    {
                              "range": "Spiking",
                              "label": "Panic / Exhaustion",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Dropping",
                              "label": "Complacency",
                              "color": "text-yellow-500"
                    }
          ],
          "proTip": "Use this to confirm if a breakout is real. A breakout with no increase in volatility is a fake-out.",
          "dataSources": "High/Low Spreads.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Low."
            },
{
          "id": "obv",
          "title": "OBV (On-Balance Volume)",
          "description": "A momentum indicator that uses volume flow to predict changes in stock price.",
          "calculation": "If Close > Prior Close: OBV = Prior OBV + Volume",
          "weight": "5% of Technical Engine",
          "interpretation": "Rising OBV confirms an uptrend. Falling OBV confirms a downtrend.",
          "interpretationVisual": [
                    {
                              "range": "Falling",
                              "label": "Distribution",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Flat",
                              "label": "Neutral",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Rising",
                              "label": "Accumulation",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "If price makes a higher high but OBV makes a lower high, smart money is heavily distributing into the retail buying.",
          "dataSources": "Volume, Close Price.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High for divergence setups."
            },
{
          "id": "cmf",
          "title": "Chaikin Money Flow (CMF)",
          "description": "Measures the amount of Money Flow Volume over a specific period, blending price action and volume.",
          "calculation": "CMF = Sum of Money Flow Volume / Sum of Volume",
          "weight": "5% of Technical Engine",
          "interpretation": "CMF > 0 indicates buying pressure (accumulation). CMF < 0 indicates selling pressure (distribution).",
          "interpretationVisual": [
                    {
                              "range": "< 0",
                              "label": "Net Selling",
                              "color": "text-red-500"
                    },
                    {
                              "range": "> 0",
                              "label": "Net Buying",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "A CMF crossing above zero while price breaks out of a base is one of the strongest bullish signals available.",
          "dataSources": "Close, High, Low, Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate."
            },
{
          "id": "volume_profile",
          "title": "Volume Profile (POC, VAL, VAH)",
          "description": "Displays trading activity over a specified time period at specified price levels (rather than time).",
          "calculation": "Plots total volume traded at each price tick.",
          "weight": "10% of Technical Engine",
          "interpretation": "The POC (Point of Control) is the price with the highest volume. Price is magnetically drawn to the POC. The Value Area (VA) contains 70% of the volume.",
          "interpretationVisual": [
                    {
                              "range": "Outside VA",
                              "label": "Imbalance",
                              "color": "text-purple-500"
                    },
                    {
                              "range": "Inside VA",
                              "label": "Fair Value",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "At POC",
                              "label": "Maximum Acceptance",
                              "color": "text-blue-500"
                    }
          ],
          "proTip": "If price opens outside the Value Area and breaks back in, it will almost always traverse the entire Value Area to the other side (The 80% Rule).",
          "dataSources": "Tick Volume Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Extremely High for Support/Resistance."
            },
{
          "id": "accumulation_distribution",
          "title": "Accumulation/Distribution Line (A/D)",
          "description": "Assesses cumulative flow of money into and out of a security by looking at the close relative to the high-low range.",
          "calculation": "A/D = Prior A/D + Current Money Flow Volume",
          "weight": "5% of Technical Engine",
          "interpretation": "If the A/D line is rising, it means the stock is closing near its highs on heavy volume (accumulation).",
          "interpretationVisual": [
                    {
                              "range": "Downtrend",
                              "label": "Selling Pressure",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Uptrend",
                              "label": "Buying Pressure",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "A steeply falling A/D line during a price consolidation warns of an imminent breakdown.",
          "dataSources": "High, Low, Close, Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate."
            },
{
          "id": "vwmacd",
          "title": "VWMACD (Volume Weighted MACD)",
          "description": "A variation of the MACD that uses Volume Weighted Moving Averages instead of EMAs.",
          "calculation": "VWMACD = VWMA(Fast) - VWMA(Slow)",
          "weight": "5% of Technical Engine",
          "interpretation": "Far more reliable than standard MACD because it filters out price movements that occur on low, retail volume.",
          "interpretationVisual": [
                    {
                              "range": "Below 0",
                              "label": "Bearish Flow",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Above 0",
                              "label": "Bullish Flow",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Use this instead of standard MACD for illiquid stocks or cryptocurrencies.",
          "dataSources": "Price, Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate."
            },
{
          "id": "pivot_points",
          "title": "Pivot Points",
          "description": "Predictive support and resistance levels calculated based on the previous period's high, low, and close.",
          "calculation": "Pivot (P) = (High + Low + Close) / 3\\nR1 = (2 x P) - Low\\nS1 = (2 x P) - High",
          "weight": "Overlay Only",
          "interpretation": "Price trading above the pivot is bullish. Price trading below is bearish. R1/R2 and S1/S2 act as heavy institutional reaction zones.",
          "interpretationVisual": [
                    {
                              "range": "Below S1",
                              "label": "Deep Oversold",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Near Pivot",
                              "label": "Equilibrium",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Above R1",
                              "label": "Overextended",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Institutional algorithms heavily respect standard floor pivots. Set your take-profits just below an R1 or R2.",
          "dataSources": "Previous Day High, Low, Close.",
          "updateFrequency": "Daily.",
          "confidenceImpact": "Used for precise target setting."
            },
{
          "id": "fibonacci",
          "title": "Fibonacci Retracement Levels",
          "description": "Horizontal lines that indicate where support and resistance are likely to occur, based on Fibonacci numbers.",
          "calculation": "Levels drawn between a major Swing Low and Swing High at 23.6%, 38.2%, 50%, 61.8%, and 78.6%.",
          "weight": "Overlay Only",
          "interpretation": "In a strong trend, price will typically pull back to the 38.2% or 50% level before continuing. The 61.8% level is the 'Golden Ratio' and the last line of defense for the trend.",
          "interpretationVisual": [
                    {
                              "range": "< 38.2%",
                              "label": "Shallow Pullback",
                              "color": "text-emerald-400"
                    },
                    {
                              "range": "50% - 61.8%",
                              "label": "Golden Zone Buy",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "> 78.6%",
                              "label": "Trend Invalidated",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Never trade Fibonacci levels in isolation. Combine the 61.8% level with a Volume Profile POC or a Pivot Point for massive confluence.",
          "dataSources": "Swing Highs/Lows.",
          "updateFrequency": "Static per Swing.",
          "confidenceImpact": "High for entry execution."
            },
{
          "id": "dynamic_sr",
          "title": "Dynamic Support & Resistance Zones",
          "description": "Identifies historically dense areas of liquidity where price reversed multiple times.",
          "calculation": "Density mapping of historical wicks and clustered closes.",
          "weight": "10% of Technical Engine",
          "interpretation": "Support is where demand overcomes supply. Resistance is where supply overcomes demand. Zones are broken when price closes through them on high volume.",
          "interpretationVisual": [
                    {
                              "range": "Approaching Support",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Approaching Resistance",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Support and Resistance are ZONES, not exact lines. Draw them as boxes to capture the wicks.",
          "dataSources": "Historical Price Action.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High."
            },
{
          "id": "fractals",
          "title": "Fractal Breakouts",
          "description": "A pattern formulated by Bill Williams that highlights local tops and bottoms where price reversed.",
          "calculation": "Bearish Fractal: A high surrounded by two lower highs on each side.\\nBullish Fractal: A low surrounded by two higher lows on each side.",
          "weight": "5% of Technical Engine",
          "interpretation": "Fractals define the market structure. An uptrend is simply a series of broken Bearish Fractals (making Higher Highs).",
          "interpretationVisual": [
                    {
                              "range": "Breaking Bear Fractal",
                              "label": "Structure Bullish",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Breaking Bull Fractal",
                              "label": "Structure Bearish",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Place your stop-loss just below the most recent valid Bullish Fractal. If it breaks, the market structure has shifted.",
          "dataSources": "5-Candle sequences.",
          "updateFrequency": "Real-time (lags by 2 candles).",
          "confidenceImpact": "Moderate."
            },
{
          "id": "fvg",
          "title": "Supply & Demand Imbalances (FVG)",
          "description": "Fair Value Gaps (FVGs) represent extreme market inefficiencies where price moved so rapidly that liquidity was not provided on both sides.",
          "calculation": "Created when a 3-candle sequence leaves a gap between the wick of the 1st candle and the wick of the 3rd candle.",
          "weight": "10% of Technical Engine",
          "interpretation": "The market is a highly efficient machine. It will almost always return to 'fill' these gaps to re-balance the liquidity before continuing its macro trend.",
          "interpretationVisual": [
                    {
                              "range": "Below Current Price",
                              "label": "Bullish FVG (Support)",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Above Current Price",
                              "label": "Bearish FVG (Resistance)",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "FVGs act as magnets for price. If an FVG is left completely unfilled, it often results in a breakaway gap that forms the foundation of a multi-year bull run.",
          "dataSources": "Candlestick wick overlaps.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Extremely High for Institutional trading."
            },
{
          "id": "sma_simple_moving_average",
          "title": "SMA (Simple Moving Average)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "ema_exponential_moving_average",
          "title": "EMA (Exponential Moving Average)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "wma_weighted_moving_average",
          "title": "WMA (Weighted Moving Average)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "alma_arnaud_legoux_ma",
          "title": "ALMA (Arnaud Legoux MA)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "kama_kaufman_adaptive_ma",
          "title": "KAMA (Kaufman Adaptive MA)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "dema_double_ema",
          "title": "DEMA (Double EMA)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "tema_triple_ema",
          "title": "TEMA (Triple EMA)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "zlema_zero_lag_ema",
          "title": "ZLEMA (Zero Lag EMA)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "smma_smoothed_ma",
          "title": "SMMA (Smoothed MA)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "vwma_volume_weighted_ma",
          "title": "VWMA (Volume Weighted MA)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "vama_volume_adjusted_ma",
          "title": "VAMA (Volume Adjusted MA)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "hma_hull_moving_average_fast",
          "title": "HMA (Hull Moving Average - Fast)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "frama_fractal_adaptive_ma",
          "title": "FRAMA (Fractal Adaptive MA)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "vidya_volatility_index_dynamic_average",
          "title": "VIDYA (Volatility Index Dynamic Average)",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "envelopes",
          "title": "Envelopes",
          "description": "Volatility-based bands placed above and below price to capture standard deviations and identify extreme deviations.",
          "calculation": "Upper = Moving Average + (Multiplier x Volatility)\\nLower = Moving Average - (Multiplier x Volatility)",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Below Lower",
                              "label": "Buy Zone",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Inside Bands",
                              "label": "Fair Value",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Above Upper",
                              "label": "Sell Zone",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "price_channels",
          "title": "Price Channels",
          "description": "Volatility-based bands placed above and below price to capture standard deviations and identify extreme deviations.",
          "calculation": "Upper = Moving Average + (Multiplier x Volatility)\\nLower = Moving Average - (Multiplier x Volatility)",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Below Lower",
                              "label": "Buy Zone",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Inside Bands",
                              "label": "Fair Value",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Above Upper",
                              "label": "Sell Zone",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "standard_error_bands",
          "title": "Standard Error Bands",
          "description": "Volatility-based bands placed above and below price to capture standard deviations and identify extreme deviations.",
          "calculation": "Upper = Moving Average + (Multiplier x Volatility)\\nLower = Moving Average - (Multiplier x Volatility)",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Below Lower",
                              "label": "Buy Zone",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Inside Bands",
                              "label": "Fair Value",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Above Upper",
                              "label": "Sell Zone",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "keltner_channels_atr",
          "title": "Keltner Channels (ATR)",
          "description": "Volatility-based bands placed above and below price to capture standard deviations and identify extreme deviations.",
          "calculation": "Upper = Moving Average + (Multiplier x Volatility)\\nLower = Moving Average - (Multiplier x Volatility)",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Below Lower",
                              "label": "Buy Zone",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Inside Bands",
                              "label": "Fair Value",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Above Upper",
                              "label": "Sell Zone",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "donchian_channels",
          "title": "Donchian Channels",
          "description": "Volatility-based bands placed above and below price to capture standard deviations and identify extreme deviations.",
          "calculation": "Upper = Moving Average + (Multiplier x Volatility)\\nLower = Moving Average - (Multiplier x Volatility)",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Below Lower",
                              "label": "Buy Zone",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Inside Bands",
                              "label": "Fair Value",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Above Upper",
                              "label": "Sell Zone",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "starc_bands",
          "title": "STARC Bands",
          "description": "Volatility-based bands placed above and below price to capture standard deviations and identify extreme deviations.",
          "calculation": "Upper = Moving Average + (Multiplier x Volatility)\\nLower = Moving Average - (Multiplier x Volatility)",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Below Lower",
                              "label": "Buy Zone",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Inside Bands",
                              "label": "Fair Value",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Above Upper",
                              "label": "Sell Zone",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "tsi_true_strength_index",
          "title": "TSI (True Strength Index)",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "ultimate_oscillator",
          "title": "Ultimate Oscillator",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "trix",
          "title": "TRIX",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "chande_momentum_oscillator_cmo",
          "title": "Chande Momentum Oscillator (CMO)",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "coppock_curve",
          "title": "Coppock Curve",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "kst_know_sure_thing",
          "title": "KST (Know Sure Thing)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "detrended_price_oscillator_dpo",
          "title": "Detrended Price Oscillator (DPO)",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "schaff_trend_cycle",
          "title": "Schaff Trend Cycle",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "aroon_indicator",
          "title": "Aroon Indicator",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "elder_ray_index",
          "title": "Elder Ray Index",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "force_index",
          "title": "Force Index",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "ehler_s_fisher_transform",
          "title": "Ehler's Fisher Transform",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "smi_stochastic_momentum_index",
          "title": "SMI (Stochastic Momentum Index)",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "vortex_indicator",
          "title": "Vortex Indicator",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "chaikin_oscillator",
          "title": "Chaikin Oscillator",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "volume_oscillator",
          "title": "Volume Oscillator",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "ppo_percentage_price_oscillator",
          "title": "PPO (Percentage Price Oscillator)",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "mass_index",
          "title": "Mass Index",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "choppiness_index",
          "title": "Choppiness Index",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "directional_movement_index_dmi",
          "title": "Directional Movement Index (DMI)",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "mcclellan_oscillator",
          "title": "McClellan Oscillator",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "trin_arms_index",
          "title": "TRIN (Arms Index)",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "advance_decline_line_a_d",
          "title": "Advance/Decline Line (A/D)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "tick_index",
          "title": "TICK Index",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "high_low_index",
          "title": "High-Low Index",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "z_score_standard_score",
          "title": "Z-Score (Standard Score)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "historical_volatility_hv",
          "title": "Historical Volatility (HV)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "relative_volatility_index_rvi",
          "title": "Relative Volatility Index (RVI)",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "ulcer_index",
          "title": "Ulcer Index",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "beta",
          "title": "Beta",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "head_and_shoulders",
          "title": "Head and Shoulders",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "inverse_head_and_shoulders",
          "title": "Inverse Head and Shoulders",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "double_top",
          "title": "Double Top",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "double_bottom",
          "title": "Double Bottom",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "triple_top",
          "title": "Triple Top",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "triple_bottom",
          "title": "Triple Bottom",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "rising_wedge",
          "title": "Rising Wedge",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "falling_wedge",
          "title": "Falling Wedge",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "bull_flag",
          "title": "Bull Flag",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "bear_flag",
          "title": "Bear Flag",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "bull_pennant",
          "title": "Bull Pennant",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "bear_pennant",
          "title": "Bear Pennant",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "ascending_triangle",
          "title": "Ascending Triangle",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "descending_triangle",
          "title": "Descending Triangle",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "symmetrical_triangle",
          "title": "Symmetrical Triangle",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "rectangle_consolidation",
          "title": "Rectangle Consolidation",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "cup_and_handle",
          "title": "Cup and Handle",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "rounding_bottom",
          "title": "Rounding Bottom",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "bump_and_run_reversal",
          "title": "Bump and Run Reversal",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "measured_move",
          "title": "Measured Move",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "gartley_pattern",
          "title": "Gartley Pattern",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "bat_pattern",
          "title": "Bat Pattern",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "butterfly_pattern",
          "title": "Butterfly Pattern",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "crab_pattern",
          "title": "Crab Pattern",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "deep_crab_pattern",
          "title": "Deep Crab Pattern",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "cypher_pattern",
          "title": "Cypher Pattern",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "shark_pattern",
          "title": "Shark Pattern",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "5_0_pattern",
          "title": "5-0 Pattern",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "ab_cd_pattern",
          "title": "AB=CD Pattern",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "three_drives_pattern",
          "title": "Three Drives Pattern",
          "description": "A classic chart pattern formed by price action that indicates a high probability of trend continuation or reversal.",
          "calculation": "Visual geometric pattern formed by drawing trendlines across higher highs and lower lows.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never anticipate a pattern. Wait for a confirmed candle close outside the pattern boundary on high relative volume.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "doji_standard",
          "title": "Doji (Standard)",
          "description": "A specific candlestick formation used by traders to pinpoint exact turning points in price action at key levels.",
          "calculation": "Derived from the Open, High, Low, and Close (OHLC) relationships of 1 to 3 consecutive candles.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Candlestick patterns are meaningless in the middle of nowhere. They only matter when they form exactly on a major Support/Resistance level.",
          "dataSources": "OHLC Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "gravestone_doji",
          "title": "Gravestone Doji",
          "description": "A specific candlestick formation used by traders to pinpoint exact turning points in price action at key levels.",
          "calculation": "Derived from the Open, High, Low, and Close (OHLC) relationships of 1 to 3 consecutive candles.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Candlestick patterns are meaningless in the middle of nowhere. They only matter when they form exactly on a major Support/Resistance level.",
          "dataSources": "OHLC Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "dragonfly_doji",
          "title": "Dragonfly Doji",
          "description": "A specific candlestick formation used by traders to pinpoint exact turning points in price action at key levels.",
          "calculation": "Derived from the Open, High, Low, and Close (OHLC) relationships of 1 to 3 consecutive candles.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Candlestick patterns are meaningless in the middle of nowhere. They only matter when they form exactly on a major Support/Resistance level.",
          "dataSources": "OHLC Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "long_legged_doji",
          "title": "Long-Legged Doji",
          "description": "A specific candlestick formation used by traders to pinpoint exact turning points in price action at key levels.",
          "calculation": "Derived from the Open, High, Low, and Close (OHLC) relationships of 1 to 3 consecutive candles.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Candlestick patterns are meaningless in the middle of nowhere. They only matter when they form exactly on a major Support/Resistance level.",
          "dataSources": "OHLC Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "hammer",
          "title": "Hammer",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "inverted_hammer",
          "title": "Inverted Hammer",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "hanging_man",
          "title": "Hanging Man",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "shooting_star",
          "title": "Shooting Star",
          "description": "A specific candlestick formation used by traders to pinpoint exact turning points in price action at key levels.",
          "calculation": "Derived from the Open, High, Low, and Close (OHLC) relationships of 1 to 3 consecutive candles.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Candlestick patterns are meaningless in the middle of nowhere. They only matter when they form exactly on a major Support/Resistance level.",
          "dataSources": "OHLC Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "spinning_top",
          "title": "Spinning Top",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "marubozu_bullish",
          "title": "Marubozu (Bullish)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "marubozu_bearish",
          "title": "Marubozu (Bearish)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "paper_umbrella",
          "title": "Paper Umbrella",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "high_wave_candle",
          "title": "High Wave Candle",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "shaved_head",
          "title": "Shaved Head",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "shaved_bottom",
          "title": "Shaved Bottom",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "bullish_engulfing",
          "title": "Bullish Engulfing",
          "description": "A specific candlestick formation used by traders to pinpoint exact turning points in price action at key levels.",
          "calculation": "Derived from the Open, High, Low, and Close (OHLC) relationships of 1 to 3 consecutive candles.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Candlestick patterns are meaningless in the middle of nowhere. They only matter when they form exactly on a major Support/Resistance level.",
          "dataSources": "OHLC Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "bearish_engulfing",
          "title": "Bearish Engulfing",
          "description": "A specific candlestick formation used by traders to pinpoint exact turning points in price action at key levels.",
          "calculation": "Derived from the Open, High, Low, and Close (OHLC) relationships of 1 to 3 consecutive candles.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Candlestick patterns are meaningless in the middle of nowhere. They only matter when they form exactly on a major Support/Resistance level.",
          "dataSources": "OHLC Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "tweezer_tops",
          "title": "Tweezer Tops",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "tweezer_bottoms",
          "title": "Tweezer Bottoms",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "piercing_line",
          "title": "Piercing Line",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "dark_cloud_cover",
          "title": "Dark Cloud Cover",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "bullish_harami",
          "title": "Bullish Harami",
          "description": "A specific candlestick formation used by traders to pinpoint exact turning points in price action at key levels.",
          "calculation": "Derived from the Open, High, Low, and Close (OHLC) relationships of 1 to 3 consecutive candles.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Candlestick patterns are meaningless in the middle of nowhere. They only matter when they form exactly on a major Support/Resistance level.",
          "dataSources": "OHLC Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "bearish_harami",
          "title": "Bearish Harami",
          "description": "A specific candlestick formation used by traders to pinpoint exact turning points in price action at key levels.",
          "calculation": "Derived from the Open, High, Low, and Close (OHLC) relationships of 1 to 3 consecutive candles.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Candlestick patterns are meaningless in the middle of nowhere. They only matter when they form exactly on a major Support/Resistance level.",
          "dataSources": "OHLC Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "harami_cross",
          "title": "Harami Cross",
          "description": "A specific candlestick formation used by traders to pinpoint exact turning points in price action at key levels.",
          "calculation": "Derived from the Open, High, Low, and Close (OHLC) relationships of 1 to 3 consecutive candles.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Candlestick patterns are meaningless in the middle of nowhere. They only matter when they form exactly on a major Support/Resistance level.",
          "dataSources": "OHLC Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "morning_star",
          "title": "Morning Star",
          "description": "A specific candlestick formation used by traders to pinpoint exact turning points in price action at key levels.",
          "calculation": "Derived from the Open, High, Low, and Close (OHLC) relationships of 1 to 3 consecutive candles.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Candlestick patterns are meaningless in the middle of nowhere. They only matter when they form exactly on a major Support/Resistance level.",
          "dataSources": "OHLC Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "evening_star",
          "title": "Evening Star",
          "description": "A specific candlestick formation used by traders to pinpoint exact turning points in price action at key levels.",
          "calculation": "Derived from the Open, High, Low, and Close (OHLC) relationships of 1 to 3 consecutive candles.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Candlestick patterns are meaningless in the middle of nowhere. They only matter when they form exactly on a major Support/Resistance level.",
          "dataSources": "OHLC Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "three_white_soldiers",
          "title": "Three White Soldiers",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "three_black_crows",
          "title": "Three Black Crows",
          "description": "A specific candlestick formation used by traders to pinpoint exact turning points in price action at key levels.",
          "calculation": "Derived from the Open, High, Low, and Close (OHLC) relationships of 1 to 3 consecutive candles.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Candlestick patterns are meaningless in the middle of nowhere. They only matter when they form exactly on a major Support/Resistance level.",
          "dataSources": "OHLC Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "three_inside_up",
          "title": "Three Inside Up",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "three_inside_down",
          "title": "Three Inside Down",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "three_outside_up",
          "title": "Three Outside Up",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "three_outside_down",
          "title": "Three Outside Down",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "morning_doji_star",
          "title": "Morning Doji Star",
          "description": "A specific candlestick formation used by traders to pinpoint exact turning points in price action at key levels.",
          "calculation": "Derived from the Open, High, Low, and Close (OHLC) relationships of 1 to 3 consecutive candles.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Candlestick patterns are meaningless in the middle of nowhere. They only matter when they form exactly on a major Support/Resistance level.",
          "dataSources": "OHLC Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "evening_doji_star",
          "title": "Evening Doji Star",
          "description": "A specific candlestick formation used by traders to pinpoint exact turning points in price action at key levels.",
          "calculation": "Derived from the Open, High, Low, and Close (OHLC) relationships of 1 to 3 consecutive candles.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Candlestick patterns are meaningless in the middle of nowhere. They only matter when they form exactly on a major Support/Resistance level.",
          "dataSources": "OHLC Data.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "abandoned_baby_bullish",
          "title": "Abandoned Baby (Bullish)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "abandoned_baby_bearish",
          "title": "Abandoned Baby (Bearish)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "concealing_baby_swallow",
          "title": "Concealing Baby Swallow",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "stick_sandwich",
          "title": "Stick Sandwich",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "kicker_signal_bullish",
          "title": "Kicker Signal (Bullish)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "kicker_signal_bearish",
          "title": "Kicker Signal (Bearish)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "elliott_wave_impulse_1_5",
          "title": "Elliott Wave (Impulse 1-5)",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "elliott_wave_abc_correction",
          "title": "Elliott Wave (ABC Correction)",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "elliott_wave_zigzag",
          "title": "Elliott Wave (ZigZag)",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "elliott_wave_flat",
          "title": "Elliott Wave (Flat)",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "elliott_wave_triangle",
          "title": "Elliott Wave (Triangle)",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Pattern Fails",
                              "label": "Stop Loss Triggered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Forming",
                              "label": "Monitor Action",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout",
                              "label": "High Prob Entry",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "wyckoff_accumulation",
          "title": "Wyckoff (Accumulation)",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "wyckoff_distribution",
          "title": "Wyckoff (Distribution)",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "wyckoff_the_spring",
          "title": "Wyckoff (The Spring)",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "wyckoff_upthrust",
          "title": "Wyckoff (Upthrust)",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "wyckoff_sign_of_strength",
          "title": "Wyckoff (Sign of Strength)",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "wyckoff_selling_climax",
          "title": "Wyckoff (Selling Climax)",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "order_block_bullish",
          "title": "Order Block (Bullish)",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "order_block_bearish",
          "title": "Order Block (Bearish)",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "mitigation_block",
          "title": "Mitigation Block",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "breaker_block",
          "title": "Breaker Block",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "liquidity_void_imbalance",
          "title": "Liquidity Void / Imbalance",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "stop_hunt_turtle_soup",
          "title": "Stop Hunt (Turtle Soup)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "fair_value_gap_fvg",
          "title": "Fair Value Gap (FVG)",
          "description": "An advanced smart-money concept used to track institutional order flow, liquidity hunts, and macro market cycles.",
          "calculation": "Identified by analyzing aggressive market buying/selling that leaves algorithmic liquidity footprints.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions engineer these moves to trap retail traders. Trade in the direction of the smart money after the liquidity sweep.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "point_of_control_poc",
          "title": "Point of Control (POC)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "value_area_high_low_vah_val",
          "title": "Value Area High/Low (VAH/VAL)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "zigzag_overlay",
          "title": "ZigZag Overlay",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "zigzag_oscillator",
          "title": "ZigZag Oscillator",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "moving_average_ribbon",
          "title": "Moving Average Ribbon",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "guppy_multiple_moving_average_gmma",
          "title": "Guppy Multiple Moving Average (GMMA)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "rainbow_oscillator",
          "title": "Rainbow Oscillator",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "gann_fan",
          "title": "Gann Fan",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "gann_square",
          "title": "Gann Square",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "andrews_pitchfork",
          "title": "Andrews Pitchfork",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "schiff_pitchfork",
          "title": "Schiff Pitchfork",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "inside_pitchfork",
          "title": "Inside Pitchfork",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "fibonacci_retracement",
          "title": "Fibonacci Retracement",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "fibonacci_extension",
          "title": "Fibonacci Extension",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "fibonacci_time_zones",
          "title": "Fibonacci Time Zones",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "fibonacci_arcs",
          "title": "Fibonacci Arcs",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "fibonacci_fan",
          "title": "Fibonacci Fan",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "pivot_points_standard",
          "title": "Pivot Points (Standard)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "pivot_points_woodie",
          "title": "Pivot Points (Woodie)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "pivot_points_camarilla",
          "title": "Pivot Points (Camarilla)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "pivot_points_fibonacci",
          "title": "Pivot Points (Fibonacci)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "volume_profile_fixed_range",
          "title": "Volume Profile (Fixed Range)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "volume_profile_visible_range",
          "title": "Volume Profile (Visible Range)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "volume_profile_session",
          "title": "Volume Profile (Session)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "time_price_opportunity_tpo",
          "title": "Time Price Opportunity (TPO)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "market_profile",
          "title": "Market Profile",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "volume_weighted_average_price_vwap",
          "title": "Volume Weighted Average Price (VWAP)",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "anchored_vwap",
          "title": "Anchored VWAP",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "10% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "vwap_bands",
          "title": "VWAP Bands",
          "description": "Volatility-based bands placed above and below price to capture standard deviations and identify extreme deviations.",
          "calculation": "Upper = Moving Average + (Multiplier x Volatility)\\nLower = Moving Average - (Multiplier x Volatility)",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Below Lower",
                              "label": "Buy Zone",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Inside Bands",
                              "label": "Fair Value",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Above Upper",
                              "label": "Sell Zone",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "standard_deviation_channels",
          "title": "Standard Deviation Channels",
          "description": "Volatility-based bands placed above and below price to capture standard deviations and identify extreme deviations.",
          "calculation": "Upper = Moving Average + (Multiplier x Volatility)\\nLower = Moving Average - (Multiplier x Volatility)",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Below Lower",
                              "label": "Buy Zone",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Inside Bands",
                              "label": "Fair Value",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Above Upper",
                              "label": "Sell Zone",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            },
{
          "id": "linear_regression_curve",
          "title": "Linear Regression Curve",
          "description": "A momentum oscillator that fluctuates between set bounds to identify overbought/oversold conditions and divergences.",
          "calculation": "Formula: (Current Value - Moving Average) / Smoothing Factor x 100",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Lower Bound",
                              "label": "Oversold Reversal",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Midline",
                              "label": "Trend Shift",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Upper Bound",
                              "label": "Overbought Reversal",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Divergence is the most powerful signal. If price makes a new high but this oscillator makes a lower high, a massive drop is imminent.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "High"
            },
{
          "id": "polynomial_regression",
          "title": "Polynomial Regression",
          "description": "A specialized technical indicator used to identify market conditions and potential trading opportunities.",
          "calculation": "Calculated using a proprietary weighting of price, volume, and time.",
          "weight": "5% of Technical Engine",
          "interpretation": "Used to determine directional bias and precise risk-to-reward entry levels.",
          "interpretationVisual": [
                    {
                              "range": "Bearish Setup",
                              "label": "Look for Shorts",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Neutral",
                              "label": "Wait for Confirmation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Bullish Setup",
                              "label": "Look for Longs",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always look for confluence with volume and a higher timeframe trend before taking a trade based on this signal.",
          "dataSources": "Price Action and Volume.",
          "updateFrequency": "Real-time.",
          "confidenceImpact": "Moderate"
            }
        ]
    },

    // --- 4. OPTIONS ---
    options: {
        title: "Options Engine",
        description: "Analyzes derivatives data to gauge institutional positioning, market maker exposure, and implied volatility.",
        topics: [
            {
                id: "pcr",
                title: "Put-Call Ratio (PCR)",
                description: "Measures the trading volume or open interest of put options relative to call options.",
                calculation: "PCR = Sum of Put Volume / Sum of Call Volume",
                weight: "20% of Options Engine",
                interpretation: "PCR > 1: Bearish sentiment (puts outnumber calls).\nPCR < 0.7: Bullish sentiment.",
                interpretationVisual: [
                    { range: "< 0.6", label: "Extreme Greed", color: "text-red-500" },
                    { range: "0.6 - 0.8", label: "Bullish", color: "text-emerald-500" },
                    { range: "0.8 - 1.0", label: "Neutral", color: "text-yellow-500" },
                    { range: "1.0 - 1.3", label: "Bearish", color: "text-amber-500" },
                    { range: "> 1.3", label: "Extreme Fear", color: "text-emerald-400" }
                ],
                proTip: "Extreme PCR readings are contrarian indicators. Extreme greed (low PCR) often precedes drops.",
                dataSources: "Options Chain Volume / Open Interest.",
                updateFrequency: "Real-time / End of Day.",
                confidenceImpact: "High."
            },
            {
                id: "max_pain",
                title: "Max Pain Theory",
                description: "The strike price with the most open contract puts and calls. It is the price at which the stock would cause financial losses for the largest number of option holders at expiration.",
                calculation: "Max Pain = Strike price where (Call Value + Put Value) is lowest\n\nWhere:\n• Evaluated across all available strikes.",
                weight: "15% of Options Engine",
                interpretation: "Market makers supposedly hedge and manipulate the underlying price toward the Max Pain strike going into expiration.",
                proTip: "Highly relevant on OpEx (Options Expiration) Fridays.",
                dataSources: "Options Chain Open Interest.",
                updateFrequency: "Daily.",
                confidenceImpact: "High on Expiration days."
            },
            {
                id: "iv_rank",
                title: "IV Rank (Implied Volatility Rank)",
                description: "Ranks current implied volatility against its historical 52-week range.",
                calculation: "IVR = ((Current IV - Min IV) / (Max IV - Min IV)) x 100",
                weight: "20% of Options Engine",
                interpretation: "IVR > 50: Options are expensive (sell premium).\nIVR < 25: Options are cheap (buy premium).",
                interpretationVisual: [
                    { range: "0 - 25", label: "Very Cheap", color: "text-blue-500" },
                    { range: "25 - 50", label: "Normal", color: "text-emerald-500" },
                    { range: "50 - 75", label: "Expensive", color: "text-amber-500" },
                    { range: "> 75", label: "Extremely Expensive", color: "text-red-500" }
                ],
                proTip: "Never buy naked options when IV Rank is > 50. You will suffer IV crush.",
                dataSources: "Options Chain Implied Volatility.",
                updateFrequency: "Real-time.",
                confidenceImpact: "Dictates Option Strategy selection."
            },
            {
                id: "gamma",
                title: "Gamma Exposure (GEX)",
                description: "Measures the rate of change of Delta. High Gamma means market makers have to aggressively buy/sell to remain delta-neutral, accelerating market moves.",
                calculation: "GEX = Sum(Call Gamma x Call Open Interest) - Sum(Put Gamma x Put Open Interest)",
                weight: "15% of Options Engine",
                interpretation: "Positive GEX: Suppresses volatility (market makers buy dips, sell rips).\nNegative GEX: Accelerates volatility (market makers sell dips, buy rips).",
                proTip: "When GEX flips negative, expect violent, wide-ranging intraday moves.",
                dataSources: "Options Chain Greeks.",
                updateFrequency: "Daily.",
                confidenceImpact: "High for intraday volatility expectations."
            },
            {
                id: "delta",
                title: "Delta",
                description: "Measures the expected change in an option's price given a $1 change in the underlying asset.",
                calculation: "Delta = Change in Option Price / Change in Underlying Price\n\nWhere:\n• V = Option Price\n• S = Underlying Price",
                weight: "10% of Options Engine",
                interpretation: "Call Delta: 0 to 1.\nPut Delta: -1 to 0.\nOften used as a proxy for the probability of expiring in-the-money.",
                proTip: "A 0.30 Delta option has roughly a 30% chance of expiring ITM.",
                dataSources: "Black-Scholes Pricing Model.",
                updateFrequency: "Real-time.",
                confidenceImpact: "Used for position sizing/hedging."
            },
            {
                id: "theta",
                title: "Theta (Time Decay)",
                description: "Measures the rate of decline in the value of an option due to the passage of time.",
                calculation: "Theta = Change in Option Price / Change in Time",
                weight: "5% of Options Engine",
                interpretation: "Always negative for option buyers. Represents the daily cost of holding the option.",
                proTip: "Theta decay accelerates exponentially in the last 14 days before expiration.",
                dataSources: "Black-Scholes Pricing Model.",
                updateFrequency: "Real-time.",
                confidenceImpact: "Moderate."
            },
            {
                id: "vega",
                title: "Vega",
                description: "Measures an option's sensitivity to changes in the volatility of the underlying asset.",
                calculation: "Vega = Change in Option Price / Change in Implied Volatility",
                weight: "5% of Options Engine",
                interpretation: "If Vega is high, small changes in implied volatility will cause massive swings in option premium.",
                proTip: "Long Vega before earnings (IV expansion). Short Vega after earnings (IV crush).",
                dataSources: "Black-Scholes Pricing Model.",
                updateFrequency: "Real-time.",
                confidenceImpact: "Moderate."
            },
            {
                id: "vix",
                title: "VIX (Volatility Index)",
                description: "A real-time index representing the market's expectation of 30-day forward-looking volatility.",
                calculation: "Derived from the price inputs of S&P 500 index options.",
                weight: "10% of Options Engine",
                interpretation: "VIX < 15: Complacency.\nVIX > 30: Fear/Panic.",
                interpretationVisual: [
                    { range: "< 15", label: "Complacent", color: "text-emerald-500" },
                    { range: "15 - 20", label: "Normal", color: "text-yellow-500" },
                    { range: "20 - 30", label: "Elevated", color: "text-amber-500" },
                    { range: "> 30", label: "Panic", color: "text-red-500" }
                ],
                proTip: "If VIX and the S&P 500 are rising together, it implies institutional hedging. A drop is imminent.",
                dataSources: "CBOE.",
                updateFrequency: "Real-time.",
                confidenceImpact: "High macro overlay."
            },
            {
                id: "skew",
                title: "Volatility Skew",
                description: "The difference in implied volatility between out-of-the-money puts and out-of-the-money calls.",
                calculation: "Skew = IV_{OTM Put} - IV_{OTM Call}",
                weight: "0% (Overlay Only)",
                interpretation: "High Skew: Market is bidding up put protection (Fear).\nLow/Reverse Skew: Market is aggressively buying calls (Greed).",
                proTip: "Useful for determining whether institutions are heavily buying downside protection.",
                dataSources: "Options Chain IV.",
                updateFrequency: "Daily.",
                confidenceImpact: "Low."
            }
        ]
    },

    // --- 5. GLOBAL ---
    global: {
        title: "Global Macro Engine",
        description: "Monitors international indices, currency strength, and commodity prices for cross-market correlations.",
        topics: [
{
          "id": "dxy_us_dollar_index",
          "title": "DXY (US Dollar Index)",
          "description": "Measures the value of the US dollar relative to a basket of six major foreign currencies, serving as the ultimate gauge of global dollar liquidity.",
          "calculation": "Geometric weighted average of 6 currencies, heavily skewed to the Euro (57.6%).",
          "weight": "8.0% of Macro Engine",
          "interpretation": "A strengthening DXY constricts global liquidity and pressures risk assets and commodities, while a weakening DXY acts as a broad tailwind for equities.",
          "interpretationVisual": [
                    {
                              "range": "> 105",
                              "label": "Severe Liquidity Drain (Risk Off)",
                              "color": "text-red-500"
                    },
                    {
                              "range": "100 - 105",
                              "label": "Neutral Funding Conditions",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "< 100",
                              "label": "Abundant Liquidity (Risk On)",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Pay close attention to rapid +1% intraday spikes in DXY, as they often precede systemic margin calls in emerging markets.",
          "dataSources": "ICE Futures, TradingView (DXY)",
          "updateFrequency": "Real-time",
          "confidenceImpact": "Absolute"
            },
{
          "id": "us_10y_treasury_yield",
          "title": "US 10-Year Treasury Yield",
          "description": "The benchmark interest rate for global debt markets, reflecting long-term economic growth expectations and structural inflation premiums.",
          "calculation": "Current yield to maturity of the 10-year US Treasury note.",
          "weight": "7.5% of Macro Engine",
          "interpretation": "Rising yields discount future corporate cash flows (hurting tech/growth stocks), whereas falling yields can signal either an economic slowdown or looser financial conditions.",
          "interpretationVisual": [
                    {
                              "range": "Rising > 50bps/mo",
                              "label": "Yield Shock (Risk Off)",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Stable Range",
                              "label": "Market Digestion",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Orderly Decline",
                              "label": "Growth Premium (Risk On)",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Correlate 10Y yield velocity with the Nasdaq-100; a violent spike in the 10Y is lethal to high-duration equity multiples.",
          "dataSources": "US Treasury, FRED (DGS10)",
          "updateFrequency": "Real-time",
          "confidenceImpact": "Absolute"
            },
{
          "id": "us_2y_treasury_yield",
          "title": "US 2-Year Treasury Yield",
          "description": "Highly sensitive to Federal Reserve monetary policy, reflecting near-term market expectations for the federal funds rate.",
          "calculation": "Current yield to maturity of the 2-year US Treasury note.",
          "weight": "6.0% of Macro Engine",
          "interpretation": "Provides the most accurate proxy for the Fed's next policy move; spikes indicate anticipated tightening, while sharp drops signal expected rate cuts.",
          "interpretationVisual": [
                    {
                              "range": "Spiking above Fed Funds",
                              "label": "Hawkish Repricing",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Tracking Fed Funds",
                              "label": "Policy Equilibrium",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Diving below Fed Funds",
                              "label": "Dovish Pivot Priced",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "The 2Y yield usually peaks before the Fed formally pauses rate hikes, offering an early signal for duration positioning.",
          "dataSources": "US Treasury, FRED (DGS2)",
          "updateFrequency": "Real-time",
          "confidenceImpact": "Absolute"
            },
{
          "id": "2y_10y_yield_curve_inversion",
          "title": "2Y/10Y Yield Curve Inversion",
          "description": "The spread between long-term and short-term Treasury rates, serving as a historically reliable leading indicator of economic recessions.",
          "calculation": "US 10-Year Yield minus US 2-Year Yield.",
          "weight": "6.5% of Macro Engine",
          "interpretation": "An inverted curve implies monetary policy is restrictive and growth will slow. The steepening (un-inversion) often marks the actual onset of a recession.",
          "interpretationVisual": [
                    {
                              "range": "< -0.50%",
                              "label": "Deep Inversion (Recession Warning)",
                              "color": "text-red-500"
                    },
                    {
                              "range": "-0.50% to 0.00%",
                              "label": "Mild Inversion",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 0.00%",
                              "label": "Normal/Steepening",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Do not short the market on the inversion itself; the real danger occurs during a 'bull steepening' when the 2-year yield crashes faster than the 10-year.",
          "dataSources": "FRED (T10Y2Y)",
          "updateFrequency": "Daily",
          "confidenceImpact": "High"
            },
{
          "id": "gold_xau_usd",
          "title": "Gold (XAU/USD)",
          "description": "The quintessential safe-haven asset and inflation hedge, responding to real interest rates and systemic sovereign risk.",
          "calculation": "Spot price of one troy ounce of gold in US dollars.",
          "weight": "4.0% of Macro Engine",
          "interpretation": "Gold thrives when real yields are falling and systemic risks are elevated. A breakout in gold often reflects fiat debasement or geopolitical distress.",
          "interpretationVisual": [
                    {
                              "range": "Downtrend / Below 200MA",
                              "label": "Risk Appetite Healthy",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Consolidation",
                              "label": "Neutral Stance",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Aggressive Uptrend / ATHs",
                              "label": "Systemic Stress Indicator",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Watch gold's behavior against foreign currencies (like XAU/EUR or XAU/JPY) to confirm if a rally is true safe-haven demand or just a byproduct of DXY weakness.",
          "dataSources": "LBMA, COMEX",
          "updateFrequency": "Real-time",
          "confidenceImpact": "Moderate"
            },
{
          "id": "crude_oil_wti_brent",
          "title": "Crude Oil (WTI/Brent)",
          "description": "The lifeblood of the global industrial economy, reflecting real physical demand and geopolitical supply premiums.",
          "calculation": "Prompt month futures contracts for West Texas Intermediate or Brent Crude.",
          "weight": "5.0% of Macro Engine",
          "interpretation": "Sustained high oil prices act as a regressive tax on consumers, driving sticky inflation, while collapsing prices point to severe demand destruction.",
          "interpretationVisual": [
                    {
                              "range": "Violent Spikes (>15%/mo)",
                              "label": "Cost-Push Inflation Shock",
                              "color": "text-red-500"
                    },
                    {
                              "range": "$60 - $80 range",
                              "label": "Goldilocks Zone",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Cratering Prices",
                              "label": "Deflationary/Recessionary",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Monitor the calendar spread (backwardation vs contango); extreme backwardation signals a tight physical market regardless of what the headline price implies.",
          "dataSources": "NYMEX, ICE",
          "updateFrequency": "Real-time",
          "confidenceImpact": "High"
            },
{
          "id": "copper_hg1",
          "title": "Copper (HG1!)",
          "description": "Widely known as 'Dr. Copper' for its PhD in economics, it acts as a real-time barometer for global manufacturing and infrastructure health.",
          "calculation": "COMEX Copper Futures front-month contract price.",
          "weight": "4.5% of Macro Engine",
          "interpretation": "A rising copper price indicates economic expansion and strong industrial output, especially in China. Weakness signals global manufacturing contraction.",
          "interpretationVisual": [
                    {
                              "range": "Sharp Decline",
                              "label": "Industrial Contraction",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Range-bound",
                              "label": "Stagnant Output",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Steady Uptrend",
                              "label": "Global Expansion",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "The Copper/Gold ratio is a highly reliable proxy for the US 10-year yield; use divergences between the ratio and yields to spot bond mispricing.",
          "dataSources": "COMEX, LME",
          "updateFrequency": "Real-time",
          "confidenceImpact": "Moderate"
            },
{
          "id": "bitcoin_macro_hedge",
          "title": "Bitcoin as Macro Hedge",
          "description": "A highly liquid, global decentralized asset that trades essentially as an ultra-high beta proxy for global liquidity and fiat debasement.",
          "calculation": "BTC/USD aggregate spot exchange rate.",
          "weight": "3.5% of Macro Engine",
          "interpretation": "Bitcoin functions as a leading liquidity sponge. When central bank balance sheets expand, BTC rallies aggressively; during quantitative tightening, it suffers deeply.",
          "interpretationVisual": [
                    {
                              "range": "Breaking technical supports",
                              "label": "Liquidity Drain In-Progress",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Sideways / Choppy",
                              "label": "Waiting on CB Policy",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Parabolic Advance",
                              "label": "Liquidity Tsunami",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Bitcoin trades 24/7, making weekend price action an excellent leading indicator for Sunday night equity futures opens.",
          "dataSources": "Coinbase, Binance, TradingView",
          "updateFrequency": "Real-time (24/7)",
          "confidenceImpact": "Moderate"
            },
{
          "id": "vix_sp500_correlation",
          "title": "VIX vs S&P 500 Correlation",
          "description": "Measures the implied 30-day volatility of the S&P 500 and its structural relationship with spot equity prices to identify market regime shifts.",
          "calculation": "CBOE Volatility Index relative to S&P 500 daily returns.",
          "weight": "5.5% of Macro Engine",
          "interpretation": "Normally inversely correlated. When both VIX and the S&P 500 rise together, it signals an unstable market where hedging demand is surging despite higher prices.",
          "interpretationVisual": [
                    {
                              "range": "VIX spikes + SPX drops",
                              "label": "Normal Panic (Risk Off)",
                              "color": "text-red-500"
                    },
                    {
                              "range": "VIX flat + SPX rises",
                              "label": "Complacent Bull (Risk On)",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "VIX rises + SPX rises",
                              "label": "Fragile Market (Warning)",
                              "color": "text-yellow-500"
                    }
          ],
          "proTip": "A VIX closing consistently below 12 often precedes a violent mechanical 'volatility short covering' event; complacency is your warning sign.",
          "dataSources": "CBOE, TradingView",
          "updateFrequency": "Real-time",
          "confidenceImpact": "Absolute"
            },
{
          "id": "hyg_credit_spread",
          "title": "High Yield Corporate Bond Spread (HYG)",
          "description": "The premium investors demand to hold junk-rated corporate debt over risk-free Treasuries, indicating the health of corporate balance sheets.",
          "calculation": "ICE BofA US High Yield Index Option-Adjusted Spread.",
          "weight": "5.0% of Macro Engine",
          "interpretation": "Tightening spreads show confidence in corporate solvency and risk appetite. Widening spreads signal default fears and act as a leading indicator of equity sell-offs.",
          "interpretationVisual": [
                    {
                              "range": "> 5.0% Spread",
                              "label": "Credit Stress (Risk Off)",
                              "color": "text-red-500"
                    },
                    {
                              "range": "4.0% - 5.0%",
                              "label": "Elevated Caution",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "< 4.0%",
                              "label": "Healthy Credit Markets",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "The equity market cannot sustain a rally if high yield spreads are simultaneously breaking out to new highs. Credit markets lead equities.",
          "dataSources": "FRED (BAMLH0A0HYM2)",
          "updateFrequency": "Daily",
          "confidenceImpact": "Absolute"
            },
{
          "id": "ted_spread",
          "title": "TED Spread",
          "description": "The difference between the interest rate on interbank loans and short-term US government debt, acting as an indicator of perceived credit risk in the global banking system.",
          "calculation": "3-Month LIBOR (or SOFR equivalent) minus 3-Month T-Bill yield.",
          "weight": "2.5% of Macro Engine",
          "interpretation": "A rising TED spread means banks are charging each other higher premiums due to counterparty risk, often predicting liquidity crises.",
          "interpretationVisual": [
                    {
                              "range": "> 50 bps",
                              "label": "Severe Banking Stress",
                              "color": "text-red-500"
                    },
                    {
                              "range": "20 - 50 bps",
                              "label": "Elevated Vigilance",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "< 20 bps",
                              "label": "Normal Interbank Function",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Although Libor is phased out, tracking the SOFR-OIS spread provides the modern equivalent of this deep systemic plumbing indicator.",
          "dataSources": "FRED (TEDRATE)",
          "updateFrequency": "Daily",
          "confidenceImpact": "Moderate"
            },
{
          "id": "libor_sofr_rates",
          "title": "Libor/SOFR Rates",
          "description": "The secured overnight financing rate that banks use to price trillions of dollars in derivatives and loans globally.",
          "calculation": "Volume-weighted median of transaction-level tri-party repo data.",
          "weight": "2.0% of Macro Engine",
          "interpretation": "Sharp upward volatility in SOFR indicates an overnight funding squeeze, signaling distress in collateral markets.",
          "interpretationVisual": [
                    {
                              "range": "Spikes above Fed Funds",
                              "label": "Repo Market Stress",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Tracking target",
                              "label": "Stable Funding",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Drops below target",
                              "label": "Collateral Shortage",
                              "color": "text-yellow-500"
                    }
          ],
          "proTip": "Watch for quarter-end and year-end window dressing by banks which can artificially spike SOFR; true stress persists outside these windows.",
          "dataSources": "New York Fed",
          "updateFrequency": "Daily",
          "confidenceImpact": "High"
            },
{
          "id": "federal_funds_rate",
          "title": "Federal Funds Rate",
          "description": "The baseline target interest rate set by the FOMC at which depository institutions trade federal funds overnight.",
          "calculation": "Target rate range announced by the Federal Reserve.",
          "weight": "5.0% of Macro Engine",
          "interpretation": "The primary lever for US monetary policy. Hikes slow economic growth and drain liquidity; cuts attempt to stimulate the economy.",
          "interpretationVisual": [
                    {
                              "range": "Aggressive Hiking Cycle",
                              "label": "Restrictive Environment",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Pause / Plateau",
                              "label": "Policy Digesting",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Easing Cycle",
                              "label": "Accommodative (Risk On)",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Markets rarely react to the absolute level of the Fed Funds Rate; the alpha lies entirely in trading the delta between market expectations and Fed forward guidance.",
          "dataSources": "Federal Reserve",
          "updateFrequency": "Post-FOMC (Every 6 Weeks)",
          "confidenceImpact": "Absolute"
            },
{
          "id": "m2_money_supply",
          "title": "M2 Money Supply",
          "description": "A broad measure of the total money in circulation, including cash, checking deposits, and easily convertible near money.",
          "calculation": "Sum of currency in circulation, demand deposits, and liquid savings accounts.",
          "weight": "4.5% of Macro Engine",
          "interpretation": "Rapid M2 expansion drives asset price inflation and economic overheating, while contraction shrinks liquidity, creating powerful deflationary headwinds.",
          "interpretationVisual": [
                    {
                              "range": "Negative YoY Growth",
                              "label": "Severe Deflationary Drag",
                              "color": "text-red-500"
                    },
                    {
                              "range": "0% - 5% YoY Growth",
                              "label": "Stable Baseline",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 5% YoY Growth",
                              "label": "Liquidity Injection (Risk On)",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Absolute M2 doesn't matter as much as its rate of change. When M2 growth turns negative year-over-year, it acts as a mechanical gravity on equity multiples.",
          "dataSources": "FRED (WM2NS)",
          "updateFrequency": "Monthly",
          "confidenceImpact": "High"
            },
{
          "id": "reverse_repo_market",
          "title": "Reverse Repo Market (RRP)",
          "description": "The facility where money market funds park excess cash overnight at the Fed, acting as a gauge for systemic liquidity abundance or shortage.",
          "calculation": "Overnight Reverse Repurchase Agreements: Treasury Securities Sold by the Fed.",
          "weight": "3.5% of Macro Engine",
          "interpretation": "A draining RRP means cash is being deployed into the financial system (bullish liquidity), while rising RRP means cash is being sterilized and pulled out of markets.",
          "interpretationVisual": [
                    {
                              "range": "Rapidly Increasing",
                              "label": "Liquidity Sterilization",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Stagnant/Plateaued",
                              "label": "Neutral Flow",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Draining/Dropping",
                              "label": "Liquidity Flush to Markets",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "The drawdown of the RRP balance acts as a massive shock absorber against Quantitative Tightening (QT), offsetting the Fed's balance sheet run-off.",
          "dataSources": "New York Fed, FRED (RRPONTSYD)",
          "updateFrequency": "Daily",
          "confidenceImpact": "High"
            },
{
          "id": "central_bank_balance_sheets",
          "title": "Central Bank Balance Sheets",
          "description": "The aggregate total assets held by major global central banks (Fed, ECB, BOJ, PBOC), representing the raw mechanics of global QE/QT.",
          "calculation": "Total assets of the G4 Central Banks converted to USD.",
          "weight": "5.5% of Macro Engine",
          "interpretation": "Synchronized balance sheet expansion (QE) artificially suppresses volatility and forces capital out the risk curve. Synchronized contraction (QT) mathematically drains market liquidity.",
          "interpretationVisual": [
                    {
                              "range": "Aggressive Contraction",
                              "label": "Systemic De-risking",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Flat / Offset",
                              "label": "Choppy Volatility",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Coordinated Expansion",
                              "label": "Melt-Up Phase",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Net Liquidity (Fed Balance Sheet - TGA - RRP) is a far superior metric for timing S&P 500 swings than just looking at the gross balance sheet number.",
          "dataSources": "FRED (WALCL), ECB, BOJ",
          "updateFrequency": "Weekly",
          "confidenceImpact": "Absolute"
            },
{
          "id": "inflation_expectations",
          "title": "Inflation Expectations (Breakeven Rate)",
          "description": "Market-implied expectations for future inflation, derived from the yield difference between nominal Treasuries and TIPS.",
          "calculation": "US 5-Year Breakeven Inflation Rate.",
          "weight": "3.0% of Macro Engine",
          "interpretation": "Rising breakevens show the market believes the Fed is falling behind the curve on inflation, which can trigger hawkish policy responses.",
          "interpretationVisual": [
                    {
                              "range": "> 2.5%",
                              "label": "Unanchored Expectations",
                              "color": "text-red-500"
                    },
                    {
                              "range": "2.0% - 2.5%",
                              "label": "Target Goldilocks",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "< 2.0%",
                              "label": "Deflation Risks Surging",
                              "color": "text-yellow-500"
                    }
          ],
          "proTip": "The Fed watches the 5-year, 5-year forward inflation expectation rate religiously. If it breaks out of its historical band, rate hikes are imminent regardless of lagging CPI data.",
          "dataSources": "FRED (T5YIE)",
          "updateFrequency": "Daily",
          "confidenceImpact": "Moderate"
            },
{
          "id": "real_interest_rates",
          "title": "Real Interest Rates",
          "description": "The nominal interest rate adjusted for inflation, representing the true cost of capital for borrowers and true yield for lenders.",
          "calculation": "US 10-Year Treasury Yield minus 10-Year Breakeven Inflation Rate.",
          "weight": "6.0% of Macro Engine",
          "interpretation": "Positive and rising real rates act as kryptonite for non-yielding assets (like Gold/Crypto) and ultra-high-growth tech stocks. Negative real rates incentivize rampant speculation.",
          "interpretationVisual": [
                    {
                              "range": "> 1.5%",
                              "label": "Highly Restrictive (Anti-Growth)",
                              "color": "text-red-500"
                    },
                    {
                              "range": "0.0% - 1.5%",
                              "label": "Normalizing Cost of Capital",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "< 0.0%",
                              "label": "Financial Repression (Asset Bubbles)",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Real yields dictate long-term P/E multiples. When real yields hit 2%, holding highly levered unprofitable tech is mathematically disastrous.",
          "dataSources": "FRED (DFII10)",
          "updateFrequency": "Daily",
          "confidenceImpact": "Absolute"
            },
{
          "id": "em_currency_index",
          "title": "Emerging Market Currency Index",
          "description": "A basket of emerging market currencies against the USD, acting as a global growth and risk-on sentiment barometer.",
          "calculation": "J.P. Morgan Emerging Market Currency Index (EMCI).",
          "weight": "2.0% of Macro Engine",
          "interpretation": "Strong EM currencies suggest capital is flowing outwards seeking high yield (risk-on). Weak EM currencies indicate global capital flight back to the USD safety.",
          "interpretationVisual": [
                    {
                              "range": "Sharp Downtrend",
                              "label": "Capital Flight to USD",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Consolidation",
                              "label": "Neutral Global Flows",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Uptrend",
                              "label": "Global Risk-Seeking",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "A sovereign default in an emerging market (like Argentina or Turkey) rarely matters globally unless the EM Currency Index simultaneously breaks long-term support.",
          "dataSources": "Bloomberg, TradingView",
          "updateFrequency": "Daily",
          "confidenceImpact": "Moderate"
            },
{
          "id": "usd_jpy_carry_trade",
          "title": "USD/JPY Carry Trade",
          "description": "Reflects the massive structural trade where investors borrow cheap Yen to buy higher-yielding US assets, highly sensitive to US-Japan interest rate differentials.",
          "calculation": "Spot exchange rate between the US Dollar and Japanese Yen.",
          "weight": "4.5% of Macro Engine",
          "interpretation": "A stable or rising USD/JPY fuels global liquidity. A sudden collapse in USD/JPY triggers violent margin calls as funds are forced to unwind leveraged global bets.",
          "interpretationVisual": [
                    {
                              "range": "Flash Crash (< -2% daily)",
                              "label": "Carry Trade Unwind (Systemic Event)",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Orderly Decline",
                              "label": "Yield Gap Closing",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Stable Uptrend",
                              "label": "Carry Trade Intact",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never ignore a sudden intervention by the BOJ to strengthen the Yen. It is one of the few black swan triggers that can drop the S&P 500 5% in a single week.",
          "dataSources": "Forex Markets",
          "updateFrequency": "Real-time",
          "confidenceImpact": "High"
            },
{
          "id": "eur_usd_strength",
          "title": "EUR/USD Strength",
          "description": "The most heavily traded currency pair in the world, reflecting the macroeconomic divergence between the US and the Eurozone.",
          "calculation": "Spot exchange rate of Euro relative to US Dollar.",
          "weight": "3.0% of Macro Engine",
          "interpretation": "A rising EUR/USD typically correlates with a risk-on environment and global reflation. A falling EUR/USD highlights European stagnation and US exceptionalism.",
          "interpretationVisual": [
                    {
                              "range": "< 1.05",
                              "label": "European Crisis / King Dollar",
                              "color": "text-red-500"
                    },
                    {
                              "range": "1.05 - 1.12",
                              "label": "Range-bound Equities",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 1.12",
                              "label": "Global Reflation Trade",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Because the Euro makes up almost 60% of the DXY index, trading EUR/USD is fundamentally just an inverted derivative of betting on US dollar liquidity.",
          "dataSources": "Forex Markets",
          "updateFrequency": "Real-time",
          "confidenceImpact": "Moderate"
            },
{
          "id": "china_credit_impulse",
          "title": "China Credit Impulse",
          "description": "The change in new credit issued in China as a percentage of GDP, operating as the premier leading indicator for global manufacturing and commodity cycles.",
          "calculation": "12-month change in PBOC Total Social Financing.",
          "weight": "3.5% of Macro Engine",
          "interpretation": "A positive impulse leads to an acceleration in global PMIs and commodity prices 9-12 months later. A negative impulse guarantees global cyclical weakness.",
          "interpretationVisual": [
                    {
                              "range": "Negative/Contraction",
                              "label": "Global Slowdown Imminent",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Flatlining",
                              "label": "Awaiting Stimulus",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Strong Surge",
                              "label": "Commodity Supercycle Launch",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "European luxury stocks and heavy machinery equities trade almost entirely on a 6-month lag to the China Credit Impulse.",
          "dataSources": "Bloomberg, PBOC",
          "updateFrequency": "Monthly",
          "confidenceImpact": "High"
            },
{
          "id": "global_manufacturing_pmi",
          "title": "Global Manufacturing PMI",
          "description": "A diffusion index aggregating purchasing managers' indices across major economies to track the momentum of global industrial output.",
          "calculation": "J.P. Morgan Global Manufacturing PMI (Values above 50 = Expansion).",
          "weight": "3.0% of Macro Engine",
          "interpretation": "PMI falling below 50 signals global industrial contraction (bearish for copper, oil, and cyclical equities). Accelerating PMIs above 50 fuel bull markets.",
          "interpretationVisual": [
                    {
                              "range": "< 48",
                              "label": "Synchronized Contraction",
                              "color": "text-red-500"
                    },
                    {
                              "range": "48 - 52",
                              "label": "Transitional Phase",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 52",
                              "label": "Robust Expansion",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "The most profitable trade is catching the inflection point when PMI goes from 45 back to 48, as cyclical stocks bottom long before the index crosses 50.",
          "dataSources": "S&P Global, J.P. Morgan",
          "updateFrequency": "Monthly",
          "confidenceImpact": "High"
            },
{
          "id": "baltic_dry_index",
          "title": "Baltic Dry Index (Shipping)",
          "description": "An index assessing the price of moving the major raw materials by sea, serving as a pure, unmanipulated indicator of global supply and demand.",
          "calculation": "Time charter averages across Capesize, Panamax, and Supramax vessels.",
          "weight": "1.5% of Macro Engine",
          "interpretation": "A rising BDI shows strong demand for raw materials (bullish for global growth). A plunging BDI indicates factories are cancelling raw material orders.",
          "interpretationVisual": [
                    {
                              "range": "Cratering > 30%",
                              "label": "Demand Destruction",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Stable/Ranging",
                              "label": "Normal Trade Flows",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Sustained Rally",
                              "label": "Vigorous Global Trade",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "BDI is immune to speculative financial trading because you cannot easily trade derivatives on it; it reflects pure physical reality.",
          "dataSources": "Baltic Exchange",
          "updateFrequency": "Daily",
          "confidenceImpact": "Moderate"
            },
{
          "id": "lumber_gold_ratio",
          "title": "Lumber to Gold Ratio",
          "description": "A niche but powerful leading indicator comparing the ultimate cyclical risk-on commodity (lumber) to the ultimate defensive asset (gold).",
          "calculation": "Lumber Futures Price divided by Gold Spot Price.",
          "weight": "2.0% of Macro Engine",
          "interpretation": "When lumber outperforms gold, it signals massive economic optimism and housing growth. When gold outperforms lumber, fear and economic contraction are dominant.",
          "interpretationVisual": [
                    {
                              "range": "Sharply Declining",
                              "label": "Recession/Risk-Off Imminent",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Consolidating",
                              "label": "Indecision",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Sharply Rising",
                              "label": "Aggressive Risk-On",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "This ratio tends to lead the volatility complex. A multi-week breakdown in the Lumber/Gold ratio often precedes a major VIX spike by 2-3 weeks.",
          "dataSources": "CME (Lumber), COMEX (Gold)",
          "updateFrequency": "Daily",
          "confidenceImpact": "Moderate"
            },
{
          "id": "consumer_credit_outstanding",
          "title": "Consumer Credit Outstanding",
          "description": "Tracks the total amount of revolving (credit cards) and non-revolving (auto loans) debt held by US consumers, reflecting exhaustion of household balance sheets.",
          "calculation": "Monthly change in total consumer debt balances.",
          "weight": "2.5% of Macro Engine",
          "interpretation": "Healthy credit growth supports retail sales. Parabolic credit card usage amidst falling real wages signals consumers are using debt just to survive, foreshadowing a retail cliff.",
          "interpretationVisual": [
                    {
                              "range": "Spiking amidst high rates",
                              "label": "Consumer Exhaustion Warning",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Steady historical growth",
                              "label": "Healthy Spending",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Sudden Contraction",
                              "label": "Deleveraging / Recessionary",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Do not look at just the total debt; watch the 30-day delinquency rates on auto loans, as they are the first pillar of consumer credit to crack.",
          "dataSources": "Federal Reserve (G.19)",
          "updateFrequency": "Monthly",
          "confidenceImpact": "Moderate"
            },
{
          "id": "housing_starts_permits",
          "title": "Housing Starts & Permits",
          "description": "A highly cyclical leading economic indicator tracking new residential construction projects, reflecting developer confidence and mortgage rate impacts.",
          "calculation": "Annualized rate of new privately-owned housing units authorized by building permits.",
          "weight": "3.5% of Macro Engine",
          "interpretation": "A steep decline in permits consistently foreshadows broader economic downturns, as housing drives a massive derivative supply chain (lumber, copper, appliances).",
          "interpretationVisual": [
                    {
                              "range": "Consecutive Multi-Month Drops",
                              "label": "Housing Market Freeze",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Plateauing",
                              "label": "Rate Digestion",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Surging Permits",
                              "label": "Economic Boom",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Permits are forward-looking, starts are present. Focus entirely on permits, as a collapse there guarantees a collapse in construction employment 6 months later.",
          "dataSources": "US Census Bureau",
          "updateFrequency": "Monthly",
          "confidenceImpact": "High"
            },
{
          "id": "retail_sales_mom",
          "title": "Retail Sales MoM",
          "description": "Measures total receipts at stores that sell merchandise and related services, acting as the primary gauge of the US consumer (who drives 70% of GDP).",
          "calculation": "Month-over-month percentage change in advance retail sales.",
          "weight": "3.0% of Macro Engine",
          "interpretation": "Strong retail sales keep the 'soft landing' narrative alive. Negative prints, especially during the holiday season, trigger immediate recessionary panic.",
          "interpretationVisual": [
                    {
                              "range": "Deeply Negative (< -0.5%)",
                              "label": "Consumer Retreating",
                              "color": "text-red-500"
                    },
                    {
                              "range": "0.0% to 0.4%",
                              "label": "Treading Water",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 0.5%",
                              "label": "Consumer Resilient",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Retail sales are reported nominally (not adjusted for inflation). If CPI is 0.4% and Retail Sales is 0.2%, real retail sales actually contracted.",
          "dataSources": "US Census Bureau",
          "updateFrequency": "Monthly",
          "confidenceImpact": "High"
            },
{
          "id": "velocity_of_money",
          "title": "Velocity of Money",
          "description": "The rate at which a single unit of currency circulates through the economy, highlighting the structural effectiveness of monetary policy.",
          "calculation": "Nominal GDP divided by the M2 Money Supply.",
          "weight": "1.5% of Macro Engine",
          "interpretation": "High velocity means consumers are spending cash aggressively (inflationary). Plunging velocity means cash is being hoarded in savings or trapped in bank reserves.",
          "interpretationVisual": [
                    {
                              "range": "Trending Upwards",
                              "label": "Inflationary Momentum",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Flatlining",
                              "label": "Economic Stagnation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Collapsing",
                              "label": "Deflationary Hoarding",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Quantitative Easing often fails to create main-street inflation simply because the velocity of money collapses simultaneously, trapping funds at the institutional level.",
          "dataSources": "FRED (M2V)",
          "updateFrequency": "Quarterly",
          "confidenceImpact": "Moderate"
            },
{
          "id": "global_liquidity_index",
          "title": "Global Liquidity Index",
          "description": "A composite metric blending major central bank balance sheets, global money supply, and currency reserve movements to track total fiat saturation.",
          "calculation": "Aggregated fiat liquidity across G20 nations, offset by central bank liabilities.",
          "weight": "4.5% of Macro Engine",
          "interpretation": "The single most correlated metric to the Nasdaq-100 over the past decade. If global liquidity is rising, risk assets will mathematically drift higher regardless of valuations.",
          "interpretationVisual": [
                    {
                              "range": "Net Liquidity Draining",
                              "label": "Gravitational Pull on Equities",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Sideways Consolidation",
                              "label": "Choppy Range Trading",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Net Liquidity Injection",
                              "label": "Everything Rally",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Do not short tech stocks when global liquidity is expanding, no matter how overvalued they appear. Valuations do not matter when the fiat denominator is being debased.",
          "dataSources": "CrossBorder Capital, Proprietary Aggregates",
          "updateFrequency": "Weekly",
          "confidenceImpact": "Absolute"
            }
        ]
    },

    // --- 6. EVENTS ---
    events: {
        title: "Events Engine",
        description: "Monitors scheduled macroeconomic releases, central bank meetings, and corporate earnings.",
        topics: [
{
          "id": "non_farm_payrolls",
          "title": "Non-Farm Payrolls (NFP)",
          "description": "The most closely watched US labor report, measuring the monthly change in employed people excluding the farming sector, driving massive intraday volatility.",
          "calculation": "Headline number of jobs added/lost + Unemployment Rate + Average Hourly Earnings.",
          "weight": "8.0% of Event Engine",
          "interpretation": "A massive beat triggers fears of Fed tightening (equities dump). A massive miss triggers recession fears (equities dump). Markets desire a 'Goldilocks' print.",
          "interpretationVisual": [
                    {
                              "range": "Massive Beat (> +100k vs Est)",
                              "label": "Hawkish Repricing Risk",
                              "color": "text-red-500"
                    },
                    {
                              "range": "In-line with Estimates",
                              "label": "Goldilocks Relief Rally",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Massive Miss (< -100k vs Est)",
                              "label": "Recessionary Panic",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Never trade the headline number alone; algorithmic trading engines always scan Average Hourly Earnings first to gauge wage inflation before reacting to the job count.",
          "dataSources": "Bureau of Labor Statistics (BLS)",
          "updateFrequency": "Monthly (First Friday)",
          "confidenceImpact": "Absolute"
            },
{
          "id": "fomc_rate_decision",
          "title": "FOMC Rate Decision",
          "description": "The official statement releasing the Federal Reserve's target interest rate and the 'Dot Plot' projections for future policy paths.",
          "calculation": "The 2:00 PM EST press release detailing the Fed Funds Rate change.",
          "weight": "10.0% of Event Engine",
          "interpretation": "The actual rate decision is usually priced in 99% by the bond market. The true catalyst is the language in the statement regarding the path forward.",
          "interpretationVisual": [
                    {
                              "range": "Surprise Hike / Hawkish Dots",
                              "label": "Risk Asset Liquidation",
                              "color": "text-red-500"
                    },
                    {
                              "range": "As Expected / Neutral",
                              "label": "Awaiting Press Conference",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Surprise Cut / Dovish Pause",
                              "label": "Violent Short Squeeze",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Algorithms instantly parse the FOMC statement for deleted sentences from the previous month's statement; a single removed word like 'elevated' can spark a 1% S&P 500 rally in seconds.",
          "dataSources": "Federal Reserve",
          "updateFrequency": "8 Times a Year",
          "confidenceImpact": "Absolute"
            },
{
          "id": "fomc_meeting_minutes",
          "title": "FOMC Meeting Minutes",
          "description": "The detailed textual record of the prior FOMC meeting, revealing the internal debates and dissent among Fed governors regarding policy direction.",
          "calculation": "Textual analysis of hawkish vs dovish sentiment among committee members.",
          "weight": "4.0% of Event Engine",
          "interpretation": "Used to gauge how close the Fed is to pivoting. If the minutes reveal that multiple members wanted to hike but settled for a pause, the market treats it as hawkish.",
          "interpretationVisual": [
                    {
                              "range": "High Consensus for Higher Rates",
                              "label": "Hawkish Undertone",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Balanced Debate",
                              "label": "Data Dependent Stance",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Growing Concerns on Growth",
                              "label": "Dovish Undertone",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "The minutes are 3 weeks stale. Only trade them if they violently contradict the narrative Powell gave during his live press conference 3 weeks prior.",
          "dataSources": "Federal Reserve",
          "updateFrequency": "3 Weeks Post-FOMC",
          "confidenceImpact": "Moderate"
            },
{
          "id": "jerome_powell_press_conference",
          "title": "Jerome Powell Press Conference",
          "description": "The 2:30 PM EST live Q&A session where the Fed Chair explains policy, infamous for causing massive intraday reversals.",
          "calculation": "Live audio analysis and semantic tone tracking of the Fed Chair's answers.",
          "weight": "9.0% of Event Engine",
          "interpretation": "Powell’s tone dictates the market close. He frequently uses the Q&A to deliberately walk back or soften the impact of a hawkish 2:00 PM statement.",
          "interpretationVisual": [
                    {
                              "range": "Combative / Emphasizing Pain",
                              "label": "Crushing Market Hopes",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Sticking to the Script",
                              "label": "Two-Sided Chop",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Acknowledging Disinflation",
                              "label": "Green Light for Bulls",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never hold zero-day options through the 2:30 PM start time; Powell’s first two sentences usually trigger a massive fake-out in the opposite direction of the true move.",
          "dataSources": "Federal Reserve Broadcast",
          "updateFrequency": "8 Times a Year",
          "confidenceImpact": "Absolute"
            },
{
          "id": "cpi_print",
          "title": "Consumer Price Index (CPI)",
          "description": "The premier measure of retail inflation facing the US consumer, heavily dictating the Fed's monetary policy urgency.",
          "calculation": "Month-over-month and Year-over-year percentage change in headline and core baskets.",
          "weight": "9.5% of Event Engine",
          "interpretation": "A CPI print coming in hotter (higher) than estimated causes immediate bond selloffs and equity drops. A cooler print triggers massive relief rallies.",
          "interpretationVisual": [
                    {
                              "range": "> 0.2% Above Estimates",
                              "label": "Inflation Shock",
                              "color": "text-red-500"
                    },
                    {
                              "range": "In-line with Estimates",
                              "label": "Status Quo",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "< 0.2% Below Estimates",
                              "label": "Disinflationary Rally",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Ignore the headline YoY number. Institutional traders only care about Core Services Ex-Housing (Supercore) MoM, as that dictates sticky wage-driven inflation.",
          "dataSources": "Bureau of Labor Statistics (BLS)",
          "updateFrequency": "Monthly",
          "confidenceImpact": "Absolute"
            },
{
          "id": "ppi_print",
          "title": "Producer Price Index (PPI)",
          "description": "Measures the average changes in prices received by domestic producers, acting as a leading indicator for consumer inflation.",
          "calculation": "MoM and YoY change in prices at the wholesale and manufacturing level.",
          "weight": "6.0% of Event Engine",
          "interpretation": "Producers pass costs onto consumers. A surging PPI guarantees a hot CPI next month. A plunging PPI signals supply chain healing and disinflation.",
          "interpretationVisual": [
                    {
                              "range": "Surging Wholesale Costs",
                              "label": "Margin Compression Imminent",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Matching Consensus",
                              "label": "No Surprises",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Deflationary Factory Gate",
                              "label": "Disinflation Pipeline Intact",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "PPI is highly sensitive to crude oil fluctuations; always strip out energy costs to see if there is structural inflation in intermediate goods.",
          "dataSources": "Bureau of Labor Statistics (BLS)",
          "updateFrequency": "Monthly",
          "confidenceImpact": "High"
            },
{
          "id": "pce_print",
          "title": "Personal Consumption Expenditures (PCE)",
          "description": "The Federal Reserve’s preferred inflation gauge, which accounts for consumer substitution effects unlike CPI.",
          "calculation": "Core PCE Price Index MoM and YoY.",
          "weight": "7.5% of Event Engine",
          "interpretation": "Since it is the Fed's official target metric (aiming for 2%), an upside surprise here guarantees hawkish Fed rhetoric, cementing higher-for-longer rates.",
          "interpretationVisual": [
                    {
                              "range": "Hotter than Expected",
                              "label": "Hawkish Fed Cemented",
                              "color": "text-red-500"
                    },
                    {
                              "range": "As Expected",
                              "label": "Market Relief",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Cooler than Expected",
                              "label": "Rate Cut Pricing Accelerated",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "PCE is released late in the month and is heavily derived from CPI and PPI data released earlier. Thus, PCE rarely shocks the market unless it wildly deviates from the inferred calculations.",
          "dataSources": "Bureau of Economic Analysis (BEA)",
          "updateFrequency": "Monthly",
          "confidenceImpact": "High"
            },
{
          "id": "gdp_print",
          "title": "Gross Domestic Product (GDP)",
          "description": "The broadest measure of a nation's total economic activity, finalized through Advance, Preliminary, and Final readings.",
          "calculation": "Annualized percentage growth rate of all goods and services produced.",
          "weight": "4.5% of Event Engine",
          "interpretation": "Two consecutive negative quarters defines a technical recession. Surprisingly high GDP gives the Fed immense runway to keep hiking rates without breaking the economy.",
          "interpretationVisual": [
                    {
                              "range": "Deep Contraction",
                              "label": "Recession Confirmed",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Middling Growth (1-2%)",
                              "label": "Stagnation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Hot Growth (>3%)",
                              "label": "Economic Resilience",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "The market almost entirely ignores the 'Final' GDP reading because it looks backward by 3 months. Only the 'Advance' estimate moves markets.",
          "dataSources": "Bureau of Economic Analysis (BEA)",
          "updateFrequency": "Quarterly (with monthly revisions)",
          "confidenceImpact": "Moderate"
            },
{
          "id": "initial_jobless_claims",
          "title": "Initial Jobless Claims",
          "description": "A high-frequency weekly leading indicator tracking the number of individuals filing for unemployment benefits for the first time.",
          "calculation": "Headline count of new state unemployment insurance filings.",
          "weight": "5.5% of Event Engine",
          "interpretation": "The earliest warning system for labor market cracks. A sustained break above 250k claims signals corporate layoffs are cascading into real economic damage.",
          "interpretationVisual": [
                    {
                              "range": "> 250k and rising",
                              "label": "Labor Cracks Showing",
                              "color": "text-red-500"
                    },
                    {
                              "range": "200k - 250k",
                              "label": "Normal Frictional Baseline",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "< 200k",
                              "label": "Historically Tight Labor",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Ignore single-week anomalies caused by holidays or hurricanes. Focus strictly on the 4-week moving average to identify true inflection points in corporate firing cycles.",
          "dataSources": "Department of Labor",
          "updateFrequency": "Weekly (Thursdays)",
          "confidenceImpact": "High"
            },
{
          "id": "jolts_job_openings",
          "title": "JOLTS Job Openings",
          "description": "Tracks total unfilled job openings, heavily cited by the Fed as proof of a structural labor supply/demand imbalance.",
          "calculation": "Total number of nonfarm job openings on the last business day of the month.",
          "weight": "5.0% of Event Engine",
          "interpretation": "High job openings (e.g., 2 open jobs per 1 unemployed person) fuel wage inflation. A collapse in openings signals companies are enacting hiring freezes ahead of a recession.",
          "interpretationVisual": [
                    {
                              "range": "Plunging Openings",
                              "label": "Hiring Freeze / Softening",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Plateau",
                              "label": "Labor Equilibrium",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Surging Openings",
                              "label": "Tight Labor (Hawkish)",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Watch the 'Quits Rate' inside the JOLTS report. High quits mean workers are confident they can find better pay elsewhere, perfectly forecasting sticky wage inflation.",
          "dataSources": "Bureau of Labor Statistics (BLS)",
          "updateFrequency": "Monthly",
          "confidenceImpact": "High"
            },
{
          "id": "ism_manufacturing_pmi",
          "title": "ISM Manufacturing PMI",
          "description": "The gold standard index for US industrial health, surveyed directly from supply chain executives.",
          "calculation": "Headline composite index (Prices, New Orders, Employment, Deliveries, Inventories).",
          "weight": "4.5% of Event Engine",
          "interpretation": "A print below 50 indicates contraction. A deep dive below 45 almost always historically aligns with an NBER-declared recession.",
          "interpretationVisual": [
                    {
                              "range": "< 45",
                              "label": "Deep Industrial Recession",
                              "color": "text-red-500"
                    },
                    {
                              "range": "48 - 50",
                              "label": "Stalling Growth",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 52",
                              "label": "Industrial Expansion",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "The 'Prices Paid' sub-index within ISM is a highly sensitive leading indicator for CPI. If Prices Paid spikes, inflation is re-accelerating.",
          "dataSources": "Institute for Supply Management",
          "updateFrequency": "Monthly",
          "confidenceImpact": "High"
            },
{
          "id": "ism_services_pmi",
          "title": "ISM Services PMI",
          "description": "Measures the health of the US services sector, which comprises roughly 80% of the total US economy.",
          "calculation": "Headline index tracking business activity, new orders, and employment in non-manufacturing.",
          "weight": "6.0% of Event Engine",
          "interpretation": "Because the US is a service-based economy, a collapse in ISM Services is far more devastating to the stock market than a collapse in ISM Manufacturing.",
          "interpretationVisual": [
                    {
                              "range": "< 50",
                              "label": "Service Sector Contraction (Danger)",
                              "color": "text-red-500"
                    },
                    {
                              "range": "50 - 52",
                              "label": "Vulnerable Plateau",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 54",
                              "label": "Strong Economic Engine",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "When ISM Manufacturing is below 50 but ISM Services is above 55, the economy is experiencing a segmented slowdown. If Services drops below 50, a full recession is imminent.",
          "dataSources": "Institute for Supply Management",
          "updateFrequency": "Monthly",
          "confidenceImpact": "Absolute"
            },
{
          "id": "retail_sales_data",
          "title": "Retail Sales Data",
          "description": "Captures in-store and online purchases, serving as a real-time pulse on consumer spending power and credit utilization.",
          "calculation": "Month-over-month headline percentage change, plus the 'control group' which feeds into GDP.",
          "weight": "4.0% of Event Engine",
          "interpretation": "If consumers stop spending, corporate earnings collapse. A severe miss in retail sales shifts the market narrative instantly from 'inflation fears' to 'recession panic'.",
          "interpretationVisual": [
                    {
                              "range": "Major Miss",
                              "label": "Consumer Wall Hit",
                              "color": "text-red-500"
                    },
                    {
                              "range": "In-line",
                              "label": "Spending Holding Up",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Major Beat",
                              "label": "Unstoppable Consumer",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Always trade based on the 'Retail Sales Control Group' (which excludes autos, gas, and building materials) as it represents the true discretionary spending feeding into GDP.",
          "dataSources": "US Census Bureau",
          "updateFrequency": "Monthly",
          "confidenceImpact": "High"
            },
{
          "id": "umich_consumer_sentiment",
          "title": "University of Michigan Consumer Sentiment",
          "description": "A survey of personal financial expectations and business conditions, directly influencing consumer willingness to spend.",
          "calculation": "Headline Sentiment Index + 1-Year/5-Year Inflation Expectations.",
          "weight": "3.5% of Event Engine",
          "interpretation": "Consumer behavior is self-fulfilling; if sentiment craters, spending halts. But the real market mover is the inflation expectations component.",
          "interpretationVisual": [
                    {
                              "range": "Inflation Expectations Spike",
                              "label": "Stagflation Panic",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Stable Optimism",
                              "label": "Healthy Baseline",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Sentiment Collapse",
                              "label": "Depression Mindset",
                              "color": "text-yellow-500"
                    }
          ],
          "proTip": "The Fed hyper-focuses on the 5-Year Inflation Expectations component. If this number unanchors upwards, expect violent hawkish rhetoric from Fed governors.",
          "dataSources": "University of Michigan",
          "updateFrequency": "Monthly (Prelim and Final)",
          "confidenceImpact": "Moderate"
            },
{
          "id": "cb_consumer_confidence",
          "title": "CB Consumer Confidence",
          "description": "Measures the degree of optimism that consumers feel about the overall state of the economy and their personal financial situation.",
          "calculation": "Headline Index derived from appraisals of current conditions and future expectations.",
          "weight": "2.5% of Event Engine",
          "interpretation": "Historically, when the 'Expectations' index drops significantly below the 'Current Conditions' index, a recession follows within 6-9 months.",
          "interpretationVisual": [
                    {
                              "range": "Sharp Drop (< 80)",
                              "label": "Severe Pessimism",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Hovering near 100",
                              "label": "Cautious Optimism",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Surging (> 110)",
                              "label": "Peak Euphoria",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Focus on the 'Jobs Plentiful' vs 'Jobs Hard to Get' differential inside the report; it is a stunningly accurate leading indicator for the official Unemployment Rate.",
          "dataSources": "The Conference Board",
          "updateFrequency": "Monthly",
          "confidenceImpact": "Moderate"
            },
{
          "id": "existing_home_sales",
          "title": "Existing Home Sales",
          "description": "Tracks the sales volume of previously owned homes, representing 90% of the US housing market and reflecting mortgage rate impacts.",
          "calculation": "Annualized rate of closed sales on existing single-family homes, condos, and co-ops.",
          "weight": "2.0% of Event Engine",
          "interpretation": "A freeze in existing home sales destroys mobility, trapping labor and halting derivative spending on home improvements and appliances.",
          "interpretationVisual": [
                    {
                              "range": "Collapsing Volume",
                              "label": "Market Locked/Frozen",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Steady Rate",
                              "label": "Normal Turnover",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Surging Volume",
                              "label": "Frenzy / Bidding Wars",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Existing home sales are recorded at closing, meaning the data reflects decisions made 30-60 days ago. It is a coincident, not leading, indicator.",
          "dataSources": "National Association of Realtors (NAR)",
          "updateFrequency": "Monthly",
          "confidenceImpact": "Low"
            },
{
          "id": "new_home_sales",
          "title": "New Home Sales",
          "description": "Measures sales of newly built homes, representing the margin of growth for homebuilders and acting as an excellent leading economic indicator.",
          "calculation": "Annualized rate of newly constructed homes with signed contracts.",
          "weight": "2.5% of Event Engine",
          "interpretation": "Because these are recorded at contract signing (not closing), they provide a highly real-time pulse of buyer demand in the face of current mortgage rates.",
          "interpretationVisual": [
                    {
                              "range": "Sharp Contraction",
                              "label": "Builder Panic Imminent",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Plateau",
                              "label": "Incentive-Driven Stability",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Breakout Highs",
                              "label": "Demographic Demand Surge",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "If new home sales remain strong while existing home sales collapse, it means homebuilders are aggressively buying down mortgage rates to move inventory.",
          "dataSources": "US Census Bureau",
          "updateFrequency": "Monthly",
          "confidenceImpact": "Moderate"
            },
{
          "id": "building_permits",
          "title": "Building Permits",
          "description": "Authorizations for new construction, serving as the ultimate forward-looking barometer for the massive housing construction sector.",
          "calculation": "Total number of authorized residential building permits.",
          "weight": "3.0% of Event Engine",
          "interpretation": "Permits lead starts. If permits fall off a cliff, massive construction layoffs are mathematically guaranteed 6-9 months later.",
          "interpretationVisual": [
                    {
                              "range": "Sustained Decline",
                              "label": "Pipeline Drying Up",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Flattening",
                              "label": "Developers Hesitant",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Strong Surge",
                              "label": "Pipeline Expanding",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Focus strictly on single-family permits. Multi-family (apartment) permits are notoriously volatile and can distort the headline number.",
          "dataSources": "US Census Bureau",
          "updateFrequency": "Monthly",
          "confidenceImpact": "High"
            },
{
          "id": "eia_crude_inventories",
          "title": "Crude Oil Inventories (EIA)",
          "description": "Weekly measurement of the change in the number of barrels of commercial crude oil held by US firms, dictating energy market volatility.",
          "calculation": "Headline build or draw in crude barrels vs consensus estimates.",
          "weight": "3.5% of Event Engine",
          "interpretation": "A massive unexpected build implies demand destruction (bearish oil). A massive unexpected draw implies supply tightness (bullish oil, inflationary).",
          "interpretationVisual": [
                    {
                              "range": "Massive Unexpected Draw",
                              "label": "Supply Crunch (Inflationary)",
                              "color": "text-red-500"
                    },
                    {
                              "range": "In-line with API",
                              "label": "Priced In",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Massive Unexpected Build",
                              "label": "Demand Destruction",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Look past the headline crude number and check the 'Gasoline Inventories' line item. If crude draws but gasoline builds massively, oil will sell off anyway because the end-consumer isn't driving.",
          "dataSources": "Energy Information Administration",
          "updateFrequency": "Weekly (Wednesdays)",
          "confidenceImpact": "Moderate"
            },
{
          "id": "ecb_rate_decision",
          "title": "European Central Bank (ECB) Rate Decision",
          "description": "Monetary policy decision setting the benchmark rates for the Eurozone, heavily influencing the EUR/USD pair and the DXY.",
          "calculation": "Main Refinancing Rate and Deposit Facility Rate adjustments.",
          "weight": "4.5% of Event Engine",
          "interpretation": "If the ECB hikes aggressively while the Fed pauses, the Euro strengthens, crushing the DXY, which in turn acts as a massive tailwind for US tech stocks.",
          "interpretationVisual": [
                    {
                              "range": "Dovish Divergence (Cutting)",
                              "label": "Euro Collapse / King Dollar",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Matching Fed Moves",
                              "label": "Status Quo",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Hawkish Surprise",
                              "label": "Euro Surge / Dollar Weakness",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Christine Lagarde's press conference is just as volatile as Powell's. Trading the ECB decision is effectively a backdoor way to trade US equities via the DXY transmission mechanism.",
          "dataSources": "European Central Bank",
          "updateFrequency": "Every 6 Weeks",
          "confidenceImpact": "High"
            },
{
          "id": "boj_rate_decision",
          "title": "Bank of Japan (BOJ) Rate Decision",
          "description": "Historically the anchor of zero-interest-rate policy, making any shift in BOJ policy a systemic shock to global bond markets.",
          "calculation": "Short-term policy rate and Yield Curve Control (YCC) band adjustments.",
          "weight": "5.0% of Event Engine",
          "interpretation": "A surprise widening of the BOJ yield curve cap causes Japanese capital to instantly repatriate, spiking global bond yields and triggering brutal equity selloffs.",
          "interpretationVisual": [
                    {
                              "range": "YCC Abandoned / Hawkish",
                              "label": "Global Margin Call",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Minor YCC Tweak",
                              "label": "Warning Shot",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Ultra-Dovish Maintained",
                              "label": "Free Money Continues",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "The BOJ is notorious for leaking decisions to the Nikkei newspaper at 1:00 AM EST. If you see USD/JPY violently flash crash in the middle of the night, the BOJ just hiked.",
          "dataSources": "Bank of Japan",
          "updateFrequency": "8 Times a Year",
          "confidenceImpact": "Absolute"
            },
{
          "id": "boe_rate_decision",
          "title": "Bank of England (BOE) Rate Decision",
          "description": "Sets monetary policy for the UK, serving as a bellwether for stagflation risks across developed western economies.",
          "calculation": "Bank Rate decision and Monetary Policy Committee voting split.",
          "weight": "2.5% of Event Engine",
          "interpretation": "The UK often acts as the canary in the coal mine for stagflation. A forced BOE pivot to save their pension system (LDI crisis) is a blueprint for future Fed actions.",
          "interpretationVisual": [
                    {
                              "range": "Forced Dovish Pivot",
                              "label": "Systemic Breakage Uncovered",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Standard Hike",
                              "label": "Fighting Sticky Inflation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Emergency Support Interventions",
                              "label": "Global Contagion Risk",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "Watch the vote split (e.g., 6-3). If the dissenters are voting for rate cuts while the majority holds, a dovish pivot is highly probable at the next meeting.",
          "dataSources": "Bank of England",
          "updateFrequency": "8 Times a Year",
          "confidenceImpact": "Moderate"
            },
{
          "id": "opec_meetings",
          "title": "OPEC+ Production Meetings",
          "description": "Gatherings of the cartel that controls over 40% of global crude oil production, capable of weaponizing energy supplies.",
          "calculation": "Agreed upon quotas for barrel per day (bpd) output cuts or increases.",
          "weight": "4.0% of Event Engine",
          "interpretation": "Surprise production cuts immediately spike oil prices, reviving inflationary fears and forcing central banks into a hawkish corner.",
          "interpretationVisual": [
                    {
                              "range": "Surprise Aggressive Cuts",
                              "label": "Inflationary Shock",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Rollover Current Quotas",
                              "label": "Market Stability",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Surprise Production Increase",
                              "label": "Deflationary Relief",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "OPEC headlines often leak hours before the official statement via 'delegates'. Oil futures will front-run the official press release on these rumors.",
          "dataSources": "OPEC Secretariat",
          "updateFrequency": "Biannual (Plus Emergency Meetings)",
          "confidenceImpact": "High"
            },
{
          "id": "corporate_earnings_tech",
          "title": "Corporate Earnings (Big Tech)",
          "description": "Quarterly earnings reports from the 'Magnificent Seven' (Apple, Microsoft, Nvidia, etc.) which command massive weightings in the S&P 500 and Nasdaq.",
          "calculation": "EPS beats, Revenue growth, and Forward Guidance.",
          "weight": "8.5% of Event Engine",
          "interpretation": "These 7 stocks ARE the market. If Big Tech guides revenues down, the entire index will collapse regardless of what macroeconomic data says.",
          "interpretationVisual": [
                    {
                              "range": "Guidance Slashed",
                              "label": "Index Meltdown",
                              "color": "text-red-500"
                    },
                    {
                              "range": "In-line / Choppy",
                              "label": "Volatility Crush",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "AI Capex / Guidance Raised",
                              "label": "Melt-Up Engine",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "The trailing EPS does not matter. The only sentence that dictates the after-hours stock move is the CEO's forward guidance on the earnings call.",
          "dataSources": "SEC Filings, Investor Relations",
          "updateFrequency": "Quarterly",
          "confidenceImpact": "Absolute"
            },
{
          "id": "corporate_earnings_banks",
          "title": "Corporate Earnings (Banks)",
          "description": "Reports from JPMorgan, BofA, Citi, and Wells Fargo, kicking off earnings season and revealing the health of the credit plumbing.",
          "calculation": "Net Interest Margin, Loan Loss Provisions, and Deposit Flight.",
          "weight": "5.5% of Event Engine",
          "interpretation": "Banks provide a direct window into consumer health and corporate default rates. Surging loan loss provisions indicate Wall Street is bracing for a recession.",
          "interpretationVisual": [
                    {
                              "range": "Massive Loan Loss Provisions",
                              "label": "Recession Preparation",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Stable Deposits/Margins",
                              "label": "Soft Landing Validated",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Bank Run / Deposit Flight",
                              "label": "Systemic Crisis",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "When analyzing bank earnings, prioritize Net Interest Income (NII) guidance. If banks forecast shrinking NII, it means they are forced to pay depositors more, squeezing their margins.",
          "dataSources": "SEC Filings, Bank PRs",
          "updateFrequency": "Quarterly",
          "confidenceImpact": "High"
            },
{
          "id": "quadruple_witching",
          "title": "Quadruple Witching (OpEx)",
          "description": "The simultaneous expiration of stock index futures, stock index options, stock options, and single stock futures, occurring four times a year.",
          "calculation": "Expiration and roll-over of trillions in derivative notional value.",
          "weight": "6.5% of Event Engine",
          "interpretation": "Generates massive, completely fundamental-agnostic volatility. Dealers rebalancing their gamma exposures can cause violent 50-point S&P swings into the final hour.",
          "interpretationVisual": [
                    {
                              "range": "Heavy Put Wall Defense",
                              "label": "Violent Reversals",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Symmetric Open Interest",
                              "label": "Pinned to Max Pain",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Heavy Call Wall Roll",
                              "label": "Unrestricted Melt-Up",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Markets typically drift toward the 'Max Pain' strike price in the week leading up to OpEx, as market makers hedge to ensure options expire worthless.",
          "dataSources": "Options Clearing Corporation (OCC)",
          "updateFrequency": "Quarterly (3rd Friday of Mar, Jun, Sep, Dec)",
          "confidenceImpact": "Absolute"
            },
{
          "id": "vix_expiration",
          "title": "VIX Expiration Dates",
          "description": "The monthly settlement of VIX futures and options contracts, known for mechanically suppressing or releasing equity volatility.",
          "calculation": "Morning settlement (VRO) based on opening prices of SPX options.",
          "weight": "5.0% of Event Engine",
          "interpretation": "A heavy concentration of VIX put options keeps volatility artificially suppressed (propping up equities). Once expiration passes, the 'volatility dampener' is removed.",
          "interpretationVisual": [
                    {
                              "range": "Post-Expiration Unwind",
                              "label": "Volatility Window Opens",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Pre-Expiration Pinning",
                              "label": "Artificially Suppressed Volatility",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "VIX Call Squeeze",
                              "label": "Cascading Equity Selloff",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "The 'Window of Weakness' for the stock market is historically highest in the 3 days immediately following a monthly VIX expiration, as dealer hedging flows reset.",
          "dataSources": "CBOE",
          "updateFrequency": "Monthly (Wednesday)",
          "confidenceImpact": "High"
            },
{
          "id": "debt_ceiling_deadlines",
          "title": "Debt Ceiling Deadlines",
          "description": "Political showdowns over raising the US borrowing limit. A failure to raise it results in a technical default on US Treasuries.",
          "calculation": "The 'X-Date' projected by the Treasury when extraordinary measures run out.",
          "weight": "3.5% of Event Engine",
          "interpretation": "Mostly political theater, but as the X-Date approaches, short-term T-bill yields spike violently and equity risk premiums soar due to accident risk.",
          "interpretationVisual": [
                    {
                              "range": "X-Date Imminent (No Deal)",
                              "label": "Catastrophic Risk Premia",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Negotiations Ongoing",
                              "label": "Headline Choppiness",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Deal Reached / Passed",
                              "label": "TGA Refill (Liquidity Drain)",
                              "color": "text-red-500"
                    }
          ],
          "proTip": "The real market danger is not the default itself (which is resolved), but the aftermath: the Treasury must issue $1T+ in new debt to refill the TGA, sucking massive liquidity out of stocks.",
          "dataSources": "US Treasury, CBO",
          "updateFrequency": "Episodic (Every 1-2 Years)",
          "confidenceImpact": "High"
            },
{
          "id": "geopolitical_escalations",
          "title": "Geopolitical Escalations (War)",
          "description": "Unpredictable tail-risk events involving military conflict, nuclear threats, or blockades of critical global chokepoints (e.g., Strait of Hormuz).",
          "calculation": "Real-time news flow regarding military mobilization or infrastructure attacks.",
          "weight": "4.0% of Event Engine",
          "interpretation": "Causes immediate algorithmic panic selling. Capital violently rotates out of risk assets and into Gold, the US Dollar, and Defense stocks.",
          "interpretationVisual": [
                    {
                              "range": "Direct Superpower Conflict",
                              "label": "Market Circuit Breakers",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Proxy Escalation",
                              "label": "Energy Supply Shock",
                              "color": "text-red-500"
                    },
                    {
                              "range": "De-escalation / Ceasefire",
                              "label": "Relief Rally / Gold Dump",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Unless the conflict directly removes millions of barrels of oil from the market or destroys semiconductor fabs, the equity market typically prices in the worst-case scenario within 48 hours and bottoms.",
          "dataSources": "OSINT, Reuters, Bloomberg Terminal",
          "updateFrequency": "Unpredictable / Black Swan",
          "confidenceImpact": "Absolute"
            },
{
          "id": "presidential_elections",
          "title": "Presidential Elections",
          "description": "The quadrennial US election cycle, dictating future corporate tax rates, regulatory regimes, and fiscal deficit trajectories.",
          "calculation": "Electoral college polling, prediction markets, and eventual ballot results.",
          "weight": "4.0% of Event Engine",
          "interpretation": "Markets hate uncertainty. Volatility stays elevated leading into November. Once the winner is declared, a massive 'uncertainty removal' relief rally almost always follows.",
          "interpretationVisual": [
                    {
                              "range": "Contested Election / Recounts",
                              "label": "Prolonged Volatility",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Gridlock (Divided Gov)",
                              "label": "Goldilocks for Equities",
                              "color": "text-emerald-500"
                    },
                    {
                              "range": "Sweep (Unified Gov)",
                              "label": "Sector Specific Rotations",
                              "color": "text-yellow-500"
                    }
          ],
          "proTip": "Wall Street actually prefers a divided government (e.g., Dem President, GOP Congress) because it guarantees legislative gridlock, meaning no sweeping tax hikes or radical regulations can pass.",
          "dataSources": "PredictIt, Polling Aggregates",
          "updateFrequency": "Every 4 Years (November)",
          "confidenceImpact": "High"
            }
        ]
    },

    // --- 7. WALLET ---
    wallet: {
        title: "Risk Management (Wallet)",
        description: "The mathematical framework governing capital preservation and position sizing.",
        topics: [
{
          "id": "kelly_criterion",
          "title": "Kelly Criterion",
          "description": "A mathematical formula used to determine the optimal sizing of a series of trades to maximize compound growth rate while avoiding ruin.",
          "calculation": "f* = W - [(1 - W) / R], where W is winning probability and R is the win/loss ratio.",
          "weight": "Core Position Sizing",
          "interpretation": "Use fractional Kelly (e.g., half-Kelly) to smooth volatility. Never exceed full Kelly as it introduces extreme drawdown risk.",
          "interpretationVisual": [
                    {
                              "range": "> Full Kelly",
                              "label": "Ruin Risk High",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Full Kelly",
                              "label": "Max Volatility",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Half Kelly",
                              "label": "Optimal Compound",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Input assumptions for win rate and payoff should always be stress-tested downwards to avoid over-betting.",
          "dataSources": "Historical Trade Log",
          "updateFrequency": "Quarterly",
          "confidenceImpact": "High"
            },
{
          "id": "risk_of_ruin",
          "title": "Risk of Ruin",
          "description": "The statistical probability that a trader will lose their entire trading capital, rendering them unable to continue trading.",
          "calculation": "Probability of ruin = ((1 - Edge) / (1 + Edge)) ^ Capital Units.",
          "weight": "Survival Metric",
          "interpretation": "Maintain capital units high enough and bet size low enough that the risk of ruin approaches absolute zero.",
          "interpretationVisual": [
                    {
                              "range": "> 5% Probability",
                              "label": "Terminal Danger",
                              "color": "text-red-500"
                    },
                    {
                              "range": "1% - 5% Probability",
                              "label": "Warning Level",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "< 1% Probability",
                              "label": "Sustainable",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Risk of ruin is exponential, not linear. Doubling your risk per trade more than quadruples your risk of blowing the account.",
          "dataSources": "Drawdown Curve",
          "updateFrequency": "Monthly",
          "confidenceImpact": "Absolute"
            },
{
          "id": "expected_value",
          "title": "Expected Value (EV)",
          "description": "The anticipated average value for a given investment at some point in the future based on probabilities of different outcomes.",
          "calculation": "EV = (Probability of Win * Average Win) - (Probability of Loss * Average Loss).",
          "weight": "Strategy Validator",
          "interpretation": "Only execute trades with a positive expected value. A negative EV guarantees long-term depletion of capital.",
          "interpretationVisual": [
                    {
                              "range": "Negative EV",
                              "label": "Guaranteed Drain",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Break-even EV",
                              "label": "Stagnant",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Positive EV",
                              "label": "Profitable Edge",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "A high win rate with negative EV is the most common trap for novice traders. Focus on the EV, not the win rate.",
          "dataSources": "Forward Projections / Backtests",
          "updateFrequency": "Weekly",
          "confidenceImpact": "Absolute"
            },
{
          "id": "maximum_drawdown",
          "title": "Maximum Drawdown (MDD)",
          "description": "The maximum observed loss from a peak to a trough of a portfolio, before a new peak is attained.",
          "calculation": "(Trough Value - Peak Value) / Peak Value.",
          "weight": "Capital Preservation",
          "interpretation": "If MDD exceeds your psychological threshold or systemic limit, halve position sizes immediately.",
          "interpretationVisual": [
                    {
                              "range": "> 20% Drawdown",
                              "label": "Crisis Mode",
                              "color": "text-red-500"
                    },
                    {
                              "range": "10% - 20% Drawdown",
                              "label": "Cautionary Range",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "< 10% Drawdown",
                              "label": "Normal Variance",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Recovery from drawdown requires exponential gains. A 50% drawdown requires a 100% gain just to get back to break-even.",
          "dataSources": "Equity Curve",
          "updateFrequency": "Daily",
          "confidenceImpact": "High"
            },
{
          "id": "win_rate_vs_risk_reward",
          "title": "Win Rate vs. Risk-Reward",
          "description": "The inverse relationship between how often a strategy wins and the magnitude of the wins relative to losses.",
          "calculation": "Required Win Rate for Break-Even = 1 / (1 + Risk/Reward Ratio).",
          "weight": "Performance Matrix",
          "interpretation": "Ensure your empirical win rate is at least 10-15% higher than your break-even win rate to account for slippage and errors.",
          "interpretationVisual": [
                    {
                              "range": "Below Break-Even",
                              "label": "Unsustainable",
                              "color": "text-red-500"
                    },
                    {
                              "range": "At Break-Even",
                              "label": "Treading Water",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Above Break-Even",
                              "label": "Compounding Edge",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Trend following systems often thrive on a 35% win rate and 1:3 RR, while mean reversion thrives on 70% win rate and 1:1 RR.",
          "dataSources": "Performance Dashboard",
          "updateFrequency": "Weekly",
          "confidenceImpact": "High"
            },
{
          "id": "fixed_fractional_sizing",
          "title": "Fixed Fractional Sizing",
          "description": "Risking a strict, predefined percentage of total capital on any single trade.",
          "calculation": "Position Size = (Account Balance * Risk %) / (Entry Price - Stop Loss Price).",
          "weight": "Core Principle",
          "interpretation": "Stick to 1-2% risk per trade. This allows survival through standard statistical losing streaks.",
          "interpretationVisual": [
                    {
                              "range": "> 3% Risk",
                              "label": "Reckless Risk",
                              "color": "text-red-500"
                    },
                    {
                              "range": "2% - 3% Risk",
                              "label": "Aggressive",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "1% - 2% Risk",
                              "label": "Disciplined",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "As capital grows, decrease your fractional percentage. A 2% risk on a $10k account feels different than 2% on a $1M account.",
          "dataSources": "Account Balance",
          "updateFrequency": "Per Trade",
          "confidenceImpact": "Absolute"
            },
{
          "id": "volatility_adjusted_position_sizing",
          "title": "Volatility Adjusted Position Sizing",
          "description": "Normalizing position sizes based on the inherent volatility of the underlying asset so risk remains constant.",
          "calculation": "Position Size = (Capital * Risk %) / (ATR * Multiplier).",
          "weight": "Advanced Risk Metric",
          "interpretation": "Scale down position sizes in highly volatile instruments. Scale up in low volatility environments to equalize dollar risk.",
          "interpretationVisual": [
                    {
                              "range": "Disregarded Volatility",
                              "label": "Oversized Risk",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Partially Adjusted",
                              "label": "Unbalanced",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "ATR Adjusted",
                              "label": "Risk Parity",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Use a 14-period ATR for standard normalization, but consider implied volatility (IV) for options trading to anticipate future expansion.",
          "dataSources": "ATR Indicator / IV Rank",
          "updateFrequency": "Per Trade",
          "confidenceImpact": "High"
            },
{
          "id": "beta_weighted_portfolio_delta",
          "title": "Beta-Weighted Portfolio Delta",
          "description": "Measuring the total directional exposure of a portfolio by standardizing all positions against a benchmark index.",
          "calculation": "Beta-Weighted Delta = Position Delta * (Position Price / Benchmark Price) * Position Beta.",
          "weight": "Macro Exposure",
          "interpretation": "Keep portfolio delta aligned with your broader market bias. Hedge if delta exceeds acceptable directional risk.",
          "interpretationVisual": [
                    {
                              "range": "Extreme Unhedged Delta",
                              "label": "Directional Danger",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Slightly Skewed Delta",
                              "label": "Directional Bias",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Beta-Neutral",
                              "label": "Hedged/Neutral",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "A beta-neutral portfolio minimizes market risk but relies entirely on alpha generation (stock picking or premium selling).",
          "dataSources": "Broker Risk Platform",
          "updateFrequency": "Daily",
          "confidenceImpact": "Moderate"
            },
{
          "id": "asymmetric_risk_reward",
          "title": "Asymmetric Risk-Reward",
          "description": "Seeking trades where the potential upside massively outweighs the predefined downside.",
          "calculation": "Potential Profit / Maximum Loss >= 3:1.",
          "weight": "Setup Qualifier",
          "interpretation": "Reject setups that do not offer at least a 2:1 or 3:1 asymmetric payoff. It buys you the right to be wrong often.",
          "interpretationVisual": [
                    {
                              "range": "1:1 or Less",
                              "label": "Symmetric/Poor",
                              "color": "text-red-500"
                    },
                    {
                              "range": "2:1",
                              "label": "Acceptable",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "3:1+",
                              "label": "Highly Asymmetric",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Options provide structurally asymmetric profiles. Buying out-of-the-money leaps offers defined risk with uncapped convexity.",
          "dataSources": "Chart Setup / Options Pricing",
          "updateFrequency": "Pre-Trade Setup",
          "confidenceImpact": "High"
            },
{
          "id": "stop_loss_placement_atr",
          "title": "Stop Loss Placement (ATR Based)",
          "description": "Setting stop losses outside of normal market noise to avoid being stopped out prematurely.",
          "calculation": "Stop Loss = Entry Price +/- (ATR * Multiplier, usually 1.5 to 2).",
          "weight": "Tactical Execution",
          "interpretation": "Ensure your stop is placed at a technical invalidation level that is also mathematically beyond random daily noise.",
          "interpretationVisual": [
                    {
                              "range": "< 1 ATR",
                              "label": "Noise Stop (Too Tight)",
                              "color": "text-red-500"
                    },
                    {
                              "range": "1 to 1.5 ATR",
                              "label": "Standard Stop",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 1.5 ATR",
                              "label": "Structural Stop",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "If an ATR-based stop is too wide and ruins the risk/reward, the trade is structurally invalid. Pass on the trade.",
          "dataSources": "Average True Range",
          "updateFrequency": "Pre-Trade Setup",
          "confidenceImpact": "High"
            },
{
          "id": "trailing_stops_chandelier_exit",
          "title": "Trailing Stops (Chandelier Exit)",
          "description": "A dynamic stop loss system that hangs a trailing stop at a multiple of ATR from the highest high since entry.",
          "calculation": "Chandelier Exit (Long) = Highest High in Trade - (ATR * Multiplier).",
          "weight": "Trade Management",
          "interpretation": "Use trailing stops to let winning trades run without imposing arbitrary price targets.",
          "interpretationVisual": [
                    {
                              "range": "Manual Tightening",
                              "label": "Choking Trade",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Static Stop",
                              "label": "No Profit Protection",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Chandelier Trailing",
                              "label": "Trend Captured",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Only engage the trailing stop after the trade has moved in your favor by at least 1R to avoid prematurely killing the trade.",
          "dataSources": "Indicator (Chandelier)",
          "updateFrequency": "Daily / Hourly",
          "confidenceImpact": "Moderate"
            },
{
          "id": "time_based_stops",
          "title": "Time-Based Stops",
          "description": "Exiting a trade if it fails to move in the anticipated direction within a predetermined time window.",
          "calculation": "If Trade Duration > X Bars without breaking Entry Price, Exit.",
          "weight": "Capital Efficiency",
          "interpretation": "Dead money is risk. If the catalyst fails to produce immediate momentum, cut the trade and free up capital.",
          "interpretationVisual": [
                    {
                              "range": "Holding Dead Weight",
                              "label": "Hope Mode",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Monitoring Duration",
                              "label": "Awareness",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Time-Stop Executed",
                              "label": "Capital Freed",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Particularly crucial in options trading where theta (time decay) actively works against long premium positions.",
          "dataSources": "Bar Count / Time in Trade",
          "updateFrequency": "Continuous",
          "confidenceImpact": "High"
            },
{
          "id": "mental_stops_vs_hard_stops",
          "title": "Mental Stops vs Hard Stops",
          "description": "The difference between resting a physical stop order with the broker versus executing it manually when a level is breached.",
          "calculation": "Compare Slippage of Market Stop vs Execution Rate of Mental Stop.",
          "weight": "Execution Discipline",
          "interpretation": "Only professional traders with iron discipline should use mental stops. All others must use hard stops to prevent catastrophic loss.",
          "interpretationVisual": [
                    {
                              "range": "Mental Stop Ignored",
                              "label": "Account Blowout Risk",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Mental Stop Executed",
                              "label": "Subjective Risk",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Hard Stop Placed",
                              "label": "Systematic Defense",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Flash crashes hunt mental stops. If you use a mental stop, pair it with a catastrophic hard stop 20% lower.",
          "dataSources": "Order Book",
          "updateFrequency": "Pre-Trade Execution",
          "confidenceImpact": "Absolute"
            },
{
          "id": "scaling_in",
          "title": "Scaling In (Pyramiding)",
          "description": "Adding to a winning position as it moves in your favor, increasing size while trailing stops to mitigate overall risk.",
          "calculation": "Add 50% of initial size upon break of structural high, move stop of original position to break-even.",
          "weight": "Profit Maximization",
          "interpretation": "Never add to a losing position. Only scale into trades that have proven your thesis correct.",
          "interpretationVisual": [
                    {
                              "range": "Adding to Loser",
                              "label": "Averaging Down (Toxic)",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Single Entry",
                              "label": "Standard Sizing",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Pyramiding Winner",
                              "label": "Asymmetric Upside",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Ensure that the average price of your scaled position always remains below current market price by a comfortable margin.",
          "dataSources": "Price Action",
          "updateFrequency": "Mid-Trade",
          "confidenceImpact": "High"
            },
{
          "id": "scaling_out",
          "title": "Scaling Out (Taking Partial Profits)",
          "description": "Selling fractions of a position at predetermined targets to lock in gains and fund the risk of holding the remainder.",
          "calculation": "Sell 50% at 1:2 Risk/Reward, let remainder run risk-free.",
          "weight": "Psychological Buffer",
          "interpretation": "Use partial profits to guarantee the trade cannot be a loser, easing the psychological pressure of riding trends.",
          "interpretationVisual": [
                    {
                              "range": "All or Nothing",
                              "label": "High Stress",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Random Exits",
                              "label": "Unstructured",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Systematic Scaling",
                              "label": "Stress-Free Hold",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "While mathematically scaling out can reduce overall EV on massive trend followers, it drastically improves trader consistency.",
          "dataSources": "Profit Targets",
          "updateFrequency": "Mid-Trade",
          "confidenceImpact": "Moderate"
            },
{
          "id": "margin_call_thresholds",
          "title": "Margin Call Thresholds",
          "description": "The equity level at which a broker demands additional capital or forcibly liquidates positions to cover leveraged losses.",
          "calculation": "Maintenance Margin Requirement vs Total Account Equity.",
          "weight": "Catastrophic Risk",
          "interpretation": "Maintain a cash buffer vastly larger than your maintenance margin to survive gap downs without liquidation.",
          "interpretationVisual": [
                    {
                              "range": "< 10% Margin Buffer",
                              "label": "Imminent Liquidation",
                              "color": "text-red-500"
                    },
                    {
                              "range": "10% - 30% Margin Buffer",
                              "label": "Danger Zone",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 50% Margin Buffer",
                              "label": "Safe Liquidity",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Brokers can and will increase margin requirements arbitrarily overnight during volatile periods. Anticipate this.",
          "dataSources": "Broker Margin Window",
          "updateFrequency": "Daily",
          "confidenceImpact": "Absolute"
            },
{
          "id": "effective_leverage_ratio",
          "title": "Effective Leverage Ratio",
          "description": "The true measure of leverage, calculating total notional exposure compared to actual account equity.",
          "calculation": "Effective Leverage = Total Notional Value of Positions / Account Equity.",
          "weight": "Macro Exposure",
          "interpretation": "Keep effective leverage below 3:1 for retail accounts to avoid systemic wipeouts during macro shocks.",
          "interpretationVisual": [
                    {
                              "range": "> 5:1 Leverage",
                              "label": "Highly Overleveraged",
                              "color": "text-red-500"
                    },
                    {
                              "range": "3:1 to 5:1",
                              "label": "Elevated Risk",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "< 3:1 Leverage",
                              "label": "Sustainable Sizing",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Notional value of options requires calculating the delta-adjusted notional, not just the premium paid.",
          "dataSources": "Portfolio Aggregation",
          "updateFrequency": "Daily",
          "confidenceImpact": "High"
            },
{
          "id": "correlation_risk_matrix",
          "title": "Correlation Risk Matrix",
          "description": "Analyzing how different positions in the portfolio move in relation to one another to identify hidden concentrated risk.",
          "calculation": "Pearson correlation coefficient between pairs of assets (-1 to 1).",
          "weight": "Portfolio Defense",
          "interpretation": "Do not hold highly correlated assets in the same direction. Three 1% risk trades in correlated tech stocks is actually one 3% risk trade.",
          "interpretationVisual": [
                    {
                              "range": "> 0.8 Correlation",
                              "label": "Redundant Risk",
                              "color": "text-red-500"
                    },
                    {
                              "range": "0.3 to 0.8",
                              "label": "Moderate Overlap",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "< 0.3 or Negative",
                              "label": "Diversified",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "During a market crash, all correlations go to 1. Diversification fails exactly when you need it most unless using inverse assets.",
          "dataSources": "Correlation Matrix Tool",
          "updateFrequency": "Weekly",
          "confidenceImpact": "High"
            },
{
          "id": "tail_risk_hedging",
          "title": "Tail Risk Hedging",
          "description": "Purchasing protection against extreme, low-probability but high-impact market events.",
          "calculation": "Dedicate 0.5% - 1% of portfolio to buying deep OTM options expiring in 60-90 days.",
          "weight": "Catastrophic Defense",
          "interpretation": "Treat this as an insurance premium. Expect it to lose money 95% of the time, but save the portfolio 5% of the time.",
          "interpretationVisual": [
                    {
                              "range": "Unhedged Portfolio",
                              "label": "Exposed to Black Swans",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Dynamic Hedging",
                              "label": "Partial Protection",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Systematic Tail Hedge",
                              "label": "Insured",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Roll hedges when VIX is low (cheap protection), take profits on hedges aggressively during spikes to fund the portfolio.",
          "dataSources": "VIX, Options Chain",
          "updateFrequency": "Monthly",
          "confidenceImpact": "Moderate"
            },
{
          "id": "black_swan_protection",
          "title": "Black Swan Protection (OTM Puts)",
          "description": "Specific deployment of Out-Of-The-Money puts to act as a convex payoff vehicle during unpredictable market crashes.",
          "calculation": "Allocate fixed budget to 10-delta index puts, rolling them mechanically.",
          "weight": "Catastrophic Defense",
          "interpretation": "Do not attempt to time black swans. Keep the protection running systematically as a cost of doing business.",
          "interpretationVisual": [
                    {
                              "range": "No Protection",
                              "label": "Fragile",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Sporadic Puts",
                              "label": "Timing Risk",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Constant Tail Puts",
                              "label": "Antifragile",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "A true black swan creates a volatility expansion so massive that IV crush on the rebound will destroy the value of puts quickly. Monetize fast.",
          "dataSources": "Options Pricing Model",
          "updateFrequency": "Monthly",
          "confidenceImpact": "High"
            },
{
          "id": "cash_as_a_position",
          "title": "Cash as a Position",
          "description": "Viewing uninvested capital not as 'idle' money, but as an active, deliberate portfolio allocation.",
          "calculation": "Cash Allocation % = Total Portfolio Value - Invested Value.",
          "weight": "Strategic Liquidity",
          "interpretation": "Cash is an option that never expires and has no theta decay. Hold it to capitalize on deep discounts during panic.",
          "interpretationVisual": [
                    {
                              "range": "0% Cash",
                              "label": "Illiquid / Trapped",
                              "color": "text-red-500"
                    },
                    {
                              "range": "10% - 20% Cash",
                              "label": "Operational Liquidity",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "> 20% Cash",
                              "label": "Strategic Reserve",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "When volatility spikes, margins expand. Cash is the only asset that allows you to buy the panic rather than being forced to sell it.",
          "dataSources": "Portfolio Balance",
          "updateFrequency": "Daily",
          "confidenceImpact": "High"
            },
{
          "id": "daily_loss_limit",
          "title": "Daily Loss Limit (Circuit Breaker)",
          "description": "A hard-coded maximum dollar or percentage loss permitted in a single trading day before trading is strictly halted.",
          "calculation": "Daily Halt = Max 2-3% of Total Capital.",
          "weight": "Behavioral Guardrail",
          "interpretation": "If the daily limit is hit, shut down the platform immediately. Walk away. No exceptions.",
          "interpretationVisual": [
                    {
                              "range": "Limit Breached, Still Trading",
                              "label": "Revenge/Tilt",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Approaching Limit",
                              "label": "Caution",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Limit Respected",
                              "label": "Discipline Intact",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Have your broker set a hard daily loss limit on the backend so that even if you lose discipline, the platform locks you out.",
          "dataSources": "Daily PnL",
          "updateFrequency": "Intraday",
          "confidenceImpact": "Absolute"
            },
{
          "id": "weekly_drawdown_limit",
          "title": "Weekly Drawdown Limit",
          "description": "A wider timeframe restriction to prevent a multi-day streak of poor performance from escalating into an unrecoverable loss.",
          "calculation": "Weekly Halt = Max 5-6% of Total Capital.",
          "weight": "Behavioral Guardrail",
          "interpretation": "Hitting the weekly limit implies your strategy is out of sync with the current market regime. Stop trading and review.",
          "interpretationVisual": [
                    {
                              "range": "Weekly Limit Breached",
                              "label": "System Failure",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Within Normal Variance",
                              "label": "Standard Operation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Positive Week",
                              "label": "Edge Realized",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Take the weekend off completely if this limit is hit. Do not look at charts until Sunday evening.",
          "dataSources": "Weekly PnL Tracker",
          "updateFrequency": "Weekly",
          "confidenceImpact": "Absolute"
            },
{
          "id": "max_open_positions",
          "title": "Max Open Positions",
          "description": "Capping the number of simultaneous active trades to preserve cognitive bandwidth and restrict aggregated risk.",
          "calculation": "Count(Active Positions) <= N (Usually 3 to 7 depending on style).",
          "weight": "Cognitive Management",
          "interpretation": "Never exceed your cognitive limit. Each position requires active monitoring and decision-making.",
          "interpretationVisual": [
                    {
                              "range": "> 7 Positions",
                              "label": "Attention Diluted",
                              "color": "text-red-500"
                    },
                    {
                              "range": "4 to 7 Positions",
                              "label": "Maximum Load",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "1 to 3 Positions",
                              "label": "Laser Focus",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Fewer positions with slightly larger size is almost always superior to dozens of tiny, unmanageable positions.",
          "dataSources": "Position Window",
          "updateFrequency": "Continuous",
          "confidenceImpact": "Moderate"
            },
{
          "id": "overnight_gap_risk",
          "title": "Overnight Gap Risk",
          "description": "The unhedgeable risk that an asset's price jumps significantly between market close and the next open, skipping stops.",
          "calculation": "Gap Risk = Position Size * Estimated Max Historic Gap %.",
          "weight": "Structural Risk",
          "interpretation": "Reduce size or use options (which have strictly defined risk) if carrying positions through earnings or major overnight news.",
          "interpretationVisual": [
                    {
                              "range": "Unprotected Earnings Hold",
                              "label": "Gambling",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Standard Overnight Hold",
                              "label": "Acceptable Risk",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Flat Intraday",
                              "label": "Zero Gap Risk",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Stops do not work on gaps. If a stock closes at $100 and opens at $80, your $95 stop loss executes at $80.",
          "dataSources": "Economic Calendar / Earnings Dates",
          "updateFrequency": "Daily Close",
          "confidenceImpact": "High"
            },
{
          "id": "weekend_hold_risk",
          "title": "Weekend Hold Risk",
          "description": "The magnified version of overnight gap risk spanning 48+ hours where geopolitical events can dramatically alter global markets.",
          "calculation": "Qualitative assessment of macro environment + Position sizing.",
          "weight": "Macro Exposure",
          "interpretation": "Only hold swing trades over the weekend that have significant profit cushions. Close borderline or red trades on Friday.",
          "interpretationVisual": [
                    {
                              "range": "Heavy Margin Hold",
                              "label": "Existential Threat",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Partial Hold",
                              "label": "Calculated Exposure",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Cash / Hedged",
                              "label": "Safe Weekend",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Geopolitical risk premium evaporates over weekends if nothing happens, crushing implied volatility. Trade options accordingly.",
          "dataSources": "News Feed / Macro Calendar",
          "updateFrequency": "Friday Close",
          "confidenceImpact": "Moderate"
            },
{
          "id": "slippage_commission_drag",
          "title": "Slippage & Commission Drag",
          "description": "The hidden friction costs of trading, where the executed price differs from expected, plus broker fees eating into edge.",
          "calculation": "Total Friction = (Expected Entry - Actual Entry) + Commissions per round trip.",
          "weight": "System Drain",
          "interpretation": "Trade highly liquid assets to minimize slippage. High-frequency systems require zero-commission models to survive.",
          "interpretationVisual": [
                    {
                              "range": "> 20% of Expected Profit",
                              "label": "Edge Eroded",
                              "color": "text-red-500"
                    },
                    {
                              "range": "5% - 20%",
                              "label": "Noticeable Drag",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "< 5%",
                              "label": "Efficient Execution",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Use limit orders for entry and market orders for emergency exits. Avoid trading illiquid penny stocks where slippage kills the entire RR.",
          "dataSources": "Trade Execution Log",
          "updateFrequency": "Monthly Review",
          "confidenceImpact": "Moderate"
            },
{
          "id": "tax_drag",
          "title": "Tax Drag (Short Term Capital Gains)",
          "description": "The reduction in compounded growth due to paying high short-term capital gains taxes on frequent trades.",
          "calculation": "Net Profit = Gross Profit * (1 - Tax Rate).",
          "weight": "Wealth Destruction",
          "interpretation": "Optimize for long-term holds or utilize tax-advantaged accounts (IRAs) for high-turnover strategies.",
          "interpretationVisual": [
                    {
                              "range": "Heavy Short-Term Churn",
                              "label": "Massive Tax Burden",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Section 1256 Contracts",
                              "label": "Optimized Rates",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Tax-Advantaged Account",
                              "label": "Zero Tax Drag",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Trading Futures or broad index options (SPX) often qualifies for the 60/40 tax rule, significantly lowering the tax burden compared to stocks.",
          "dataSources": "Tax Ledger",
          "updateFrequency": "Annually",
          "confidenceImpact": "High"
            },
{
          "id": "opportunity_cost_of_capital",
          "title": "Opportunity Cost of Capital",
          "description": "The return foregone by investing capital in an underperforming strategy instead of a baseline risk-free or index asset.",
          "calculation": "Cost = Active Strategy Return - (S&P 500 Return or Risk-Free Rate).",
          "weight": "Performance Baseline",
          "interpretation": "If your active trading system fails to beat an index fund over a 2-year period after taxes, stop trading and index your money.",
          "interpretationVisual": [
                    {
                              "range": "Underperforming SPY",
                              "label": "Wasted Effort",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Matching SPY",
                              "label": "Uncompensated Risk",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Beating SPY (Alpha)",
                              "label": "True Edge",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Calculate your hourly rate as a trader. If you spend 20 hours a week to beat the index by 1%, you are working for pennies.",
          "dataSources": "Benchmark Comparison",
          "updateFrequency": "Annually",
          "confidenceImpact": "Moderate"
            },
{
          "id": "sharpe_sortino_ratios",
          "title": "Sharpe & Sortino Ratios",
          "description": "Metrics measuring risk-adjusted return. Sharpe penalizes all volatility, while Sortino only penalizes downside volatility.",
          "calculation": "Sortino = (Expected Return - Risk-Free Rate) / Downside Deviation.",
          "weight": "Quality Validator",
          "interpretation": "Focus on the Sortino ratio. A high absolute return means nothing if the drawdown volatility is terrifying.",
          "interpretationVisual": [
                    {
                              "range": "Ratio < 1.0",
                              "label": "Poor Risk-Return",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Ratio 1.0 to 1.5",
                              "label": "Acceptable",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Ratio > 2.0",
                              "label": "Elite Performance",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Do not chase returns by adding leverage; instead, refine the system to improve the Sortino ratio, then safely lever the high-quality edge.",
          "dataSources": "Performance Analytics",
          "updateFrequency": "Quarterly",
          "confidenceImpact": "High"
            }
        ]
    },

    // --- 8. JOURNAL ---
    journal: {
        title: "Trading Psychology (Journal)",
        description: "Frameworks for emotional regulation, performance tracking, and behavioral self-correction.",
        topics: [
{
          "id": "fomo",
          "title": "FOMO (Fear of Missing Out)",
          "description": "The emotional urge to enter a trade late because price is moving rapidly, overriding systematic entry rules.",
          "calculation": "Action: Chasing green candles far away from moving averages or structural support.",
          "weight": "Psychological Vulnerability",
          "interpretation": "Recognize the physical sensation of urgency. Close the chart and walk away. There will always be another trade.",
          "interpretationVisual": [
                    {
                              "range": "Market Buy on Spikes",
                              "label": "Peak Retail Error",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Hesitation/Tension",
                              "label": "Emotional Warning",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Waiting for Pullbacks",
                              "label": "Professional Composure",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Institutions sell into FOMO candles to secure liquidity. When you chase, you are providing the exit liquidity for smart money.",
          "dataSources": "Heart Rate / Urgency Feeling",
          "updateFrequency": "Intraday",
          "confidenceImpact": "Absolute"
            },
{
          "id": "revenge_trading",
          "title": "Revenge Trading",
          "description": "Aggressively re-entering the market immediately after a loss to 'win back' capital, usually with doubled size or lower criteria.",
          "calculation": "Action: Trade Frequency spikes immediately following a Stop Out.",
          "weight": "Account Destroyer",
          "interpretation": "Implement a mandatory 15-minute screen lock or physical walk after any losing trade.",
          "interpretationVisual": [
                    {
                              "range": "Immediate Re-entry",
                              "label": "Tilt / Danger",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Frustration Building",
                              "label": "Elevated Risk",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Cool-off Period Taken",
                              "label": "Rationality Restored",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "The market doesn't know you lost money and doesn't owe it back. The next trade has a completely independent probability.",
          "dataSources": "Time Between Trades",
          "updateFrequency": "Intraday",
          "confidenceImpact": "Absolute"
            },
{
          "id": "overtrading_boredom",
          "title": "Overtrading / Boredom",
          "description": "Executing low-quality setups merely to feel the action of being in the market when no clear edge is present.",
          "calculation": "Action: Taking sub-optimal trades during lunch hour or low-volume chop zones.",
          "weight": "Capital Bleed",
          "interpretation": "Trading is 90% waiting. If bored, backtest, review journal, or step away. Do not pay the market for entertainment.",
          "interpretationVisual": [
                    {
                              "range": "Forcing Trades",
                              "label": "Gambling",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Restless Screen Watching",
                              "label": "Loss of Focus",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Patience Maintained",
                              "label": "Sniper Mentality",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Professional trading is profoundly boring. If it's exciting, you're likely gambling. Embrace the boredom of the process.",
          "dataSources": "Number of Trades / Chop Index",
          "updateFrequency": "Daily",
          "confidenceImpact": "High"
            },
{
          "id": "confirmation_bias",
          "title": "Confirmation Bias",
          "description": "Seeking out information, news, or indicators that support your existing position while ignoring glaring contradictory data.",
          "calculation": "Action: Scrolling Twitter/News specifically to find bullish sentiment when long.",
          "weight": "Analytical Blindspot",
          "interpretation": "Actively search for the 'bear case' for your bull positions. If you cannot invalidate their arguments, reconsider the trade.",
          "interpretationVisual": [
                    {
                              "range": "Ignoring Red Flags",
                              "label": "Delusion",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Skepticism",
                              "label": "Healthy Doubt",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Seeking Opposing Views",
                              "label": "Objective Analysis",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Formulate your thesis as an 'if/then' invalidation statement before entry to circumvent the ego's need to be right.",
          "dataSources": "News Diet / Divergent Indicators",
          "updateFrequency": "Pre-Trade",
          "confidenceImpact": "High"
            },
{
          "id": "process_vs_outcome",
          "title": "Process vs. Outcome",
          "description": "Judging the quality of a trade solely by whether it made money (outcome) rather than whether it followed the rules (process).",
          "calculation": "Action: Rewarding oneself for a winning trade that broke all entry rules.",
          "weight": "Core Philosophy",
          "interpretation": "A good trade that loses money is a success. A bad trade that makes money is toxic and builds destructive habits.",
          "interpretationVisual": [
                    {
                              "range": "Result-Oriented",
                              "label": "Luck Dependent",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Mixed Evaluation",
                              "label": "Inconsistent",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Process-Oriented",
                              "label": "Professional Framework",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Grade your trades on a scale of 1-10 based on rule execution, entirely blinding yourself to the PnL result during review.",
          "dataSources": "Trade Execution Scorecard",
          "updateFrequency": "Post-Trade",
          "confidenceImpact": "Absolute"
            },
{
          "id": "dopamine_loops",
          "title": "Dopamine Loops in Trading",
          "description": "The addiction to the intermittent variable rewards of trading, mimicking the neurological pathways of slot machines.",
          "calculation": "Action: Compulsively checking PnL on phone every 5 minutes.",
          "weight": "Neurological Trap",
          "interpretation": "Shift dopamine rewards away from PnL and towards executing your routine flawlessly. Delete mobile broker apps.",
          "interpretationVisual": [
                    {
                              "range": "Constant PnL Checking",
                              "label": "Addiction Cycle",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Occasional Checks",
                              "label": "Distracted",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Set and Forget",
                              "label": "Detached Automation",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Move your PnL display off your main screen or switch it to show points/ticks instead of dollar amounts to reduce emotional spiking.",
          "dataSources": "Screen Time Logs",
          "updateFrequency": "Continuous",
          "confidenceImpact": "High"
            },
{
          "id": "execution_hesitation",
          "title": "Execution Hesitation (Pulling the Trigger)",
          "description": "Freezing when an A+ setup appears due to fear of taking another loss, resulting in missing the best trades of the week.",
          "calculation": "Action: Missing entries and then watching the setup hit target perfectly.",
          "weight": "Performance Bottleneck",
          "interpretation": "If the rules align, you must execute. Reduce position size to 25% to bypass the amygdala fear response if necessary.",
          "interpretationVisual": [
                    {
                              "range": "Freezing/Skipping",
                              "label": "Paralyzed by Fear",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Late Entry",
                              "label": "Sub-optimal RR",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Instant Execution",
                              "label": "Systematic Trust",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Hesitation is a symptom of trading too large. The fear is not of being wrong, it's the fear of the financial impact of being wrong.",
          "dataSources": "Missed Trade Log",
          "updateFrequency": "Intraday",
          "confidenceImpact": "High"
            },
{
          "id": "sunk_cost_fallacy",
          "title": "The Sunk Cost Fallacy",
          "description": "Holding onto a losing trade because you have already invested so much time, emotion, or money into it.",
          "calculation": "Action: 'I'm down so much, I can't sell now. I'll just wait for it to bounce.'",
          "weight": "Cognitive Distortion",
          "interpretation": "The market does not care what your entry price was. Assess the position based entirely on current market structure.",
          "interpretationVisual": [
                    {
                              "range": "Holding the Bag",
                              "label": "Denial",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Hoping for Breakeven",
                              "label": "Trapped",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Objective Cut",
                              "label": "Capital Preserved",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Ask yourself: 'If I were in cash right now, would I buy this asset at this price?' If the answer is no, close the position.",
          "dataSources": "Open Loss Duration",
          "updateFrequency": "Daily",
          "confidenceImpact": "Absolute"
            },
{
          "id": "loss_aversion_bias",
          "title": "Loss Aversion Bias",
          "description": "The psychological phenomenon where the pain of losing money feels twice as intense as the pleasure of gaining the same amount.",
          "calculation": "Action: Taking quick profits prematurely while letting losses run to avoid realizing them.",
          "weight": "Account Destroyer",
          "interpretation": "Recognize that taking a small, planned loss is an act of professional risk management, not a personal failure.",
          "interpretationVisual": [
                    {
                              "range": "Choking Winners / Holding Losers",
                              "label": "Inverted Math",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Nervous Holds",
                              "label": "Emotional Bleed",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Letting Winners Run",
                              "label": "Mathematical Edge",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Reframe losses as business expenses. You wouldn't run a restaurant and refuse to pay for ingredients; a stop loss is the cost of inventory.",
          "dataSources": "Average Win vs Average Loss",
          "updateFrequency": "Weekly",
          "confidenceImpact": "High"
            },
{
          "id": "recency_bias",
          "title": "Recency Bias",
          "description": "Allowing the results of your most recent 2-3 trades to dictate your belief in your entire strategy.",
          "calculation": "Action: Abandoning a backtested system because it had three consecutive losers.",
          "weight": "Strategic Instability",
          "interpretation": "Look at your strategy across a block of 20 trades minimum. The last trade means absolutely nothing statistically.",
          "interpretationVisual": [
                    {
                              "range": "System Hopping",
                              "label": "Strategy Drift",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Doubt / Tweaking",
                              "label": "Curve Fitting",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Executing the Next 20",
                              "label": "Statistical Trust",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Review your large-sample equity curve whenever you feel the urge to change systems after a small losing streak.",
          "dataSources": "Trade Block Results (N=20)",
          "updateFrequency": "Post-Trade",
          "confidenceImpact": "High"
            },
{
          "id": "anchoring_to_entry_price",
          "title": "Anchoring to Entry Price",
          "description": "Making exit decisions based strictly on where you entered, rather than where the market structure dictates exits.",
          "calculation": "Action: Moving stop to breakeven prematurely just to 'feel safe'.",
          "weight": "Cognitive Distortion",
          "interpretation": "Manage the trade based on swing highs, lows, and volume nodes. The market does not respect your personal entry line.",
          "interpretationVisual": [
                    {
                              "range": "Premature BE Stops",
                              "label": "Choked Out",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Focusing on Cost Basis",
                              "label": "Irrelevant Data",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Structural Management",
                              "label": "Objective Reality",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Once you enter a trade, remove the entry line from your chart. Manage the position purely based on the raw candles.",
          "dataSources": "Chart Interaction",
          "updateFrequency": "Mid-Trade",
          "confidenceImpact": "Moderate"
            },
{
          "id": "endowment_effect",
          "title": "Endowment Effect",
          "description": "Irrational overvaluation of an asset simply because you own it.",
          "calculation": "Action: Defending a toxic stock to peers because it's sitting in your portfolio.",
          "weight": "Analytical Blindspot",
          "interpretation": "Maintain radical detachment. You rent assets to extract profit; you do not marry them.",
          "interpretationVisual": [
                    {
                              "range": "Tribalism / Cult Stocks",
                              "label": "Blind Devotion",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Overvaluing Fundamentals",
                              "label": "Bias",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Mercenary Mindset",
                              "label": "Fluid Capital",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Beware of joining specific stock communities or Discord channels dedicated to holding one asset. They breed the endowment effect.",
          "dataSources": "Social Media Activity",
          "updateFrequency": "Continuous",
          "confidenceImpact": "High"
            },
{
          "id": "gamblers_fallacy",
          "title": "Gambler's Fallacy",
          "description": "The false belief that past independent events affect future probabilities. 'I've had 5 losers in a row, a win is due.'",
          "calculation": "Action: Doubling position size after a streak of losses anticipating a 'sure thing'.",
          "weight": "Statistical Fallacy",
          "interpretation": "Each trade is an independent event. Treat a coin flip as 50/50, regardless of the last 10 flips.",
          "interpretationVisual": [
                    {
                              "range": "Martingale Sizing",
                              "label": "Ruin Protocol",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Expecting Reversal",
                              "label": "False Assumption",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Flat Sizing",
                              "label": "Mathematical Reality",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Streaks in trading last longer than your psychology expects. Trend systems often endure 8-10 losers in a row. Sizing must account for this.",
          "dataSources": "Win/Loss Streak Data",
          "updateFrequency": "Pre-Trade Sizing",
          "confidenceImpact": "Absolute"
            },
{
          "id": "hindsight_bias",
          "title": "Hindsight Bias",
          "description": "The illusion that past market movements were predictable or obvious after they have already occurred.",
          "calculation": "Action: Looking at yesterday's chart and thinking 'It was so obvious it was going to drop.'",
          "weight": "Learning Impediment",
          "interpretation": "Recognize that the right side of the chart is obscured. Stop beating yourself up for missing moves that look clear in retrospect.",
          "interpretationVisual": [
                    {
                              "range": "Self-Punishment",
                              "label": "Distorted Reality",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Assuming Predictability",
                              "label": "False Confidence",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Forward Testing Only",
                              "label": "Realistic Review",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "When journaling, only use screenshots taken at the exact moment of entry. Post-trade charts lie about what was visible at the time.",
          "dataSources": "Journal Entry Screenshots",
          "updateFrequency": "Post-Trade Review",
          "confidenceImpact": "Moderate"
            },
{
          "id": "ego_need_to_be_right",
          "title": "Ego & Need to be Right",
          "description": "Prioritizing the psychological validation of being correct over the mathematical reality of managing risk.",
          "calculation": "Action: Removing a stop loss to avoid realizing you made a bad read.",
          "weight": "Fatal Flaw",
          "interpretation": "Your goal is to make money, not to prove you are smarter than the market. The market is undefeated.",
          "interpretationVisual": [
                    {
                              "range": "Fighting the Trend",
                              "label": "Ego Destruction",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Stubborn Holds",
                              "label": "Friction",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Rapid Submission",
                              "label": "Humble Acceptance",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Say 'I was wrong' out loud when you close a losing trade. Verbally admitting it severs the ego's hold on the position.",
          "dataSources": "Loss Duration / Stop Movement",
          "updateFrequency": "Continuous",
          "confidenceImpact": "Absolute"
            },
{
          "id": "trading_on_tilt",
          "title": "Trading on Tilt",
          "description": "A state of emotional confusion and frustration leading to erratic, highly aggressive, and rule-breaking behavior.",
          "calculation": "Action: Mashing buttons, abandoning strategy, max leverage.",
          "weight": "Account Wipeout",
          "interpretation": "Tilt is a physiological state. Cortisol is flooding your brain. Logic cannot override it; physical removal from the screen is required.",
          "interpretationVisual": [
                    {
                              "range": "Frenzied Execution",
                              "label": "Total Meltdown",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Rising Anger",
                              "label": "Pre-Tilt Warning",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Walking Away",
                              "label": "Disaster Averted",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Install software that physically locks your broker application after 3 rapid consecutive losses. Save yourself from yourself.",
          "dataSources": "Emotional State / Heart Rate",
          "updateFrequency": "Intraday",
          "confidenceImpact": "Absolute"
            },
{
          "id": "market_regime_denial",
          "title": "Market Regime Denial",
          "description": "Continuing to force a specific strategy when the underlying macroeconomic or volatility regime has completely shifted.",
          "calculation": "Action: Buying dips in a confirmed bear market, or shorting breakouts in a raging bull market.",
          "weight": "Strategic Rigidity",
          "interpretation": "Identify the regime (Trend Bull, Trend Bear, Chop). Deploy the correct system. Do not fight the tide.",
          "interpretationVisual": [
                    {
                              "range": "Fighting the Tape",
                              "label": "Capital Burn",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Slow Adaptation",
                              "label": "Drawdown",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Regime Alignment",
                              "label": "Synchronized",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Use a long-term moving average (like the 200 SMA) on a higher timeframe exclusively as a regime filter. Do not short above it, do not long below it.",
          "dataSources": "VIX / Higher Timeframe Trends",
          "updateFrequency": "Weekly",
          "confidenceImpact": "High"
            },
{
          "id": "analysis_paralysis",
          "title": "Analysis Paralysis",
          "description": "Over-complicating a chart with so many indicators and conflicting timeframes that it becomes impossible to make a decision.",
          "calculation": "Action: Staring at 8 different indicators that provide contradictory signals.",
          "weight": "Execution Block",
          "interpretation": "Simplify. Strip the chart naked. Price, volume, and structure are the only truths. Everything else is a derivative of price.",
          "interpretationVisual": [
                    {
                              "range": "Cluttered Charts",
                              "label": "Information Overload",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Seeking Perfection",
                              "label": "Hesitation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Minimalist Setup",
                              "label": "Clear Action",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Limit yourself to a maximum of 3 indicators. If you cannot find an edge with 3, the 4th will not save you.",
          "dataSources": "Chart Setup Workspace",
          "updateFrequency": "Pre-Trade",
          "confidenceImpact": "High"
            },
{
          "id": "post_trade_review_routine",
          "title": "Post-Trade Review Routine",
          "description": "The mandatory habit of logging, tagging, and emotionally processing every completed trade at the end of the session.",
          "calculation": "Action: Updating the journal spreadsheet, writing notes, reviewing screenshots.",
          "weight": "Continuous Improvement",
          "interpretation": "Without review, experience is useless. Reviewing is where the actual learning and edge refinement occurs.",
          "interpretationVisual": [
                    {
                              "range": "Skipping Review",
                              "label": "Stagnation",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Glancing at PnL",
                              "label": "Superficial",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Deep Documentation",
                              "label": "Mastery Path",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Tag every trade with an 'Emotional State' (e.g., Calm, Rushed, Anxious). You'll quickly find your worst losses occur in specific mental states.",
          "dataSources": "Trading Journal",
          "updateFrequency": "End of Day",
          "confidenceImpact": "Absolute"
            },
{
          "id": "pre_market_preparation",
          "title": "Pre-Market Preparation Checklist",
          "description": "A systematic routine executed before the bell rings to map out levels, catalysts, and mental state.",
          "calculation": "Action: Checking economic calendar, charting key levels, reading news bias.",
          "weight": "Professional Baseline",
          "interpretation": "Never enter the market reactive. Know your key levels and your plan before the chaos of the open.",
          "interpretationVisual": [
                    {
                              "range": "Waking up at Bell",
                              "label": "Amateur / Reactive",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Brief Scan",
                              "label": "Unprepared",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Full Plan Written",
                              "label": "Professional Edge",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Write down your thesis for the day on a physical sticky note and put it on your monitor to anchor you when volatility spikes.",
          "dataSources": "Macro Calendar / Daily Charts",
          "updateFrequency": "Pre-Market",
          "confidenceImpact": "High"
            },
{
          "id": "sleep_performance_correlation",
          "title": "Sleep & Performance Correlation",
          "description": "The biological reality that sleep deprivation destroys cognitive function, impulse control, and pattern recognition.",
          "calculation": "Action: Trading after less than 6 hours of sleep.",
          "weight": "Biological Foundation",
          "interpretation": "Trading tired is trading drunk. Halve your size or take the day off if you are sleep deprived.",
          "interpretationVisual": [
                    {
                              "range": "< 5 Hours Sleep",
                              "label": "Severe Impairment",
                              "color": "text-red-500"
                    },
                    {
                              "range": "5-7 Hours Sleep",
                              "label": "Sub-optimal",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "8+ Hours Sleep",
                              "label": "Peak Cognition",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Use a sleep tracker. If your REM or Deep sleep is severely depressed, explicitly avoid high-frequency intraday trading that day.",
          "dataSources": "Sleep Tracking Device",
          "updateFrequency": "Daily",
          "confidenceImpact": "Absolute"
            },
{
          "id": "stress_cortisol_impact",
          "title": "Stress & Cortisol Impact",
          "description": "The physical degradation of decision-making abilities due to sustained high stress from market exposure or personal life.",
          "calculation": "Action: Holding massive drawdown positions overnight, leading to adrenal fatigue.",
          "weight": "Physical Toll",
          "interpretation": "Protect your nervous system. If trading is causing chronic anxiety, your position sizing is fundamentally wrong.",
          "interpretationVisual": [
                    {
                              "range": "Chronic Anxiety / Sweating",
                              "label": "Health Hazard",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Elevated Heart Rate",
                              "label": "Over-exposed",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Calm Breathing",
                              "label": "In Control",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Trade at a size where you can take a nap while the trade is open. If you can't sleep, cut the size in half until you can.",
          "dataSources": "Biometric Feedback",
          "updateFrequency": "Continuous",
          "confidenceImpact": "High"
            },
{
          "id": "meditation_mindfulness",
          "title": "Meditation & Mindfulness",
          "description": "Practices designed to create a gap between a trigger (market movement) and a response (your trade execution).",
          "calculation": "Action: 10 minutes of breathwork before the opening bell.",
          "weight": "Mental Conditioning",
          "interpretation": "Mindfulness prevents emotional hijacking. It allows you to observe a FOMO urge without acting on it.",
          "interpretationVisual": [
                    {
                              "range": "Reactive Automation",
                              "label": "Slave to Impulse",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Occasional Awareness",
                              "label": "Improving",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Mindful Observation",
                              "label": "Mastery",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Box breathing (4s inhale, 4s hold, 4s exhale, 4s hold) can physically lower your heart rate and reset cortisol levels mid-trade.",
          "dataSources": "Meditation App / Routine",
          "updateFrequency": "Daily",
          "confidenceImpact": "High"
            },
{
          "id": "acceptance_of_uncertainty",
          "title": "Acceptance of Uncertainty",
          "description": "Embracing the fundamental truth that you can never know for sure what the market will do next.",
          "calculation": "Action: Releasing the need to predict, focusing entirely on reacting to probabilities.",
          "weight": "Core Philosophy",
          "interpretation": "Stop trying to forecast the future. Your job is to recognize a structural edge and manage risk when it presents itself.",
          "interpretationVisual": [
                    {
                              "range": "Demanding Certainty",
                              "label": "Frustration",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Predictive Bias",
                              "label": "Vulnerable",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Probabilistic Mindset",
                              "label": "Fluidity",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Use the mantra: 'Anything can happen, and I don't need to know what happens next to make money.'",
          "dataSources": "Mental Dialogue",
          "updateFrequency": "Continuous",
          "confidenceImpact": "Absolute"
            },
{
          "id": "detachment_from_money",
          "title": "Detachment from Money",
          "description": "Severing the emotional link between your trading capital and its purchasing power in the real world.",
          "calculation": "Action: Thinking of capital as 'points' or 'inventory' rather than rent or groceries.",
          "weight": "Psychological Buffer",
          "interpretation": "If you trade with money you need for survival (scared money), the market will absorb it. Capital must be viewed as a tool.",
          "interpretationVisual": [
                    {
                              "range": "Trading Rent Money",
                              "label": "Guaranteed Failure",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Translating PnL to Items",
                              "label": "Emotional Attachment",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Pure Numbers Game",
                              "label": "Professional Detachment",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Never withdraw trading profits to pay for bills in the learning phase. It adds immense psychological pressure to your daily performance.",
          "dataSources": "Account Valuation View",
          "updateFrequency": "Continuous",
          "confidenceImpact": "Absolute"
            },
{
          "id": "thinking_in_probabilities",
          "title": "Thinking in Probabilities",
          "description": "Viewing every trade as a single draw from a large statistical distribution, rather than a definitive right/wrong outcome.",
          "calculation": "Action: Accepting a loss peacefully because it falls within the expected 40% loss rate of your system.",
          "weight": "Macro Perspective",
          "interpretation": "A loss is not a failure; it is a statistical necessity for the edge to play out over time.",
          "interpretationVisual": [
                    {
                              "range": "Outcome Focused",
                              "label": "Emotional Rollercoaster",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Doubtful Execution",
                              "label": "Lack of Trust",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Systematic Trust",
                              "label": "Flawless Execution",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Casinos do not panic when a player wins a hand of blackjack, because they know the math guarantees they win over 10,000 hands. Be the casino.",
          "dataSources": "Backtest Metrics",
          "updateFrequency": "Pre-Trade",
          "confidenceImpact": "Absolute"
            },
{
          "id": "discipline_muscle",
          "title": "The Discipline Muscle",
          "description": "The concept that discipline is a finite resource that must be built over time and protected from fatigue.",
          "calculation": "Action: Building habits in real life (gym, diet) to strengthen discipline in trading.",
          "weight": "Behavioral Capital",
          "interpretation": "How you do one thing is how you do everything. If you lack discipline outside the market, you will lack it inside.",
          "interpretationVisual": [
                    {
                              "range": "Chaotic Lifestyle",
                              "label": "Sloppy Trading",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Inconsistent Habits",
                              "label": "Volatile Results",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Structured Routine",
                              "label": "Execution Machine",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Automate your trading rules as much as possible via broker algorithms. Do not rely on willpower when money is on the line.",
          "dataSources": "Daily Routine Audit",
          "updateFrequency": "Daily",
          "confidenceImpact": "High"
            },
{
          "id": "accountability_partnerships",
          "title": "Accountability Partnerships",
          "description": "Sharing your trading journal and rules with a trusted peer to prevent hiding losses and breaking rules in secret.",
          "calculation": "Action: Weekly review calls with another trader to expose your mistakes.",
          "weight": "Social Guardrail",
          "interpretation": "Trading is incredibly isolating. An accountability partner forces transparency and breaks the cycle of secret shame.",
          "interpretationVisual": [
                    {
                              "range": "Hiding Losses",
                              "label": "Shame Spiral",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Solo Echo Chamber",
                              "label": "Unchecked Bias",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Total Transparency",
                              "label": "Accelerated Growth",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Give your accountability partner read-only access to your broker statement. Knowing they can see your PnL will prevent you from going on tilt.",
          "dataSources": "Peer Review Sessions",
          "updateFrequency": "Weekly",
          "confidenceImpact": "Moderate"
            },
{
          "id": "taking_planned_breaks",
          "title": "Taking Planned Breaks",
          "description": "Scheduling time away from the screens to reset the nervous system and prevent burnout.",
          "calculation": "Action: Mandating a 1-week vacation from charts every quarter.",
          "weight": "Longevity Protocol",
          "interpretation": "Screen fatigue ruins pattern recognition. Time away allows your brain to consolidate learning and return sharp.",
          "interpretationVisual": [
                    {
                              "range": "24/7 Chart Watching",
                              "label": "Burnout Imminent",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Occasional Weekends Off",
                              "label": "Moderate Recovery",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Scheduled Sabbaticals",
                              "label": "Sustained Edge",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "When you return from a break, trade with half-size for the first two days to recalibrate to the market rhythm before sizing up.",
          "dataSources": "Calendar / Vacation Time",
          "updateFrequency": "Quarterly",
          "confidenceImpact": "High"
            },
{
          "id": "defining_trading_why",
          "title": "Defining Your Trading 'Why'",
          "description": "The deep, intrinsic motivation for enduring the brutal psychological gauntlet required to become consistently profitable.",
          "calculation": "Action: Writing down the core reason (freedom, family, mastery) you chose to trade.",
          "weight": "Ultimate Anchor",
          "interpretation": "If your 'why' is just 'to buy a Lambo', the market will break you during your first massive drawdown. You need a deeper anchor.",
          "interpretationVisual": [
                    {
                              "range": "Superficial Greed",
                              "label": "Easily Broken",
                              "color": "text-red-500"
                    },
                    {
                              "range": "Vague Goals",
                              "label": "Wavering Motivation",
                              "color": "text-yellow-500"
                    },
                    {
                              "range": "Deep Purpose",
                              "label": "Unbreakable Resolve",
                              "color": "text-emerald-500"
                    }
          ],
          "proTip": "Keep a physical picture or symbol of your 'Why' next to your monitor. Look at it before you take a trade that breaks your rules.",
          "dataSources": "Personal Mission Statement",
          "updateFrequency": "Annually",
          "confidenceImpact": "Absolute"
            }
        ]
    }
};

exports.MANUAL_CONTENT = exports.manualData;

exports.MANUAL_SECTIONS = [
    {
        id: "praxis_composite_header",
        icon: Activity,
        label: "Master Dashboard",
        overview: "The central nervous system of Stocky. Synthesizes data to produce unified scoring and regime identification.",
        coreQuestion: "What is the overall market regime and direction?"
    },
    {
        id: "fundamental",
        icon: BookOpen,
        label: "Fundamental Engine",
        overview: "Evaluates the intrinsic value, financial health, and institutional flow of the underlying assets.",
        coreQuestion: "Is the underlying asset fundamentally overvalued or undervalued?"
    },
    {
        id: "technical",
        icon: LineChart,
        label: "Technical Engine",
        overview: "Analyzes price action, momentum, trend strength, and chart patterns to identify optimal entry/exit points.",
        coreQuestion: "What is the current trend, momentum, and optimal entry/exit point?"
    },
    {
        id: "options",
        icon: Target,
        label: "Options Engine",
        overview: "Analyzes derivatives data to gauge institutional positioning, market maker exposure, and implied volatility.",
        coreQuestion: "Where are institutions positioning their bets in the derivatives market?"
    },
    {
        id: "global",
        icon: Globe,
        label: "Global Macro Engine",
        overview: "Monitors international indices, currency strength, and commodity prices for cross-market correlations.",
        coreQuestion: "How are international markets and macro factors impacting domestic equities?"
    },
    {
        id: "events",
        icon: Clock,
        label: "Events Engine",
        overview: "Monitors scheduled macroeconomic releases, central bank meetings, and corporate earnings.",
        coreQuestion: "What upcoming scheduled events could trigger massive volatility?"
    },
    {
        id: "wallet",
        icon: Wallet,
        label: "Risk Management (Wallet)",
        overview: "The mathematical framework governing capital preservation and position sizing.",
        coreQuestion: "How much capital should I deploy, and when should I stop trading?"
    },
    {
        id: "journal",
        icon: BookMarked,
        label: "Trading Psychology (Journal)",
        overview: "Frameworks for emotional regulation, performance tracking, and behavioral self-correction.",
        coreQuestion: "Am I following my rules, or am I trading on emotion?"
    }
];