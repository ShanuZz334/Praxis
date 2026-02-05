/**
 * @file manualData.js
 * @purpose Provides static content and configuration for the "Manual" (Knowledge Base) feature.
 * @responsibilities
 * - Defines the navigation structure for the Manual sections (Dashboard, Fundamental, Technical, etc.).
 * - Stores detailed educational content, calculation methods, and interpretative guides for each topic.
 * - Centralizes icons and metadata for the Manual UI.
 * @key_exports
 * - MANUAL_SECTIONS (Navigation Config)
 * - MANUAL_CONTENT (Detailed Topic Data)
 * @dependencies
 * - react-icons/lu (Icons)
 * @lifecycle
 * - Imported by ManualDashboard and ManualSectionLayout to populate the UI.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import {
    LuLayoutDashboard,
    LuBookOpen,
    LuTrendingUp,
    LuLayers,
    LuCalendarDays,
    LuWallet,
    LuGlobe,
    LuNotebook
} from "react-icons/lu";

// =============================
// Navigation Configuration
// =============================

export const MANUAL_SECTIONS = [
    {
        id: "dashboard",
        label: "Dashboard",
        icon: LuLayoutDashboard,
        overview: "The Dashboard is the central intelligence layer that synthesizes all Stocky engines into a single, regime-aware market verdict. It reflects alignment, conflict, and conviction across systems in real time.",
        coreQuestion: "What is the market environment right now?"
    },
    {
        id: "fundamental",
        label: "Fundamental",
        icon: LuBookOpen,
        overview: "The Fundamental module evaluates valuation, earnings strength, balance sheet quality, and macro-adjusted growth to determine whether price is supported by underlying business reality.",
        coreQuestion: "Is price justified by fundamentals?"
    },
    {
        id: "technical",
        label: "Technical",
        icon: LuTrendingUp,
        overview: "The Technical module analyzes price structure, trend persistence, momentum, and volatility to assess market behavior without narrative bias or lagging interpretation.",
        coreQuestion: "What is price action confirming or rejecting?"
    },
    {
        id: "options",
        label: "Options",
        icon: LuLayers,
        overview: "The Options module tracks volatility regimes, Greeks, positioning, and flow to identify where risk is being transferred, hedged, or mispriced by the market.",
        coreQuestion: "How is risk being priced right now?"
    },
    {
        id: "global",
        label: "Global",
        icon: LuGlobe,
        overview: "The Global module monitors cross-asset correlations, macro drivers, and international market signals to contextualize domestic price action within broader risk cycles.",
        coreQuestion: "What external forces are influencing this market?"
    },
    {
        id: "events",
        label: "Events",
        icon: LuCalendarDays,
        overview: "The Events module evaluates economic releases, policy decisions, and unscheduled catalysts, scaling their potential impact on volatility, liquidity, and positioning.",
        coreQuestion: "When should risk be reduced or avoided?"
    },
    {
        id: "wallet",
        label: "Wallet",
        icon: LuWallet,
        overview: "The Wallet module enforces capital discipline by tracking exposure, drawdown limits, risk budgets, and allocation health across trading strategies.",
        coreQuestion: "How much risk can I responsibly deploy?"
    },
    {
        id: "journal",
        label: "Journal",
        icon: LuNotebook,
        overview: "The Journal module captures trades, decisions, and outcomes to identify behavioral patterns, execution errors, and process consistency over time.",
        coreQuestion: "Am I executing my system correctly?"
    }
];

// =============================
// Detailed Content Store
// =============================

export const MANUAL_CONTENT = {
    // --- 1. DASHBOARD ---
    dashboard: {
        title: "Master Dashboard",
        description: "The central nervous system of Stocky. Synthesizes data to produce unified scoring and regime identification.",
        topics: [
            {
                id: "stocky_score",
                title: "Stocky Score (0-100)",
                description: "A composite index representing the overall bullish/bearish conviction of the system.",
                calculation: "Weighted Sum: Technical (30%) + Options (25%) + Fundamental (20%) + Global (15%) + Events (10%).",
                weight: "100% of Top-Level Signal",
                interpretation: "0-20: Extreme Bearish | 20-40: Bearish | 40-60: Neutral/Chop | 60-80: Bullish | 80-100: Extreme Bullish.",
                proTip: "Scores > 80 often precede short-term corrections (overbought). Scores < 20 often precede bounces."
            },
            {
                id: "market_regime",
                title: "Market Regime Label",
                description: "Classifies the current market state into one of 4 quadrants based on trend and volatility.",
                calculation: "Derived from Spot Trend + IV Rank.",
                weight: "Qualitative Overlay",
                interpretation: "Trend (Low Vol), Chop (Low Vol), Volatile Trend (High Vol), Crash/Panic (High Vol).",
                proTip: "Adjust your strategy type (Credit vs Debit) based on this label, not just price direction."
            },
            {
                id: "conviction_meter",
                title: "Conviction Meter",
                description: "Measures the agreement between different intelligence engines.",
                calculation: "Standard Deviation of component scores.",
                weight: "R-Metric",
                interpretation: "High Conviction: All engines (Tech, Fund, Opt) agree. Low Conviction: Signals are conflicting.",
                proTip: "High Conviction trades allow for larger position sizing. Low Conviction requires reduced sizing."
            },
            {
                id: "risk_radar",
                title: "Risk Radar Status",
                description: "Real-time monitoring of systemic risk factors.",
                calculation: "Aggregated Z-Scores of VIX, CDS spreads, and Currency Volatility.",
                weight: "Veto Power",
                interpretation: "Normal, Elevated, or Critical. 'Critical' status overrides all bullish signals.",
                proTip: "Never buy the dip when Risk Radar is 'Critical'."
            }
        ]
    },

    // --- 2. FUNDAMENTAL ---
    fundamental: {
        title: "Fundamental Intelligence",
        description: "Deep-dive into the structural value, growth trajectory, and quality of the market.",
        topics: [
            {
                id: "pe_ratio",
                title: "P/E Ratio (Price-to-Earnings)",
                description: "The primary valuation metric measuring the price paid for each unit of earnings.",
                calculation: "Current Index Price / Trailing 12M Earnings Per Share (EPS).",
                weight: "15% of Fundamental Score",
                interpretation: "High (>25): Overvalued/Growth priced in. Low (<15): Undervalued/Fear priced in.",
                proTip: "Compare current P/E to the 5-year historical average to gauge relative expensiveness."
            },
            {
                id: "earnings_yield",
                title: "Earnings Yield Gap",
                description: "The difference between the market's earnings yield (1/PE) and the 10-Year Bond Yield.",
                calculation: "(1 / PE Ratio) - 10Y Govt Bond Yield.",
                weight: "20% of Fundamental Score",
                interpretation: "Positive: Equity Risk Premium is attractive. Negative: Bonds are more attractive than Stocks.",
                proTip: "This is the 'Smart Money' flow indicator. Flows leave equities when this turns negative."
            },
            {
                id: "pb_ratio",
                title: "P/B Ratio (Price-to-Book)",
                description: "Compares market value to book value (assets - liabilities). Critical for financial stocks.",
                calculation: "Price / Book Value per Share.",
                weight: "10% of Fundamental Score",
                interpretation: "High P/B suggests high ROE expectation. Low P/B (<1) suggests distress or deep value.",
                proTip: "Bank Nifty is highly sensitive to P/B mean reversion compared to Nifty 50."
            },
            {
                id: "fii_flow",
                title: "FII/DII Net Flow",
                description: "Institutional money flow tracking foreign and domestic activity.",
                calculation: "Net Buy/Sell Value in Crores (Daily).",
                weight: "10% of Fundamental Score",
                interpretation: "FII selling often caps upside. DII buying provides support levels.",
                proTip: "Watch for 'Divergence' where market rises despite FII selling (Retail/DII absorption) - often bullish."
            },
            {
                id: "roe",
                title: "Return on Equity (ROE)",
                description: "Measures a corporation's profitability in relation to stockholders' equity.",
                calculation: "Net Income / Shareholders' Equity.",
                weight: "Quality Metric",
                interpretation: "Consistently rising ROE allows for multiple expansion (Higher P/E).",
                proTip: "Companies with high ROE and low Debt are the 'Quality' factor darlings."
            },
            {
                id: "debt_to_equity",
                title: "Debt-to-Equity Ratio",
                description: "Measure of financial leverage and solvency.",
                calculation: "Total Liabilities / Total Shareholder Equity.",
                weight: "Risk Metric",
                interpretation: "High D/E (>2) indicates high leverage risk, especially in high-rate environments.",
                proTip: "Avoid high D/E companies when interest rates are rising."
            },
            {
                id: "operating_margin",
                title: "Operating Margin (OPM)",
                description: "Profit a company makes on a rupee of sales after paying for variable costs.",
                calculation: "Operating Earnings / Revenue.",
                weight: "Efficiency Metric",
                interpretation: "Expanding margins drive earnings growth faster than revenue growth.",
                proTip: "Margin expansion is the most explosive driver of stock prices."
            },
            {
                id: "peg_ratio",
                title: "PEG Ratio",
                description: "Price/Earnings to Growth Ratio. Adjusts P/E for expected growth rates.",
                calculation: "P/E Ratio / Annual EPS Growth Rate.",
                weight: "Valuation Metric",
                interpretation: "PEG < 1 is considered undervalued. PEG > 2 is expensive.",
                proTip: "Best metric for analyzing high-growth tech stocks where P/E looks optically high."
            }
        ]
    },

    // --- 3. TECHNICAL ---
    technical: {
        title: "Technical Intelligence",
        description: "Core price action engine analyzing momentum, trend, and statistical extensions.",
        topics: [
            {
                id: "rsi",
                title: "Relative Strength Index (RSI 14)",
                description: "Momentum oscillator measuring the speed and change of price movements.",
                calculation: "100 - (100 / (1 + RS)) where RS = Avg Gain / Avg Loss.",
                weight: "12% of Technical Score",
                interpretation: "Above 70: Overbought. Below 30: Oversold.",
                proTip: "In strong trends, RSI can stay >70 for weeks. Use 'Divergence' for reversals."
            },
            {
                id: "macd",
                title: "MACD",
                description: "Trend-following momentum indicator.",
                calculation: "12 EMA - 26 EMA. Signal: 9 SMA of MACD.",
                weight: "10% of Technical Score",
                interpretation: "Crossover above Zero: Bullish. Below Zero: Bearish.",
                proTip: "Histogram contraction often precedes the actual signal line cross."
            },
            {
                id: "bollinger_bands",
                title: "Bollinger Bands",
                description: "Volatility bands placed above and below a moving average.",
                calculation: "20 SMA +/- 2 Std Dev.",
                weight: "8% of Technical Score",
                interpretation: "Touching bands indicates statistical extension.",
                proTip: "'The Squeeze': When bands narrow, a violent expansion is imminent."
            },
            {
                id: "adx",
                title: "ADX (Avg Directional Index)",
                description: "Measures trend strength regardless of direction.",
                calculation: "Smoothed average of +DI and -DI difference.",
                weight: "8% of Technical Score",
                interpretation: ">25: Strong Trend. <20: Range/Chop.",
                proTip: "Never trade breakouts when ADX is falling."
            },
            {
                id: "supertrend",
                title: "Supertrend",
                description: "Trend-following overlay.",
                calculation: "ATR-based trailing stop.",
                weight: "15% of Technical Score",
                interpretation: "Green: Uptrend support. Red: Downtrend resistance.",
                proTip: "Excellent for trailing stop-losses in trending markets."
            },
            {
                id: "stoch_rsi",
                title: "Stochastic RSI",
                description: "An indicator of an indicator. More sensitive than regular RSI.",
                calculation: "(Current RSI - Min RSI) / (Max RSI - Min RSI).",
                weight: "Timing Metric",
                interpretation: "Great for precise entry timing within a larger trend.",
                proTip: "Use Stoch RSI for entry triggers, but filtering direction with the 200 EMA."
            },
            {
                id: "cci",
                title: "CCI (Commodity Channel Index)",
                description: "Identifies cyclical turns in commodities and stocks.",
                calculation: "Price deviation from statistical mean.",
                weight: "Cyclical Metric",
                interpretation: "> +100: Strong Upside. < -100: Strong Downside.",
                proTip: "CCI is faster than RSI and often signals breakouts earlier."
            },
            {
                id: "obv",
                title: "On-Balance Volume (OBV)",
                description: "Cumulative volume indicator.",
                calculation: "Adds volume on up days, subtracts on down days.",
                weight: "Volume Metric",
                interpretation: "Rising OBV confirms price trends. Divergence signals reversals.",
                proTip: "If Price makes a higher high but OBV makes a lower high, the rally is hollow."
            },
            {
                id: "ema_crossover",
                title: "Golden/Death Cross",
                description: "Interaction between 50-day and 200-day Moving Averages.",
                calculation: "50 SMA vs 200 SMA.",
                weight: "Long Term Trend",
                interpretation: "Golden Cross (50 > 200): Bull Market. Death Cross (50 < 200): Bear Market.",
                proTip: "These are lagging indicators but highly respected by institutional algos."
            },
            {
                id: "pivot_points",
                title: "Pivot Points",
                description: "Mathematical support and resistance levels based on prior period prices.",
                calculation: "(High + Low + Close) / 3.",
                weight: "Level Metric",
                interpretation: "Price above Pivot is bullish. Below is bearish.",
                proTip: "Standard / Fibonacci pivots are self-fulfilling prophecies due to widespread use."
            }
        ]
    },

    // --- 4. OPTIONS ---
    options: {
        title: "Options Intelligence",
        description: "Volatility surface, open interest structures, and greek exposure analysis.",
        topics: [
            {
                id: "pcr",
                title: "Put-Call Ratio (PCR)",
                description: "Ratio of Put OI to Call OI.",
                calculation: "Total Put OI / Total Call OI.",
                weight: "Sentiment",
                interpretation: ">1.5: Oversold (Bullish). <0.5: Overbought (Bearish).",
                proTip: "Contrarian indicator. High PCR means too many bears."
            },
            {
                id: "max_pain",
                title: "Max Pain",
                description: "Strike price where option writers lose the least money.",
                calculation: "Intrinsic value minimization.",
                weight: "Pinning",
                interpretation: "Price gravitates to Max Pain at expiry.",
                proTip: "Reliable on Expiry Thursdays."
            },
            {
                id: "iv_rank",
                title: "IV Rank (IVR)",
                description: "Current IV relative to yearly range.",
                calculation: "(IV - Low) / (High - Low) * 100.",
                weight: "Strategy Selection",
                interpretation: "High IVR: Sell Premium. Low IVR: Buy Premium.",
                proTip: "Don't buy options when IVR > 50."
            },
            {
                id: "gamma",
                title: "Gamma",
                description: "Rate of change of Delta.",
                calculation: "2nd derivative of price.",
                weight: "Risk",
                interpretation: "Highest for ATM options near expiry.",
                proTip: "Short Gamma is the 'Widowmaker' trade."
            },
            {
                id: "delta",
                title: "Delta",
                description: "Directional exposure.",
                calculation: "$ Change per $1 underlying move.",
                weight: "Exposure",
                interpretation: "0.50 Delta = 50% probability ITM.",
                proTip: "Use Delta for position sizing (Delta-Neutral)."
            },
            {
                id: "theta",
                title: "Theta",
                description: "Time decay.",
                calculation: "Value lost per day.",
                weight: "Decay",
                interpretation: "Enemy of buyers, friend of sellers.",
                proTip: "Theta decay is non-linear; it accelerates rapidly."
            },
            {
                id: "vega",
                title: "Vega",
                description: "Volatility sensitivity.",
                calculation: "$ Change per 1% IV change.",
                weight: "Vol Risk",
                interpretation: "Long Vega profits from rising fear.",
                proTip: "Calendars are a classic Long Vega trade."
            },
            {
                id: "vix",
                title: "India VIX",
                description: "Volatility Index derived from Nifty options.",
                calculation: "Weighted average of OTM option prices.",
                weight: "Market Fear",
                interpretation: "VIX > 20: High Fear. VIX < 12: Complacency.",
                proTip: "VIX is mean-reverting. If it's too low, expect a spike."
            },
            {
                id: "skew",
                title: "Vol Skew",
                description: "Difference in IV between OTM Puts and OTM Calls.",
                calculation: "Put IV - Call IV.",
                weight: "Tail Risk",
                interpretation: "High Skew means traders are paying expensive premiums for crash protection.",
                proTip: "Steep skew often indicates institutional hedging (smart money fear)."
            }
        ]
    },

    // --- 5. GLOBAL ---
    global: {
        title: "Global Intelligence",
        description: "Macro correlations, currency impacts, and foreign market lead-lag relationships.",
        topics: [
            {
                id: "dxy",
                title: "Dollar Index (DXY)",
                description: "Strength of USD vs major currencies.",
                calculation: "Basket of EUR, JPY, GBP, CAD, SEK, CHF.",
                weight: "Inverse Correlation",
                interpretation: "Strong DXY hurts Emerging Markets like India.",
                proTip: "DXY breakouts often coincide with Nifty corrections."
            },
            {
                id: "us_10y",
                title: "US 10Y Yield",
                description: "Benchmark risk-free rate.",
                calculation: "Bond Market Auction.",
                weight: "Valuation Cap",
                interpretation: "Rising yields compress P/E multiples.",
                proTip: "Yield spikes > 4.5% usually trigger tech sell-offs."
            },
            {
                id: "brent",
                title: "Brent Crude",
                description: "Global oil benchmark.",
                calculation: "Spot Market.",
                weight: "Inflation Input",
                interpretation: "High oil is bad for India's trade deficit.",
                proTip: "Oil is inversely correlated to paints and piles."
            },
            {
                id: "gold",
                title: "Gold (XAU/USD)",
                description: "Safe haven asset.",
                calculation: "Spot Price.",
                weight: "Risk-Off",
                interpretation: "Rallying gold implies systemic fear or inflation.",
                proTip: "Gold often fronts-runs central bank pivots."
            },
            {
                id: "nasdaq",
                title: "NASDAQ 100",
                description: "US Tech Index.",
                calculation: "Market Cap Weighted.",
                weight: "Sentiment Leader",
                interpretation: "Nifty IT closely follows NASDAQ movement.",
                proTip: "Check NASDAQ futures before trading Indian IT stocks."
            },
            {
                id: "usdinr",
                title: "USD/INR",
                description: "Rupee exchange rate.",
                calculation: "Forex Spot.",
                weight: "FII Flow Proxy",
                interpretation: "Weak Rupee (Rising Chart) often correlates with FII selling equities.",
                proTip: "RBI defends specific levels (e.g., 83.50). Watch for intervention."
            }
        ]
    },

    // --- 6. EVENTS ---
    events: {
        title: "Event Intelligence",
        description: "Impact scaling of binary economic outcomes and corporate earnings.",
        topics: [
            {
                id: "fed_fomc",
                title: "FOMC Policy",
                description: "US Interest Rate Decision.",
                weight: "Tier 1 Impact",
                interpretation: "Hawkish (Hike) vs Dovish (Cut).",
                proTip: "Don't trade the news, trade the reaction."
            },
            {
                id: "rbi_policy",
                title: "RBI MPC",
                description: "Indian Repo Rate Decision.",
                weight: "Tier 1 Impact",
                interpretation: "Impacts Banks and Auto/Realty (Rate sensitives).",
                proTip: "Policy stance (Neutral/Withdrawal) matters more than the rate itself."
            },
            {
                id: "cpi_inflation",
                title: "CPI Inflation",
                description: "Consumer Price Index data.",
                weight: "Tier 1 Impact",
                interpretation: "High CPI forces central banks to hike rates.",
                proTip: "Core CPI (excluding food/energy) is what the Fed watches."
            },
            {
                id: "nfp",
                title: "Non-Farm Payrolls (NFP)",
                description: "US Jobs Report.",
                weight: "Tier 1 Impact",
                interpretation: "Strong jobs = Hawkish Fed. Weak jobs = Recession fear.",
                proTip: "Gold volatility is extreme during NFP release."
            },
            {
                id: "gdp",
                title: "GDP Growth",
                description: "Gross Domestic Product prints.",
                weight: "Tier 2 Impact",
                interpretation: "Lagging indicator but confirms recession status.",
                proTip: "Two consecutive quarters of negative GDP = Technical Recession."
            },
            {
                id: "budget",
                title: "Union Budget",
                description: "Annual fiscal policy of India.",
                weight: "Tier 1 (Annual)",
                interpretation: "Sectoral allocations drive multi-month trends.",
                proTip: "Infrastructure and Defence are usual budget darlings."
            }
        ]
    },

    // --- 7. WALLET & RISK ---
    wallet: {
        title: "Wallet & Risk",
        description: "Portfolio tracking, PnL analysis, and capital allocation metrics.",
        topics: [
            {
                id: "sharpe",
                title: "Sharpe Ratio",
                description: "Risk-adjusted return metric.",
                calculation: "(Return - Risk Free Rate) / Volatility.",
                weight: "Efficiency",
                interpretation: ">1 is good, >2 is excellent, >3 is elite.",
                proTip: "High returns with high volatility yields a low Sharpe."
            },
            {
                id: "sortino",
                title: "Sortino Ratio",
                description: "Like Sharpe, but only penalizes downside volatility.",
                calculation: "(Return - Risk Free) / Downside Deviation.",
                weight: "Efficiency",
                interpretation: "Better for strategies with upside skew (Calls).",
                proTip: "For options buyers, Sortino is more relevant than Sharpe."
            },
            {
                id: "cagr",
                title: "CAGR",
                description: "Compound Annual Growth Rate.",
                calculation: "(End/Start)^(1/n) - 1.",
                weight: "Growth",
                interpretation: "Smoothed annual return rate.",
                proTip: "Consistency compounds. Big wins and big losses destroy CAGR."
            },
            {
                id: "drawdown",
                title: "Max Drawdown",
                description: "Peak-to-trough decline.",
                weight: "Safety",
                interpretation: "The pain threshold of the strategy.",
                proTip: "A 50% loss requires a 100% gain to recover."
            },
            {
                id: "var",
                title: "Value at Risk (VaR)",
                description: "Worst case loss expectation.",
                weight: "Risk Cap",
                interpretation: "95% confidence max daily loss.",
                proTip: "Institutional desks cut risk strictly based on VaR limits."
            },
            {
                id: "kelly",
                title: "Kelly Criterion",
                description: "Optimal position sizing formula.",
                calculation: "W - (1-W)/R.",
                weight: "Sizing",
                interpretation: "Mathematically optimal bet size for max growth.",
                proTip: "Full Kelly is too volatile. Use 'Half Kelly' for safety."
            }
        ]
    },

    // --- 8. JOURNAL ---
    journal: {
        title: "Trade Journal",
        description: "Behavioral analytics and rule adherence tracking.",
        topics: [
            {
                id: "win_rate",
                title: "Win Rate",
                description: "% of trades profitable.",
                weight: "Accuracy",
                interpretation: "Does not determine profitability alone.",
                proTip: "40% Win Rate with 3:1 RR is a tailored institutional strategy."
            },
            {
                id: "rr_ratio",
                title: "Risk:Reward Ratio",
                description: "Potential profit vs Potential loss.",
                weight: "Expectancy",
                interpretation: "Minimum 1:2 is recommended.",
                proTip: "Never enter a trade without defined R:R."
            },
            {
                id: "expectancy",
                title: "Expectancy",
                description: "Average $ value per trade over time.",
                calculation: "(Win% * Avg Win) - (Loss% * Avg Loss).",
                weight: "The Holy Grail",
                interpretation: "Must be positive to be a trader.",
                proTip: "Focus on maximizing Expectancy, not Win Rate."
            },
            {
                id: "fomo",
                title: "FOMO Error",
                description: "Fear Of Missing Out entries.",
                weight: "Psychology",
                interpretation: "Entering late due to emotion.",
                proTip: "Tag these trades to measure their cost to your PnL."
            },
            {
                id: "revenge",
                title: "Revenge Trading",
                description: "Trading to 'make back' losses.",
                weight: "Psychology",
                interpretation: "The fastest way to blow an account.",
                proTip: "Walk away after 2 consecutive losses."
            },
            {
                id: "tilt",
                title: "Tilt",
                description: "Emotional state affecting decision making.",
                weight: "Psychology",
                interpretation: "Evaluating if you were calm or agitated.",
                proTip: "HALT: Don't trade if Hungry, Angry, Lonely, or Tired."
            }
        ]
    }
};
