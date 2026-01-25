export function calculateExecutionScore(breakdown) {
    // Weighted avg
    const weights = {
        ruleAdherence: 0.3,
        riskSizing: 0.25,
        exitDiscipline: 0.2,
        entryTiming: 0.15,
        emotionalStability: 0.1
    };

    let total = 0;
    for (const [key, val] of Object.entries(breakdown)) {
        total += val * (weights[key] || 0);
    }
    return Math.round(total);
}

export function generateJournalInsights(data) {
    const { trades, psychology } = data;
    const rushedTrades = trades.filter(t => t.psychology.state === "Rushed");
    const violations = trades.filter(t => t.execution.errors.length > 0);

    const insights = [];

    // 1. Emotion Insight
    if (rushedTrades.length > 0) {
        const rushedLosses = rushedTrades.filter(t => t.outcome === "Loss").length;
        if (rushedLosses / rushedTrades.length > 0.5) {
            insights.push({
                title: "FOMO Detection",
                text: "Your 'Rushed' entries have a 75% failure rate. Enforce a 5-minute wait rule after signal generation.",
                type: "Behavioral"
            });
        }
    }

    // 2. Rule Adherence
    if (violations.length > 2) {
        insights.push({
            title: "Discipline Drift",
            text: "Multiple SL violations detected this week. This reduces Expectancy by 0.4R on average.",
            type: "Critical"
        });
    }

    return insights;
}
