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
import { getNonMasterGaugeLabel, getNonMasterRegimeLabel } from '@/shared/global/logic/labelMappings';
import { getForeignWeights } from '@/config/weights/foreignWeights';
import { getForeignSectionWeights } from '@/config/weights/foreignSectionWeights';
import { TRADING_MODES } from '@/config/tradingModes';

// Re-export for backward compatibility
export const globalSections = baseSections;

// =============================
// Core Calculation Logic
// =============================

/**
 * Calculates a weighted composite score (0-100) from a list of data cards.
 * @param {Array} cards - Normalized data objects.
 * @param {string} mode - Trading mode.
 * @returns {number} Composite Score
 */
export function calculateGlobalComposite(cards, mode = TRADING_MODES.BALANCED) {
    if (!cards || cards.length === 0) return 50;

    // Fetch active weights
    const activeWeights = getForeignWeights(mode);
    const activeSectionWeights = getForeignSectionWeights({ tradingMode: mode });

    // 1. Accumulate Scores by Category (Weighted by individual card weight)
    const sectionScores = {};
    const sectionWeightSums = {};

    cards.forEach(card => {
        const category = card.category || "Other";
        const indicatorId = card.id || "";

        if (!sectionScores[category]) {
            sectionScores[category] = 0;
            sectionWeightSums[category] = 0;
        }

        // Normalize (-1..1) -> (0..100)
        const score = ((card.normalized + 1) / 2) * 100;
        const reliability = card.creditScore || 0.8;

        // Get mode-aware weight
        const weight = activeWeights[indicatorId] !== undefined ? activeWeights[indicatorId] : (card.weight || 0.1);
        const baseWeight = card.weight || 0.1;

        let multiplier = weight / baseWeight;
        if (mode === TRADING_MODES.BALANCED) multiplier = 1.0;

        const isFocused = mode !== TRADING_MODES.BALANCED && multiplier > 1.1;

        card.multiplier = multiplier;
        card.isFocused = isFocused;

        sectionScores[category] += score * reliability * weight;
        sectionWeightSums[category] += reliability * weight;
    });

    // 2. Apply Section Weights
    let totalWeightedScore = 0;
    let totalWeight = 0;

    activeSectionWeights.forEach(section => {
        const key = section.label;
        if (sectionScores[key] && sectionWeightSums[key] > 0) {
            const avgScore = sectionScores[key] / sectionWeightSums[key];
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
 * @param {string} mode
 * @returns {Object} Map of Category -> Score (0-100)
 */
export function calculateSectionScores(cards, mode = TRADING_MODES.BALANCED) {
    const activeWeights = getForeignWeights(mode);
    const sectionScores = {};
    const sectionWeightSums = {};

    cards.forEach(card => {
        const category = card.category || "Other";
        const indicatorId = card.id || "";

        if (!sectionScores[category]) {
            sectionScores[category] = 0;
            sectionWeightSums[category] = 0;
        }

        const score = ((card.normalized + 1) / 2) * 100;
        const reliability = card.creditScore || 0.8;
        const weight = activeWeights[indicatorId] !== undefined ? activeWeights[indicatorId] : (card.weight || 0.1);

        sectionScores[category] += score * reliability * weight;
        sectionWeightSums[category] += reliability * weight;
    });

    const result = {};
    Object.keys(sectionScores).forEach(section => {
        if (sectionWeightSums[section] > 0) {
            result[section] = Math.round(sectionScores[section] / sectionWeightSums[section]);
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
            impact: c.reason,
            value: Math.round(c.normalized * 100)
        }));
}

export function extractGlobalRisks(cards) {
    return cards
        .filter(c => c.normalized < -0.2)
        .sort((a, b) => a.normalized - b.normalized)
        .slice(0, 3)
        .map(c => ({
            label: c.label,
            impact: c.reason,
            value: Math.round(Math.abs(c.normalized) * 100)
        }));
}

// =============================
// Regime Classification
// =============================

/**
 * getGlobalRegime
 * Maps the score to a market environment classification (Table 4).
 * @param {number} score - Composite Global Score
 * @param {Array} cards - Card data needed for high-precision confidence calculation
 * @param {string} mode - Trading Mode
 */
export function getGlobalRegime(score, cards = [], mode = TRADING_MODES.BALANCED) {
    const regime = getNonMasterRegimeLabel(score);
    const activeSectionWeights = getForeignSectionWeights({ tradingMode: mode });

    // 3. High-Precision Confidence (Weighted Variance Damping)
    const categoryScores = calculateSectionScores(cards, mode);
    let weightedVariance = 0;
    let totalWeightUsed = 0;

    activeSectionWeights.forEach(section => {
        const key = section.label;
        if (categoryScores[key] !== undefined) {
            weightedVariance += section.w * Math.pow(categoryScores[key] - score, 2);
            totalWeightUsed += section.w;
        }
    });

    const confidence = Math.max(75, Math.min(98, 100 - (weightedVariance / (totalWeightUsed || 1) / 15.0)));

    return {
        ...regime,
        confidence: Math.round(confidence),
        prevScore: Math.max(0, Math.min(100, score - 2.5))
    };
}

/**
 * getGlobalGauge
 * Maps the score to a macro structural health indicator (Table 3).
 */
export function getGlobalGauge(score) {
    return getNonMasterGaugeLabel(score);
}
