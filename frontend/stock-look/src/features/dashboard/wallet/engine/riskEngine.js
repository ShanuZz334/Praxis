/**
 * @file riskEngine.js
 * @purpose Provides logic for risk assessment and portfolio insights.
 * @responsibilities
 * - Calculates risk regime scores based on drawdown and allocation.
 * - Runs margin stress tests for volatility scenarios.
 * - Generates natural language insights on portfolio health.
 * @key_exports
 * - calculateRiskRegime
 * - runMarginStressTest
 * - generateWalletInsights
 * @dependencies
 * - None (Pure Logic)
 * @lifecycle
 * - Used by WalletPage to drive UI feedback.
 * @date 2026-02-03
 */

export function calculateRiskRegime(data) {
    const { drawdown, allocation, pnl } = data;

    // Simple logic score
    let score = 50; // Base balanced

    // Adjust by DD
    if (drawdown.current > 4) score += 30; // High risk
    else if (drawdown.current > 2) score += 10;

    // Adjust by Options alloc
    const optAlloc = allocation.find(a => a.id === 'options')?.value || 0;
    if (optAlloc > 20) score += 15;

    // Adjust by recent PnL (Confidence)
    if (pnl.todayPct < -1) score += 10; // Tilted

    // Determine Label
    let label = 'Balanced';
    if (score > 75) label = 'Aggressive';
    if (score < 30) label = 'Conservative';

    return {
        label,
        score: Math.min(100, Math.max(0, score)),
        confidence: pnl.winRateToday // correlate confidence to win rate roughly
    };
}

export function runMarginStressTest(currentUsed) {
    // Simulating margin expansion based on VIX shocks
    return [
        { scenario: 'Baseline', margin: currentUsed, change: 0 },
        { scenario: 'VIX +10%', margin: currentUsed * 1.12, change: 12 },
        { scenario: 'VIX +20%', margin: currentUsed * 1.25, change: 25 },
        { scenario: 'Gap Down 2%', margin: currentUsed * 1.40, change: 40 },
    ];
}

export function generateWalletInsights(data) {
    const insights = [];
    const { allocation, drawdown, optionsStats } = data;

    // 1. Allocation Check
    const cash = allocation.find(a => a.id === 'cash')?.value || 0;
    if (cash < 15) {
        insights.push({
            type: 'warning',
            title: 'Low Cash Buffer',
            text: `Cash is at ${cash}%. Recommended > 15% for volatility absorbtion.`
        });
    }

    // 2. Options Risk
    if (Math.abs(optionsStats.netDelta) > 5) {
        insights.push({
            type: 'danger',
            title: 'High Directional Risk',
            text: `Net Delta is excessive (${optionsStats.netDelta}). Hedge required.`
        });
    } else {
        insights.push({
            type: 'success',
            title: 'Delta Neutral',
            text: `Portfolio is well balanced with low directional exposure (${optionsStats.netDelta}).`
        });
    }

    // 3. Drawdown
    if (drawdown.current > drawdown.maxAllowed * 0.5) {
        insights.push({
            type: 'warning',
            title: 'Drawdown Caution',
            text: `Consumed 50% of risk budget. Tighten stops.`
        });
    }

    return insights;
}
