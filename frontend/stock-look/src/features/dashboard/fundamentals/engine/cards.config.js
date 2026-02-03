/**
 * @file cards.config.js
 * @purpose Registry of all Fundamental Cards/Metrics used in the system.
 * @responsibilities
 * - Defines metadata (ID, Label, Category, Unit).
 * - Assigns "Credit Allocations" and "Credit Scores" (Reliability) for weighting.
 * - Grouped by logical sections (Valuation, Macro, etc.).
 * @key_exports
 * - FUNDAMENTAL_CARDS
 * - TOTAL_FUNDAMENTAL_CREDITS
 * @lifecycle
 * - Static configuration loaded by `index.js`.
 * @date 2026-02-03
 */

// =============================
// Card Definitions
// =============================
export const FUNDAMENTAL_CARDS = [
  /* -----------------------------------------------------
     SECTION 1: VALUATION
  ----------------------------------------------------- */
  {
    id: "nifty_pe",
    label: "NIFTY PE Ratio",
    unit: "",
    category: "Valuation",
    description: "Trailing PE vs historical averages (Z-Score)",
    creditScore: 0.75,
    creditAllocation: 11,
  },
  {
    id: "forward_pe",
    label: "Forward PE",
    unit: "",
    category: "Valuation",
    description: "Forward valuation vs trailing PE spread",
    creditScore: 0.80,
    creditAllocation: 12,
  },
  {
    id: "nifty_pb",
    label: "NIFTY PB Ratio",
    unit: "",
    category: "Valuation",
    description: "Price to Book vs historical range",
    creditScore: 0.70,
    creditAllocation: 10,
  },
  {
    id: "earnings_yield",
    label: "Earnings Yield",
    unit: "%",
    category: "Valuation",
    description: "Earnings yield vs bond yield (ERP)",
    creditScore: 0.90,
    creditAllocation: 14,
  },
  {
    id: "mcap_gdp",
    label: "Market Cap to GDP",
    unit: "%",
    category: "Valuation",
    description: "Buffett Indicator for India",
    creditScore: 0.85,
    creditAllocation: 13,
  },

  /* -----------------------------------------------------
     SECTION 2: EARNINGS & PROFITABILITY
  ----------------------------------------------------- */
  {
    id: "eps_yoy",
    label: "EPS YoY Growth",
    unit: "%",
    category: "Earnings",
    description: "Year-on-year earnings growth",
    creditScore: 0.90,
    creditAllocation: 12,
  },
  {
    id: "forward_eps",
    label: "Forward EPS Growth",
    unit: "%",
    category: "Earnings",
    description: "Next FY earnings growth expectations",
    creditScore: 0.85,
    creditAllocation: 11,
  },
  {
    id: "earnings_revision",
    label: "Earnings Revision Trend",
    unit: "",
    category: "Earnings",
    description: "Upward vs downward revisions",
    creditScore: 0.95,
    creditAllocation: 12,
  },
  {
    id: "sector_earnings",
    label: "Sector Earnings Strength",
    unit: "",
    category: "Earnings",
    description: "Sector-wise earnings contribution",
    creditScore: 0.75,
    creditAllocation: 8,
  },
  {
    id: "profit_margin",
    label: "Profit Margin Trend",
    unit: "%",
    category: "Earnings",
    description: "Net & operating margin trajectory",
    creditScore: 0.80,
    creditAllocation: 9,
  },

  /* -----------------------------------------------------
     SECTION 3: MACRO
  ----------------------------------------------------- */
  {
    id: "gdp",
    label: "GDP Growth",
    unit: "%",
    category: "Macro",
    description: "India GDP growth trend",
    creditScore: 0.90,
    creditAllocation: 11,
  },
  {
    id: "cpi",
    label: "CPI Inflation",
    unit: "%",
    category: "Macro",
    description: "Inflation pressure & trend",
    creditScore: 0.95,
    creditAllocation: 12,
  },
  {
    id: "repo",
    label: "Interest Rate Cycle",
    unit: "%",
    category: "Macro",
    description: "Repo rate & interest rate environment",
    creditScore: 0.95,
    creditAllocation: 12,
  },
  {
    id: "policy_stance",
    label: "RBI Policy Stance",
    unit: "",
    category: "Macro",
    description: "Hawkish / Neutral / Dovish",
    creditScore: 0.90,
    creditAllocation: 10,
  },
  {
    id: "fiscal_deficit",
    label: "Fiscal Deficit",
    unit: "%",
    category: "Macro",
    description: "Fiscal discipline vs target",
    creditScore: 0.80,
    creditAllocation: 9,
  },
  {
    id: "current_account",
    label: "Current Account Balance",
    unit: "%",
    category: "Macro",
    description: "External stability indicator",
    creditScore: 0.85,
    creditAllocation: 10,
  },

  /* -----------------------------------------------------
     SECTION 4: LIQUIDITY & FLOWS
  ----------------------------------------------------- */
  {
    id: "fii",
    label: "FII Net Flow",
    unit: "₹ Cr",
    category: "Liquidity",
    description: "Foreign institutional cash flows",
    creditScore: 0.95,
    creditAllocation: 10,
  },
  {
    id: "dii",
    label: "DII Net Flow",
    unit: "₹ Cr",
    category: "Liquidity",
    description: "Domestic institutional support",
    creditScore: 0.85,
    creditAllocation: 9,
  },
  {
    id: "fii_trend",
    label: "FII Flow Trend",
    unit: "",
    category: "Liquidity",
    description: "Persistence of FII flows",
    creditScore: 0.95,
    creditAllocation: 10,
  },
  {
    id: "system_liquidity",
    label: "System Liquidity",
    unit: "₹ Cr",
    category: "Liquidity",
    description: "RBI liquidity surplus/deficit",
    creditScore: 0.90,
    creditAllocation: 9,
  },
  {
    id: "mf_flows",
    label: "Mutual Fund Flows",
    unit: "₹ Cr",
    category: "Liquidity",
    description: "Retail participation signal",
    creditScore: 0.85,
    creditAllocation: 8,
  },

  /* -----------------------------------------------------
     SECTION 5: SECTOR & BREADTH
  ----------------------------------------------------- */
  {
    id: "sector_valuation",
    label: "Sector Valuation Spread",
    unit: "",
    category: "Sector",
    description: "Valuation dispersion across sectors",
    creditScore: 0.75,
    creditAllocation: 7,
  },
  {
    id: "sector_growth",
    label: "Sector Growth Differential",
    unit: "%",
    category: "Sector",
    description: "Growth leaders vs laggards",
    creditScore: 0.80,
    creditAllocation: 8,
  },
  {
    id: "sector_concentration",
    label: "Sector Concentration",
    unit: "%",
    category: "Sector",
    description: "Top sector weight concentration",
    creditScore: 0.70,
    creditAllocation: 6,
  },
  {
    id: "cyc_def",
    label: "Cyclical vs Defensive",
    unit: "",
    category: "Sector",
    description: "Risk-on vs risk-off ratio",
    creditScore: 0.85,
    creditAllocation: 8,
  },

  /* -----------------------------------------------------
     SECTION 6: CORPORATE & POLICY
  ----------------------------------------------------- */
  {
    id: "policy_tailwinds",
    label: "Govt Capex Push",
    unit: "",
    category: "Corporate",
    description: "Policy support for capex & infra",
    creditScore: 0.80,
    creditAllocation: 7,
  },
  {
    id: "corp_debt",
    label: "Corporate Debt Levels",
    unit: "%",
    category: "Corporate",
    description: "Debt stress vs GDP",
    creditScore: 0.85,
    creditAllocation: 8,
  },
  {
    id: "credit_growth",
    label: "Credit Growth",
    unit: "%",
    category: "Corporate",
    description: "Bank credit momentum",
    creditScore: 0.90,
    creditAllocation: 8,
  },
  {
    id: "tax_env",
    label: "Tax & Regulatory Environment",
    unit: "",
    category: "Corporate",
    description: "Regulatory stability score",
    creditScore: 0.70,
    creditAllocation: 6,
  },

  /* -----------------------------------------------------
     SECTION 7: GLOBAL CONTEXT
  ----------------------------------------------------- */
  {
    id: "global_growth",
    label: "Global Growth Pulse",
    unit: "",
    category: "Global",
    description: "Composite global growth signal",
    creditScore: 0.80,
    creditAllocation: 7,
  },
  {
    id: "crude",
    label: "Commodity Cost Pressure",
    unit: "$",
    category: "Global",
    description: "Crude oil & input costs",
    creditScore: 0.85,
    creditAllocation: 8,
  },
  {
    id: "usdinr",
    label: "INR Stability",
    unit: "",
    category: "Global",
    description: "Currency volatility & trend",
    creditScore: 0.90,
    creditAllocation: 8,
  },
  {
    id: "global_liq",
    label: "Global Liquidity (Fed)",
    unit: "",
    category: "Global",
    description: "Fed balance sheet & rates",
    creditScore: 0.95,
    creditAllocation: 9,
  },

  /* -----------------------------------------------------
     SECTION 8: RISK & STRESS
  ----------------------------------------------------- */
  {
    id: "sovereign_risk",
    label: "Sovereign Risk Proxy",
    unit: "",
    category: "Risk",
    description: "Country risk & CDS proxy",
    creditScore: 0.85,
    creditAllocation: 7,
  },
  {
    id: "npa",
    label: "NPA / Credit Stress",
    unit: "%",
    category: "Risk",
    description: "Banking system asset quality",
    creditScore: 0.95,
    creditAllocation: 8,
  },
  {
    id: "reform_momentum",
    label: "Structural Reform Momentum",
    unit: "",
    category: "Risk",
    description: "Long-term reform trajectory",
    creditScore: 0.75,
    creditAllocation: 6,
  },
];

// =============================
// Constants
// =============================
export const TOTAL_FUNDAMENTAL_CREDITS = 300;
