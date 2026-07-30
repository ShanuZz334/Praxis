import { FUNDAMENTALS_RELIABILITY, TOTAL_FUNDAMENTALS_CREDITS as _TOTAL_CREDITS } from '../../../../config/reliability';
import { getCreditFromReliability } from '../../../../shared/global/logic/signals';
import { CARD_REGISTRY } from '../../../../shared/config/cardRegistry';

// =============================
// Card Definitions
// =============================
const _baseCards = [
  /* -----------------------------------------------------
     SECTION 1: VALUATION
  ----------------------------------------------------- */
  {
    id: CARD_REGISTRY.nifty_pe?.id || "nifty_pe",
    label: "NIFTY PE Ratio",
    unit: "",
    category: "Valuation",
    description: "Trailing PE vs historical averages (Z-Score)",
    creditScore: 0.75,
    creditAllocation: 11,
  },
  {
    id: CARD_REGISTRY.forward_pe?.id || "forward_pe",
    label: "Forward PE",
    unit: "",
    category: "Valuation",
    description: "Forward valuation vs trailing PE spread",
    creditScore: 0.80,
    creditAllocation: 12,
  },
  {
    id: CARD_REGISTRY.nifty_pb?.id || "nifty_pb",
    label: "NIFTY PB Ratio",
    unit: "",
    category: "Valuation",
    description: "Price to Book vs historical range",
    creditScore: 0.70,
    creditAllocation: 10,
  },
  {
    id: CARD_REGISTRY.earnings_yield?.id || "earnings_yield",
    label: "Earnings Yield",
    unit: "%",
    category: "Valuation",
    description: "Earnings yield vs bond yield (ERP)",
    creditScore: 0.90,
    creditAllocation: 14,
  },
  {
    id: CARD_REGISTRY.mcap_gdp?.id || "mcap_gdp",
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
    id: CARD_REGISTRY.eps_yoy?.id || "eps_yoy",
    label: "EPS YoY Growth",
    unit: "%",
    category: "Earnings",
    description: "Year-on-year earnings growth",
    creditScore: 0.90,
    creditAllocation: 12,
  },
  {
    id: CARD_REGISTRY.forward_eps?.id || "forward_eps",
    label: "Forward EPS Growth",
    unit: "%",
    category: "Earnings",
    description: "Next FY earnings growth expectations",
    creditScore: 0.85,
    creditAllocation: 11,
  },
  {
    id: CARD_REGISTRY.earnings_revision?.id || "earnings_revision",
    label: "Earnings Revision Trend",
    unit: "",
    category: "Earnings",
    description: "Upward vs downward revisions",
    creditScore: 0.95,
    creditAllocation: 12,
  },
  {
    id: CARD_REGISTRY.sector_earnings?.id || "sector_earnings",
    label: "Sector Earnings Strength",
    unit: "",
    category: "Earnings",
    description: "Sector-wise earnings contribution",
    creditScore: 0.75,
    creditAllocation: 8,
  },
  {
    id: CARD_REGISTRY.profit_margin?.id || "profit_margin",
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
    id: CARD_REGISTRY.gdp?.id || "gdp",
    label: "GDP Growth",
    unit: "%",
    category: "Macro",
    description: "India GDP growth trend",
    creditScore: 0.90,
    creditAllocation: 11,
  },
  {
    id: CARD_REGISTRY.cpi?.id || "cpi",
    label: "CPI Inflation",
    unit: "%",
    category: "Macro",
    description: "Inflation pressure & trend",
    creditScore: 0.95,
    creditAllocation: 12,
  },
  {
    id: CARD_REGISTRY.repo?.id || "repo",
    label: "Interest Rate Cycle",
    unit: "%",
    category: "Macro",
    description: "Repo rate & interest rate environment",
    creditScore: 0.95,
    creditAllocation: 12,
  },
  {
    id: CARD_REGISTRY.policy_stance?.id || "policy_stance",
    label: "RBI Policy Stance",
    unit: "",
    category: "Macro",
    description: "Hawkish / Neutral / Dovish",
    creditScore: 0.90,
    creditAllocation: 10,
  },
  {
    id: CARD_REGISTRY.fiscal_deficit?.id || "fiscal_deficit",
    label: "Fiscal Deficit",
    unit: "%",
    category: "Macro",
    description: "Fiscal discipline vs target",
    creditScore: 0.80,
    creditAllocation: 9,
  },
  {
    id: CARD_REGISTRY.current_account?.id || "current_account",
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
    id: CARD_REGISTRY.fii?.id || "fii",
    label: "FII Net Flow",
    unit: "₹ Cr",
    category: "Liquidity",
    description: "Foreign institutional cash flows",
    creditScore: 0.95,
    creditAllocation: 10,
  },
  {
    id: CARD_REGISTRY.dii?.id || "dii",
    label: "DII Net Flow",
    unit: "₹ Cr",
    category: "Liquidity",
    description: "Domestic institutional support",
    creditScore: 0.85,
    creditAllocation: 9,
  },
  {
    id: CARD_REGISTRY.fii_trend?.id || "fii_trend",
    label: "FII Flow Trend",
    unit: "",
    category: "Liquidity",
    description: "Persistence of FII flows",
    creditScore: 0.95,
    creditAllocation: 10,
  },
  {
    id: CARD_REGISTRY.system_liquidity?.id || "system_liquidity",
    label: "System Liquidity",
    unit: "₹ Cr",
    category: "Liquidity",
    description: "RBI liquidity surplus/deficit",
    creditScore: 0.90,
    creditAllocation: 9,
  },
  {
    id: CARD_REGISTRY.mf_flows?.id || "mf_flows",
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
    id: CARD_REGISTRY.sector_valuation?.id || "sector_valuation",
    label: "Sector Valuation Spread",
    unit: "",
    category: "Sector",
    description: "Valuation dispersion across sectors",
    creditScore: 0.75,
    creditAllocation: 7,
  },
  {
    id: CARD_REGISTRY.sector_growth?.id || "sector_growth",
    label: "Sector Growth Differential",
    unit: "%",
    category: "Sector",
    description: "Growth leaders vs laggards",
    creditScore: 0.80,
    creditAllocation: 8,
  },
  {
    id: CARD_REGISTRY.sector_concentration?.id || "sector_concentration",
    label: "Sector Concentration",
    unit: "%",
    category: "Sector",
    description: "Top sector weight concentration",
    creditScore: 0.70,
    creditAllocation: 6,
  },
  {
    id: CARD_REGISTRY.cyc_def?.id || "cyc_def",
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
    id: CARD_REGISTRY.policy_tailwinds?.id || "policy_tailwinds",
    label: "Govt Capex Push",
    unit: "",
    category: "Corporate",
    description: "Policy support for capex & infra",
    creditScore: 0.80,
    creditAllocation: 7,
  },
  {
    id: CARD_REGISTRY.corp_debt?.id || "corp_debt",
    label: "Corporate Debt Levels",
    unit: "%",
    category: "Corporate",
    description: "Debt stress vs GDP",
    creditScore: 0.85,
    creditAllocation: 8,
  },
  {
    id: CARD_REGISTRY.credit_growth?.id || "credit_growth",
    label: "Credit Growth",
    unit: "%",
    category: "Corporate",
    description: "Bank credit momentum",
    creditScore: 0.90,
    creditAllocation: 8,
  },
  {
    id: CARD_REGISTRY.tax_env?.id || "tax_env",
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
    id: CARD_REGISTRY.global_growth?.id || "global_growth",
    label: "Global Growth Pulse",
    unit: "",
    category: "Global",
    description: "Composite global growth signal",
    creditScore: 0.80,
    creditAllocation: 7,
  },
  {
    id: CARD_REGISTRY.crude?.id || "crude",
    label: "Commodity Cost Pressure",
    unit: "$",
    category: "Global",
    description: "Crude oil & input costs",
    creditScore: 0.85,
    creditAllocation: 8,
  },
  {
    id: CARD_REGISTRY.usdinr?.id || "usdinr",
    label: "INR Stability",
    unit: "",
    category: "Global",
    description: "Currency volatility & trend",
    creditScore: 0.90,
    creditAllocation: 8,
  },
  {
    id: CARD_REGISTRY.global_liq?.id || "global_liq",
    label: "Global Liquidity (Fed)",
    unit: "",
    category: "Global",
    description: "Fed balance sheet & rates",
    creditScore: 0.95,
    creditAllocation: 9,
  },
];

// Dynamic Export with Tiered Credits derived from centralized Reliability source
export const FUNDAMENTAL_CARDS = _baseCards.map(card => {
  const reliability = FUNDAMENTALS_RELIABILITY[card.id] || 0.5;
  return {
    ...card,
    creditScore: reliability, // Internal legacy sync
    reliability,
    creditAllocation: getCreditFromReliability(reliability)
  };
});

export const TOTAL_FUNDAMENTAL_CREDITS = _TOTAL_CREDITS;
