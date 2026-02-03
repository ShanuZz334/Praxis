/**
 * @file sections.config.js
 * @purpose Configuration for Fundamental Sections and their relative weights.
 * @responsibilities
 * - Defines the weight distribution for the composite score calculation.
 * - Ensures weights sum to 1.0 (100%).
 * @key_exports
 * - SECTION_WEIGHTS
 * @lifecycle
 * - Loaded by `index.js` for weighted aggregation.
 * @date 2026-02-03
 */

// =============================
// Weight Configuration
// =============================
export const SECTION_WEIGHTS = {
    // 15% - Core Valuation
    Valuation: 0.15,

    // 20% - Earnings Power
    Earnings: 0.20,

    // 20% - Macro Environment
    Macro: 0.20,

    // 20% - Liquidity Dynamics
    Liquidity: 0.20,

    // 10% - Sector Health
    Sector: 0.10,

    // 5% - Corporate Health
    Corporate: 0.05,

    // 5% - Global Factors
    Global: 0.05,

    // 5% - Systemic Risk
    Risk: 0.05,
};
