/**
 * @file journalEngine.js
 * @purpose Core calculations for Journal performance and insights.
 * @responsibilities
 * - Calculates weighted execution scores.
 * - Generates high-level journal insights based on trade data and psychology.
 * @key_exports
 * - calculateExecutionScore
 * - generateJournalInsights
 * @dependencies
 * - None (Pure Logic)
 * @lifecycle
 * - Used by PerformanceAnalytics and JournalAIInsights components.
 * @date 2026-02-03
 */

// =============================
// Constants & Config
// =============================
const SCORE_WEIGHTS = {
    ruleAdherence: 0.3,
    riskSizing: 0.25,
    exitDiscipline: 0.2,
    entryTiming: 0.15,
    emotionalStability: 0.1
};

// =============================
// Core Logic: Scoring
// =============================

/**
 * Calculates a weighted execution score from breakdown metrics.
 * @param {Object} breakdown - Object containing score components (0-100).
 * @returns {number} Weighted average score (rounded).
 */
export function calculateExecutionScore(breakdown) {
    if (!breakdown) return 0;
    let total = 0;
    for (const [key, val] of Object.entries(breakdown)) {
        total += val * (SCORE_WEIGHTS[key] || 0);
    }
    return Math.round(total);
}

// =============================
// Core Logic: Insights Generation
// =============================

/**
 * Generates actionable insights from aggregated trade data.
 * @param {Object} data - Contains `trades` array and `psychology` aggregated data.
 * @returns {Array} List of insight objects.
 */
export function generateJournalInsights(data) {
    if (!data || !data.trades) return [];

    const { trades } = data;
    const rushedTrades = trades.filter(t => t.psychology?.state === "Rushed");
    const violations = trades.filter(t => t.execution?.errors?.length > 0);

    const insights = [];

    // --- 1. Emotion Insight (FOMO) ---
    if (rushedTrades.length > 0) {
        const rushedLosses = rushedTrades.filter(t => t.outcome === "Loss").length;
        const failureRate = rushedLosses / rushedTrades.length;

        if (failureRate > 0.5) {
            insights.push({
                title: "FOMO Detection",
                text: `Your 'Rushed' entries have a ${(failureRate * 100).toFixed(0)}% failure rate. Enforce a 5-minute wait rule after signal generation.`,
                type: "Behavioral"
            });
        }
    }

    // --- 2. Rule Adherence ---
    if (violations.length > 2) {
        insights.push({
            title: "Discipline Drift",
            text: "Multiple SL violations detected this week. This reduces Expectancy by roughly 0.4R per violation.",
            type: "Critical"
        });
    }

    return insights;
}
