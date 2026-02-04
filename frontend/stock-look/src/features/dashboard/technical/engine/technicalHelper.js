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

// Re-export for backward compatibility
export const technicalSections = baseSections;

// =============================
// Core Scoring Logic
// =============================

export function calculateTechnicalComposite(cards = []) {
    if (!cards || cards.length === 0) return 50;

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

    if (totalWeight === 0) return 50;

    const composite = totalWeightedScore / totalWeight;

    // Clamp between 0 and 100
    return Math.min(100, Math.max(0, composite));
}

/**
 * Derived Technical Regime based on score
 */
export function getTechnicalRegime(score) {
    if (score >= 65) return {
        label: "Trend Following",
        desc: "Strong directional conviction",
        color: "text-state-bullish-text",
        bg: "bg-emerald-500"
    };
    if (score <= 35) return {
        label: "Distribution",
        desc: "Selling pressure dominant",
        color: "text-state-bearish-text",
        bg: "bg-red-500"
    };
    if (score >= 45 && score <= 55) return {
        label: "Chop / Noise",
        desc: "Lack of clear direction",
        color: "text-state-neutral-text",
        bg: "bg-slate-500"
    };
    return {
        label: "Mean Reversion",
        desc: "Counter-trend opportunities",
        color: "text-state-neutral-text",
        bg: "bg-yellow-500"
    };
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
            creditPct: c.displayPct, // Used for UI display "+41%"
            icon: getIconForTechCategory(c.category),
            desc: "Bullish Driver"
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
            creditPct: c.displayPct, // Used for UI display "-33%"
            icon: getIconForTechCategory(c.category),
            desc: "Bearish Drag"
        }));
}
