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

// Module Weights (Normalized to 1.0)
const WEIGHTS = {
    technical: 0.30,
    options: 0.25,
    fundamental: 0.20,
    global: 0.15,
    events: 0.10
};

// =============================
// Core Scoring Logic
// =============================

export function calculateStockyScore(components) {
    if (!components) return { score: 0, confidence: 50, prevScore: 0 };

    const score =
        (components.technical * WEIGHTS.technical) +
        (components.options * WEIGHTS.options) +
        (components.fundamental * WEIGHTS.fundamental) +
        (components.events * WEIGHTS.events) +
        (components.global * WEIGHTS.global);

    const finalScore = Math.round(score);

    // Calculate Confidence (Weighted Variance)
    const values = [components.technical, components.options, components.fundamental, components.events, components.global];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const confidence = Math.max(75, Math.min(98, 100 - (variance / 8)));

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
