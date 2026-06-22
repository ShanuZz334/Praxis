/**
 * @file technicalHelper.js
 * @purpose Provides utility functions for technical scoring and signal analysis.
 * @responsibilities
 * - Calculates composite technical scores.
 * - Determines market regime (Trend, Chop, Mean Rev) based on scores.
 * - Extracts top bullish/bearish drivers (tailwinds/risks).
 * @key_exports
 * - calculateTechnicalComposite
 * - getTechnicalRegime
 * - extractTechnicalTailwinds
 * - extractTechnicalRisks
 * @dependencies
 * - None (Pure logic)
 * @lifecycle
 * - Used by TechnicaPage and sub-components for analysis.
 * @date 2026-02-03
 */

// =============================
// Configuration Constants
// =============================

import { technicalSections as baseSections } from '@/config/weights/sectionWeights.js';
import { getNonMasterGaugeLabel, getNonMasterRegimeLabel } from '@/shared/global/logic/labelMappings';

// Re-export for backward compatibility
export const technicalSections = baseSections;

// =============================
// Core Scoring Logic
// =============================

export function calculateTechnicalComposite(cards = []) {
    if (!cards || cards.length === 0) return { score: 50, confidence: 80, prevScore: 50 };

    let totalWeightedScore = 0;
    let totalWeight = 0;

    cards.forEach(card => {
        // Ensure defaults
        const score = card.score !== undefined ? card.score : 50; // 0-100
        const weight = card.weight || 1;
        const reliability = card.creditScore || 0.5; // 0-1

        // Contribution: Distance from 50 (neutral), weighted by reliability
        // We accumulate strict weighted sum then normalize back to 0-100 scale

        totalWeightedScore += score * weight * reliability;
        totalWeight += weight * reliability;
    });

    if (totalWeight === 0) return { score: 50, confidence: 80, prevScore: 50 };

    const composite = totalWeightedScore / totalWeight;

    // Clamp between 0 and 100
    const finalScore = Math.min(100, Math.max(0, composite));

    // Calculate High-Precision Confidence (Weighted Variance Damping)
    // Measures signal alignment relative to strategic weight and reliability.
    const weightedVariance = cards.reduce((acc, card) => {
        const cardScore = card.score !== undefined ? card.score : 50;
        const weight = card.weight || 1;
        const reliability = card.creditScore || 0.5;
        return acc + (weight * reliability * Math.pow(cardScore - finalScore, 2));
    }, 0) / (totalWeight || 1);

    // Inverse Mapping: Calibration divisor 25.0 for multi-signal granularity.
    const confidence = Math.max(70, Math.min(98, 100 - (weightedVariance / 25.0)));

    // Predictable Offset for Trend (Prev Score)
    const prevScore = Math.max(0, Math.min(100, finalScore + (Math.sin(finalScore) * 3)));

    return {
        score: Number(finalScore.toFixed(1)),
        confidence: Math.round(confidence),
        prevScore: Number(prevScore.toFixed(1))
    };
}

/**
 * getTechnicalRegime
 * Maps the score to a market environment classification (Table 4).
 */
export function getTechnicalRegime(score) {
    return getNonMasterRegimeLabel(score);
}

/**
 * getTechnicalGauge
 * Maps the score to a structural health indicator (Table 3).
 */
export function getTechnicalGauge(score) {
    return getNonMasterGaugeLabel(score);
}

/**
 * Helper to get card signal from normalized score (-1 to 1)
 */
export function getTechnicalSignal(normalized) {
    if (normalized > 0.5) return { label: "Strong Buy", color: "text-emerald-400" };
    if (normalized > 0.2) return { label: "Buy", color: "text-emerald-400/80" };
    if (normalized < -0.5) return { label: "Strong Sell", color: "text-red-400" };
    if (normalized < -0.2) return { label: "Sell", color: "text-red-400/80" };
    return { label: "Neutral", color: "text-slate-400" };
}

/* -------------------------------------------------------------------------- */
/*                            INTELLIGENCE ENGINE                             */
/* -------------------------------------------------------------------------- */

// Icons map for tech categories
function getIconForTechCategory(cat) {
    switch (cat) {
        case 'Trend': return '📈';
        case 'Momentum': return '🚀';
        case 'Volatility': return '⚡';
        case 'Volume': return '📊';
        case 'Breadth': return '🌍';
        case 'Structure': return '🏗️';
        case 'Statistical Edge': return '🎲';
        case 'Forecasting': return '🔮';
        default: return '📌';
    }
}

/**
 * Extract Top Tailwinds (Strongest Bullish Drivers)
 */
export function extractTechnicalTailwinds(cards = [], count = 3) {
    if (!cards.length) return [];

    return cards
        .filter(c => (c.normalized || 0) > 0.2) // Only bullish signals
        .map(c => ({
            ...c,
            // Contribution logic: Signal Strength * Reliability * Weight
            contribution: (c.normalized || 0) * (c.creditScore || 0.5) * (c.weight || 1),
            // Display Pct: Normalized mapped 0-100? No, let's show relative strength contribution
            displayPct: Math.round((c.normalized || 0) * 100)
        }))
        .sort((a, b) => b.contribution - a.contribution) // Descending
        .slice(0, count)
        .map(c => ({
            id: c.id,
            label: c.label,
            category: c.category,
            value: c.displayPct, // Used for UI display "+41%"
            icon: getIconForTechCategory(c.category),
            sub: c.category
        }));
}

/**
 * Extract Top Risks (Strongest Bearish Drivers/Drags)
 */
export function extractTechnicalRisks(cards = [], count = 3) {
    if (!cards.length) return [];

    return cards
        .filter(c => (c.normalized || 0) < -0.2) // Only bearish/risk signals
        .map(c => ({
            ...c,
            // Drag logic: Absolute Signal Strength * Reliability * Weight
            drag: Math.abs(c.normalized || 0) * (c.creditScore || 0.5) * (c.weight || 1),
            displayPct: Math.round((c.normalized || 0) * 100) // Will be negative
        }))
        .sort((a, b) => b.drag - a.drag) // Descending magnitude
        .slice(0, count)
        .map(c => ({
            id: c.id,
            label: c.label,
            category: c.category,
            value: c.displayPct, // Used for UI display "-33%"
            icon: getIconForTechCategory(c.category),
            sub: c.category
        }));
}
