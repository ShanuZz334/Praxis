/**
 * @file journalAIEngine.js
 * @purpose Generates AI-driven analysis for individual trades.
 * @responsibilities
 * - Analyzes execution summary (R-Multiple, Outcome).
 * - Reviews rule adherence and violations.
 * - Attributes failure or success to primary/secondary drivers.
 * - Evaluates trade context against regime.
 * - Diagnoses behavioral triggers (FOMO, Revenge).
 * - Suggests actionable corrections.
 * @key_exports
 * - generateTradeAnalysis (Core Function)
 * @dependencies
 * - None (Pure Logic)
 * @lifecycle
 * - Called by TradeDeepDive or JournalPage when analyzing specific trades.
 * @date 2026-02-03
 */

// =============================
// Core Logic: Trade Analysis
// =============================

/**
 * Generates a comprehensive text analysis of a trade.
 * @param {Object} trade - The trade object to analyze.
 * @returns {Object} Structured analysis (summary, review, attribution, etc.)
 */
export function generateTradeAnalysis(trade) {
    if (!trade) return null;

    // --- 1. Execution Summary ---
    const rMult = trade.rMultiple;
    const isWin = trade.outcome === "Win";
    const summary = isWin
        ? `This trade resulted in a ${rMult}R profit, capturing the expected move aligned with the ${trade.strategy} strategy.`
        : `This trade resulted in a ${rMult}R loss${rMult < -1 ? ", exceeding the predefined risk tolerance" : " within strategy variance"}, primarily driven by ${trade.failureAttribution?.primary?.toLowerCase() || "market noise"}.`;

    // --- 2. Rule Adherence Review ---
    const violations = trade.execution?.errors || [];
    const hasViolations = violations.length > 0;
    const ruleReview = hasViolations
        ? `Primary Breach: ${violations[0] || "None"}. Secondary: ${violations.slice(1).join(", ") || "None"}.`
        : "All execution rules respected. Entry and exit adhered to plan.";

    // --- 3. Failure/Success Attribution ---
    const attribution = trade.failureAttribution
        ? `${trade.failureAttribution.primary} (Primary), ${trade.failureAttribution.secondary} (Secondary).`
        : isWin ? "N/A - Successful Trade" : "Market Noise (Standard deviations).";

    // --- 4. Context Evaluation ---
    const regime = trade.context?.regime || "Neutral";
    const strategy = trade.strategy || "Standard";
    const RegimeSuitability = regime.includes("Choppy") && strategy.includes("Trend")
        ? "MISMATCH: Trend strategy deployed in Choppy regime."
        : "ALIGNED: Strategy matched market context.";

    // --- 5. Behavioral Diagnostic ---
    let behavior = "State: Neutral. No significant emotional interference.";
    const psychState = trade.psychology?.state;

    if (psychState === "Rushed") {
        behavior = "Trigger: Fear of Missing Out (FOMO). Response: Entered prior to signal confirmation. Impact: Reduced probability of success and exposed capital to unconfirmed trend.";
    } else if (psychState === "Frustrated") {
        behavior = "Trigger: Previous loss event. Response: Widened stop-loss to avoid realization. Impact: Significantly increased R-risk beyond plan.";
    }

    // --- 6. Actionable Correction ---
    const correction = trade.ruleInjection
        ? `${trade.ruleInjection.action} (Trigger: ${trade.ruleInjection.trigger})`
        : isWin ? "Maintain current process verification." : "Review setup criteria for false signals.";

    return {
        summary,
        ruleReview,
        attribution,
        context: `Regime: ${regime}. Volatility: ${trade.context?.vol || "Normal"}. Suitability: ${RegimeSuitability}`,
        behavior,
        counterfactual: trade.counterfactual ? `If rules followed: ${trade.counterfactual.result} (Saved ${trade.counterfactual.saved})` : "N/A",
        correction
    };
}
