/**
 * @file bounds.js
 * @purpose Defines the min/max bounds for various fundamental metrics to normalize scores.
 * @responsibilities
 * - Provides validation thresholds for Valuation, Earnings, Macro, etc.
 * - Supports "inverse" logic where lower is better (e.g., Inflation, Debt).
 * @key_exports
 * - BOUNDS (Constant)
 * @lifecycle
 * - Used by `normalize.js` and `index.js` during score calculation.
 * @date 2026-02-03
 */

// =============================
// Constants & Config
// =============================
export const BOUNDS = {
   // --- VALUATION ---
   nifty_pe: { min: 12, max: 30, inverse: true },
   forward_pe: { min: 12, max: 28, inverse: true },
   nifty_pb: { min: 2.0, max: 5.5, inverse: true },
   earnings_yield: { min: 2.0, max: 8.0 },
   mcap_gdp: { min: 65, max: 180, inverse: true },

   // --- EARNINGS & PROFITABILITY ---
   eps_yoy: { min: -10, max: 30 },
   forward_eps: { min: -5, max: 30 },
   earnings_revision: { min: -1.5, max: 1.5 },
   sector_earnings: { min: -1.5, max: 1.5 },
   profit_margin: { min: 5, max: 25 },

   // --- MACRO ECONOMY ---
   gdp: { min: 3.0, max: 9.0 },
   cpi: { min: 2.0, max: 7.5, inverse: true },
   repo: { min: 4.0, max: 8.0, inverse: true },
   policy_stance: { min: -1.5, max: 1.5 },
   fiscal_deficit: { min: 3.0, max: 8.0, inverse: true },
   current_account: { min: -5.0, max: 2.0 },

   // --- FLOWS & LIQUIDITY ---
   fii: { min: -30000, max: 30000 },
   dii: { min: -20000, max: 20000 },
   fii_trend: { min: -1.5, max: 1.5 },
   system_liquidity: { min: -400000, max: 400000 },
   mf_flows: { min: -15000, max: 40000 },

   // --- SECTOR HEALTH ---
   sector_valuation: { min: -1.5, max: 1.5 },
   sector_growth: { min: -15, max: 25 },
   sector_concentration: { min: 35, max: 75, inverse: true },
   cyc_def: { min: -12, max: 12 },

   // --- CREDIT & CORPORATE ---
   corp_debt: { min: 35, max: 85, inverse: true },
   credit_growth: { min: 3, max: 22 },
   tax_env: { min: -1.5, max: 1.5 },
   policy_tailwinds: { min: -1, max: 1 },

   // --- GLOBAL FACTORS ---
   global_growth: { min: -1.5, max: 1.5 },
   crude: { min: 50, max: 130, inverse: true },
   usdinr: { min: 72, max: 92, inverse: true },
   global_liq: { min: -1.5, max: 1.5 },

   // --- RISK & STABILITY ---
   sovereign_risk: { min: -1.5, max: 1.5 },
   npa: { min: 2.0, max: 12.0, inverse: true },
   reform_momentum: { min: -1.5, max: 1.5 },
};
