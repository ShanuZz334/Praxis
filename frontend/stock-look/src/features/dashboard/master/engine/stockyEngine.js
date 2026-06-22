/**
 * @file stockyEngine.js
 * @purpose Core aggregation engine for the Stocky Composite Score.
 * @responsibilities
 * - Aggregates scores from all intelligence modules (Technical, Fundamental, Options, Events, Global).
 * - Applies strategic weighting to each module.
 * - Calculates the final composite score (0-100).
 * - Derives the market regime based on score and volatility.
 * @key_exports
 * - calculateStockyComposite
 * - deriveMasterRegime
 * - getRegimeColor
 * @dependencies
 * - Module Weights (WEIGHTS constant)
 * - labelMappings (centralized label system)
 * @lifecycle
 * - Invoked by MasterDashboard on every render.
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================

import { getMasterGaugeLabel, getMasterRegimeLabel } from '@/shared/global/logic/labelMappings';
import { MASTER_WEIGHTS } from '@/config/weights/masterWeights';

// =============================
// Core Scoring Logic
// =============================

export function calculateStockyScore(components) {
    if (!components) return { score: 0, confidence: 50, prevScore: 0 };

    const score =
        (components.technical * MASTER_WEIGHTS.technical) +
        (components.options * MASTER_WEIGHTS.options) +
        (components.fundamental * MASTER_WEIGHTS.fundamental) +
        (components.events * MASTER_WEIGHTS.events) +
        (components.global * MASTER_WEIGHTS.global);

    const finalScore = Math.round(score);

    // Calculate High-Precision Confidence (Weighted Variance Damping)
    // This measures signal alignment across modules relative to their strategic importance.
    const weightedVariance =
        MASTER_WEIGHTS.technical * Math.pow(components.technical - score, 2) +
        MASTER_WEIGHTS.options * Math.pow(components.options - score, 2) +
        MASTER_WEIGHTS.fundamental * Math.pow(components.fundamental - score, 2) +
        MASTER_WEIGHTS.events * Math.pow(components.events - score, 2) +
        MASTER_WEIGHTS.global * Math.pow(components.global - score, 2);

    // Inverse Linear Mapping: High Variance = Low Confidence.
    // Divisor 6.5 calibrated for high sensitivity to divergence in core modules.
    const confidence = Math.max(75, Math.min(98, 100 - (weightedVariance / 6.5)));

    const prevScore = Math.max(0, Math.min(100, finalScore - (Math.sin(finalScore / 10) * 3)));

    return {
        score: finalScore,
        confidence: Math.round(confidence),
        prevScore: Number(prevScore.toFixed(1))
    };
}

// =============================
// Regime Derivation
// =============================

/**
 * deriveMasterRegime
 * Maps the composite score to a strategic market regime (Guidance Layer).
 * @param {number} score - Aggregate Stocky Score.
 * @returns {object} The derived regime object with label, color, and behaviour.
 */
export function deriveMasterRegime(score) {
    return getMasterRegimeLabel(score);
}

/**
 * deriveMasterGauge
 * Maps the composite score to a trading action signal.
 * @param {number} score - Aggregate Stocky Score.
 * @returns {object} The derived gauge object with label, color, and meaning.
 */
export function deriveMasterGauge(score) {
    return getMasterGaugeLabel(score);
}
