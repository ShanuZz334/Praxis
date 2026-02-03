/**
 * @file scoring.js
 * @purpose Engine for calculating event-specific impact scores.
 * @responsibilities
 * - Computes a predictive impact score for scheduled events.
 * - Factors in historical volatility, surprise frequency, and market sensitivity.
 * - Normalizes data inputs into a unified score for prioritization.
 * @key_exports
 * - calculateEventSelfScore (Function): Returns the computed score.
 * @dependencies
 * - None
 * @lifecycle
 * - Called during event data initialization or re-processing.
 * @date 2026-02-03
 */

// =============================
// Core Logic
// =============================

/**
 * calculateEventSelfScore
 * Computes a weighted score representing the potential market impact of a scheduled event.
 * @param {Object} event - The event data object.
 * @returns {number} - The calculated impact score (0-10).
 */
export function calculateEventSelfScore(event) {
    if (!event) return 0;

    // 1. Historical Volatility Reaction (30%)
    // Normalized 0-10 based on past IV spikes or Nifty moves
    const histVol = event.historicalImpact?.ivSpike || 0;
    const volScore = Math.min(10, histVol / 2); // Cap at 10 (e.g. 20% spike = 10)

    // 2. Surprise Magnitude Factor (25%)
    const surpriseWeight = event.surpriseFrequency || 5;

    // 3. Index Sensitivity (20%)
    const sensitivity = event.marketSensitivity === 'High' ? 10 :
        event.marketSensitivity === 'Medium' ? 6 : 3;

    // 4. Frequency Penalty (15%)
    // Rare events act as higher impact shocks compared to frequent ones
    const freqScore = event.frequency === 'Annual' ? 10 :
        event.frequency === 'Quarterly' ? 8 :
            event.frequency === 'Monthly' ? 5 : 2;

    // 5. Global Spillover (10%)
    const globalScore = event.globalCorrelation || 0;

    // Weighted Sum Calculation
    const rawScore =
        (volScore * 0.30) +
        (surpriseWeight * 0.25) +
        (sensitivity * 0.20) +
        (freqScore * 0.15) +
        (globalScore * 0.10);

    return parseFloat(rawScore.toFixed(1));
}
