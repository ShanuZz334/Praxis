/**
 * @file globalHelper.js
 * @purpose Utilities for calculating Global Market scores, regimes, and insights.
 * @responsibilities
 * - Defines weights for different global sections (FX, Indices, Commodities, Rates).
 * - computes composite scores based on multi-asset inputs.
 * - Extracts key "Tailwinds" (positive drivers) and "Risks" (negative drivers).
 * - Determines the overall "Market Regime" (Risk-On / Risk-Off).
 * @key_exports
 * - globalSections (Config)
 * - calculateGlobalComposite (Logic)
 * - getGlobalRegime (Logic)
 * @dependencies
 * - None (Pure utility)
 * @lifecycle
 * - Used by globalRiskEngine and UI components.
 * @date 2026-02-03
 */

// =============================
// Configuration
// =============================

import { globalSections as baseSections } from '../../../../config/weights/foreignSectionWeights.js';

// Re-export for backward compatibility
export const globalSections = baseSections;

// =============================
// Core Calculation Logic
// =============================

/**
 * Calculates a weighted composite score (0-100) from a list of data cards.
 * @param {Array} cards - Normalized data objects.
 * @returns {number} Composite Score
 */
export function calculateGlobalComposite(cards) {
    if (!cards || cards.length === 0) return 50;

    // 1. Accumulate Scores by Category
    const sectionScores = {};
    const sectionCounts = {};

    cards.forEach(card => {
        const category = card.category || "Other";
        if (!sectionScores[category]) {
            sectionScores[category] = 0;
            sectionCounts[category] = 0;
        }

        // Normalize (-1..1) -> (0..100)
        const score = ((card.normalized + 1) / 2) * 100;
        const reliability = card.creditScore || 0.8;

        sectionScores[category] += score * reliability;
        sectionCounts[category] += reliability;
    });

    // 2. Apply Section Weights
    let totalWeightedScore = 0;
    let totalWeight = 0;

    globalSections.forEach(section => {
        const key = section.label;
        if (sectionScores[key] && sectionCounts[key] > 0) {
            const avgScore = sectionScores[key] / sectionCounts[key];
            totalWeightedScore += avgScore * section.w;
            totalWeight += section.w;
        }
    });

    if (totalWeight === 0) return 50;

    const composite = totalWeightedScore / totalWeight;
    return Math.round(Math.min(100, Math.max(0, composite)));
}

/**
 * Computes individual category scores for display in the UI.
 * @param {Array} cards 
 * @returns {Object} Map of Category -> Score (0-100)
 */
export function calculateSectionScores(cards) {
    const sectionScores = {};
    const sectionCounts = {};

    cards.forEach(card => {
        const category = card.category || "Other";
        if (!sectionScores[category]) {
            sectionScores[category] = 0;
            sectionCounts[category] = 0;
        }

        const score = ((card.normalized + 1) / 2) * 100;
        const reliability = card.creditScore || 0.8;

        sectionScores[category] += score * reliability;
        sectionCounts[category] += reliability;
    });

    const result = {};
    Object.keys(sectionScores).forEach(section => {
        if (sectionCounts[section] > 0) {
            result[section] = Math.round(sectionScores[section] / sectionCounts[section]);
        }
    });

    return result;
}

// =============================
// Insight Extraction
// =============================

export function extractGlobalTailwinds(cards) {
    return cards
        .filter(c => c.normalized > 0.3)
        .sort((a, b) => b.normalized - a.normalized)
        .slice(0, 3)
        .map(c => ({
            label: c.label,
            impact: c.reason
        }));
}

export function extractGlobalRisks(cards) {
    return cards
        .filter(c => c.normalized < -0.2)
        .sort((a, b) => a.normalized - b.normalized)
        .slice(0, 3)
        .map(c => ({
            label: c.label,
            impact: c.reason
        }));
}

// =============================
// Regime Classification
// =============================

export function getGlobalRegime(score) {
    if (score >= 65) {
        return {
            label: "Risk-On",
            desc: "Favorable global conditions",
            color: "text-state-bullish-text",
            confidence: 85
        };
    } else if (score <= 35) {
        return {
            label: "Risk-Off",
            desc: "Defensive positioning recommended",
            color: "text-state-bearish-text",
            confidence: 82
        };
    } else {
        return {
            label: "Mixed",
            desc: "Rotational environment",
            color: "text-state-neutral-text",
            confidence: 70
        };
    }
}
