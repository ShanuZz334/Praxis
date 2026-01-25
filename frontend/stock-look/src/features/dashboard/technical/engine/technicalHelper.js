/**
 * Technical Analysis Engine
 * Handles scoring, regime classification, and section logic for Technical Indicators.
 */

// Weights for different technical sections
export const technicalSections = [
    { id: 'Trend', label: 'Trend', w: 0.25, icon: '📈' },
    { id: 'Momentum', label: 'Mom', w: 0.20, icon: '🚀' },
    { id: 'Volatility', label: 'Vol', w: 0.15, icon: '⚡' },
    { id: 'Volume', label: 'Vol', w: 0.15, icon: '📊' },
    { id: 'Breadth', label: 'Brd', w: 0.15, icon: '🌍' },
    { id: 'Structure', label: 'Str', w: 0.10, icon: '🏗️' }
];

/**
 * Calculates the composite technical score based on indicator cards.
 * Score = 50 + Sum( (SignalScore - 50) * Weight * Reliability * RegimeMultiplier )
 */
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
        color: "text-emerald-400",
        bg: "bg-emerald-500"
    };
    if (score <= 35) return {
        label: "Distribution",
        desc: "Selling pressure dominant",
        color: "text-red-400",
        bg: "bg-red-500"
    };
    if (score >= 45 && score <= 55) return {
        label: "Chop / Noise",
        desc: "Lack of clear direction",
        color: "text-slate-400",
        bg: "bg-slate-500"
    };
    return {
        label: "Mean Reversion",
        desc: "Counter-trend opportunities",
        color: "text-yellow-400",
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
