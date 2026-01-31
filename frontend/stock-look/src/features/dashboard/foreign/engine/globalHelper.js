/**
 * Global Structure Engine
 * Handles scoring, regime classification, and section logic for Global indicators.
 */

// Section weights for Global Structure
export const globalSections = [
    { id: "currency", label: "FX", w: 0.30, icon: "💱" },
    { id: "indices", label: "Indices", w: 0.35, icon: "📊" },
    { id: "commodities", label: "Commod", w: 0.20, icon: "🛢️" },
    { id: "rates", label: "Rates", w: 0.15, icon: "📈" }
];

/**
 * Calculates the composite global structure score based on cards.
 * Uses weighted section averages with reliability factoring.
 */
export function calculateGlobalComposite(cards) {
    if (!cards || cards.length === 0) return 50;

    // Group cards by category
    const sectionScores = {};
    const sectionCounts = {};

    cards.forEach(card => {
        const category = card.category || "Other";
        if (!sectionScores[category]) {
            sectionScores[category] = 0;
            sectionCounts[category] = 0;
        }

        // Convert normalized (-1 to 1) to score (0 to 100)
        const score = ((card.normalized + 1) / 2) * 100;
        const reliability = card.creditScore || 0.8;

        sectionScores[category] += score * reliability;
        sectionCounts[category] += reliability;
    });

    // Calculate weighted composite
    let totalWeightedScore = 0;
    let totalWeight = 0;

    globalSections.forEach(section => {
        const sectionKey = section.label;
        if (sectionScores[sectionKey] && sectionCounts[sectionKey] > 0) {
            const avgScore = sectionScores[sectionKey] / sectionCounts[sectionKey];
            totalWeightedScore += avgScore * section.w;
            totalWeight += section.w;
        }
    });

    if (totalWeight === 0) return 50;

    const composite = totalWeightedScore / totalWeight;
    return Math.round(Math.min(100, Math.max(0, composite)));
}

/**
 * Calculate section scores for display
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

    // Return averaged scores
    const result = {};
    Object.keys(sectionScores).forEach(section => {
        if (sectionCounts[section] > 0) {
            result[section] = Math.round(sectionScores[section] / sectionCounts[section]);
        }
    });

    return result;
}

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
