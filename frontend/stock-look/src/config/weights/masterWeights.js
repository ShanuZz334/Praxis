/**
 * @file masterWeights.js
 * @purpose Centralized configuration for the Master Stocky Composite Score weighting.
 * @responsibilities
 * - Defines strategic weights for each intelligence module.
 * - Ensures weights are normalized to 1.0 (100%).
 * @date 2026-02-05
 */

/**
 * MASTER_WEIGHTS
 * These weights determine how much each individual engine contributes to the
 * overall Stocky Score (0-100) and market regime derivation.
 */
export const MASTER_WEIGHTS = {
    technical: 0.30,   // High-frequency signal alignment
    options: 0.25,     // Institutional positioning and Greeks
    fundamental: 0.20, // Long-term structural health
    global: 0.15,      // Macro environment and cross-asset sync
    events: 0.10       // Real-time catalysts and news sentiment
};

export default MASTER_WEIGHTS;
