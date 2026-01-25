export function generateTradeAnalysis(trade) {
    if (!trade) return null;

    // 1. EXECUTION SUMMARY
    const rMult = trade.rMultiple;
    const isWin = trade.outcome === "Win";
    const summary = isWin
        ? `This trade resulted in a ${rMult}R profit, capturing the expected move aligned with the ${trade.strategy} strategy.`
        : `This trade resulted in a ${rMult}R loss${rMult < -1 ? ", exceeding the predefined risk tolerance" : " within strategy variance"}, primarily driven by ${trade.failureAttribution?.primary?.toLowerCase() || "market noise"}.`;

    // 2. RULE ADHERENCE
    const violations = trade.execution.errors || [];
    const hasViolations = violations.length > 0;
    const ruleReview = hasViolations
        ? `Primary Breach: ${violations[0] || "None"}. Secondary: ${violations.slice(1).join(", ") || "None"}.`
        : "All execution rules respected. Entry and exit adhered to plan.";

    // 3. FAILURE ATTRIBUTION
    const attribution = trade.failureAttribution
        ? `${trade.failureAttribution.primary} (Primary), ${trade.failureAttribution.secondary} (Secondary).`
        : isWin ? "N/A - Successful Trade" : "Market Noise (Standard deviations).";

    // 4. CONTEXT EVALUATION
    const RegimeSuitability = trade.context.regime.includes("Choppy") && trade.strategy.includes("Trend")
        ? "MISMATCH: Trend strategy deployed in Choppy regime."
        : "ALIGNED: Strategy matched market context.";

    // 5. BEHAVIORAL DIAGNOSTIC
    let behavior = "State: Neutral. No significant emotional interference.";
    if (trade.psychology.state === "Rushed") {
        behavior = "Trigger: Fear of Missing Out (FOMO). Response: Entered prior to signal confirmation. Impact: Reduced probability of success and exposed capital to unconfirmed trend.";
    } else if (trade.psychology.state === "Frustrated") {
        behavior = "Trigger: Previous loss event. Response: Widened stop-loss to avoid realization. Impact: Significantly increased R-risk beyond plan.";
    }

    // 6. ACTIONABLE CORRECTION
    const correction = trade.ruleInjection
        ? `${trade.ruleInjection.action} (Trigger: ${trade.ruleInjection.trigger})`
        : isWin ? "Maintain current process verification." : "Review setup criteria for false signals.";

    return {
        summary,
        ruleReview,
        attribution,
        context: `Regime: ${trade.context.regime}. Volatility: ${trade.context.vol}. Suitability: ${RegimeSuitability}`,
        behavior,
        counterfactual: trade.counterfactual ? `If rules followed: ${trade.counterfactual.result} (Saved ${trade.counterfactual.saved})` : "N/A",
        correction
    };
}
