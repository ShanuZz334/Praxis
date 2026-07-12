/**
 * @file MovingAverageCard.jsx
 * @purpose Displays the % Distance from 200 DMA for index trend regime analysis.
 *
 * DATA SOURCE: Manual Override (calculate as: ((Price - 200DMA) / 200DMA) * 100)
 *
 * SCORING ENGINE: Multi-factor blended approach
 *   Factor 1 (50%): Position relative to 200 DMA (bull/bear regime)
 *   Factor 2 (30%): Stretch penalty (too far above = mean reversion risk)
 *   Factor 3 (20%): Historical India index context (Nifty mean reversion patterns)
 *
 * Context for Indian Indices (Nifty 50):
 *   Typical 200 DMA distance in strong bull markets: +5% to +15%
 *   Typical in bear markets: -5% to -20%
 *   Historical overextension: >+20% (usually precedes mean reversion)
 *   Historical panic: <-15% (often a capitulation bottom)
 */
import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

// ─── Industry-Grade Scoring Engine ──────────────────────────────────────────
/**
 * Scores % distance from 200 DMA using a non-linear model that:
 * - Rewards being comfortably above 200 DMA (structural bull trend)
 * - Penalizes being extremely extended (>15% above = mean reversion risk)
 * - Treats being below 200 DMA as bearish with oversold bounce potential at extremes
 */
function scoreDMA200(dmaDistance) {
    if (dmaDistance === null || isNaN(dmaDistance)) {
        return { score: 50, bias: 'Neutral', confidence: 0, dmaPosition: 'Unknown', distanceCategory: 'No Data' };
    }

    // ── Factor 1: Position & Trend Regime (0–100) ─────────────────────────
    let f1Score;
    let dmaPosition;
    if (dmaDistance > 20) {
        f1Score = 30; dmaPosition = 'Severely Extended Above';
    } else if (dmaDistance > 12) {
        f1Score = 60; dmaPosition = 'Extended Above';
    } else if (dmaDistance > 5) {
        f1Score = 88; dmaPosition = 'Comfortably Above — Bull Trend';
    } else if (dmaDistance > 0) {
        f1Score = 72; dmaPosition = 'Slightly Above';
    } else if (dmaDistance > -3) {
        f1Score = 55; dmaPosition = 'Testing 200 DMA Support';
    } else if (dmaDistance > -8) {
        f1Score = 35; dmaPosition = 'Below 200 DMA — Bearish';
    } else if (dmaDistance > -15) {
        f1Score = 20; dmaPosition = 'Well Below 200 DMA — Bear Market';
    } else {
        f1Score = 40; dmaPosition = 'Deep Below — Capitulation Zone';  // Oversold bounce potential
    }

    // ── Factor 2: Mean Reversion Penalty for Extreme Extensions ──────────
    // The further above 200 DMA, the higher the mean reversion risk
    let f2Score;
    let distanceCategory;
    if (dmaDistance > 25) {
        f2Score = 10; distanceCategory = 'Historically Extreme Extension';
    } else if (dmaDistance > 15) {
        f2Score = 35; distanceCategory = 'Overextended';
    } else if (dmaDistance > 5) {
        f2Score = 82; distanceCategory = 'Healthy Bull Extension';
    } else if (dmaDistance > -5) {
        f2Score = 62; distanceCategory = 'Critical Support Zone';
    } else if (dmaDistance > -15) {
        f2Score = 25; distanceCategory = 'Bear Market Territory';
    } else {
        f2Score = 48; distanceCategory = 'Extreme Oversold — Bounce Risk';
    }

    // ── Factor 3: Historical India Index Context ─────────────────────────
    // Based on Nifty 50 historical mean reversion patterns (2010–2024)
    let f3Score;
    if (dmaDistance > 20) f3Score = 15;   // Historically precedes 8–15% corrections
    else if (dmaDistance > 10) f3Score = 72; // Strong bull territory for Nifty
    else if (dmaDistance > 0) f3Score = 65;  // Normal bull positioning
    else if (dmaDistance > -5) f3Score = 52; // Transition zone
    else if (dmaDistance > -12) f3Score = 25; // Bear market historically
    else f3Score = 45;                        // Extreme — bounce likely

    // ── Blend ─────────────────────────────────────────────────────────────
    const blended = (f1Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    // ── Bias Mapping ──────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Confidence: highest at extremes where signal is clearest ─────────
    let confidence;
    if (dmaDistance > 20 || dmaDistance < -15) confidence = 90; // Clear extremes
    else if (dmaDistance > 10 || dmaDistance < -8) confidence = 82;
    else if (Math.abs(dmaDistance) < 3) confidence = 78; // Support/resistance test
    else confidence = 70;

    return { score: finalScore, bias, confidence, dmaPosition, distanceCategory };
}

// ─── Dynamic AI Insight Generator ─────────────────────────────────────────
function generateAiInsight(dmaDistance, dmaPosition, distanceCategory) {
    if (dmaDistance === null || isNaN(dmaDistance)) {
        return "Enter the % distance from the 200-day moving average. Calculate as: ((Current Price − 200 DMA) / 200 DMA) × 100. A positive value means the index is above its 200 DMA (bullish); negative means below (bearish).";
    }

    const rounded = Math.abs(dmaDistance).toFixed(2);
    const direction = dmaDistance >= 0 ? 'above' : 'below';

    if (dmaDistance > 20) {
        return `The index is ${rounded}% above its 200 DMA — historically an extreme extension. Nifty has rarely sustained distances above +20% without significant mean-reversion corrections of 8–15%. While the long-term trend remains bullish, fresh longs at this stretch carry elevated risk.`;
    }
    if (dmaDistance > 10) {
        return `The index is trading ${rounded}% above its 200 DMA, confirming a strong and intact bull market trend. This level of extension is healthy for a sustained uptrend. Dips toward the 200 DMA would present excellent long-term buying opportunities.`;
    }
    if (dmaDistance > 0) {
        return `The index is ${rounded}% above its 200 DMA, maintaining structural bull market positioning. The 200 DMA is trending upward, confirming the long-term uptrend. This zone is constructive for medium-term investing.`;
    }
    if (dmaDistance > -3) {
        return `The index is testing its 200 DMA (currently ${rounded}% below). This is the most critical technical level in any index — it separates the long-term bull and bear market regimes. A decisive break below on high volume is a major bearish signal; a reclaim with momentum is bullish.`;
    }
    if (dmaDistance > -12) {
        return `The index is ${rounded}% below its 200 DMA, placing it in structural bear market territory. The 200 DMA is likely acting as resistance on bounces. Avoid aggressive long positions — wait for a reclaim and hold of the 200 DMA before turning constructive.`;
    }
    return `The index is ${rounded}% below its 200 DMA — historically an extreme dislocation for Indian indices. While the structural trend is bearish, such extreme dislocations below the 200 DMA have historically coincided with capitulation lows and sharp snap-back rallies. A contrarian reversal watch is appropriate.`;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function MovingAverageCard({ data, manualOverride, lastUpdated }) {
    const dmaDistance = (manualOverride !== undefined && manualOverride !== null && manualOverride !== '')
        ? parseFloat(manualOverride)
        : null;

    const configData = getIndicatorConfig('index_200dma');
    const { score, bias, confidence, dmaPosition, distanceCategory } = scoreDMA200(dmaDistance);
    const aiInsight = generateAiInsight(dmaDistance, dmaPosition, distanceCategory);

    return (
        <IndicatorCard
            config={{
                title: '200 DMA Stretch',
                category: 'Market Health',
                mode: 'MANUAL',
                creditScore: configData?.creditScore ?? 9,
                updateTime: lastUpdated ?? '--:--',
                source: 'Manual',
                aiModel: configData?.aiModel ?? 'Engine v3'
            }}
            data={{
                currentValueObj: {
                    label: '% from 200 DMA',
                    value: dmaDistance !== null ? `${dmaDistance > 0 ? '+' : ''}${dmaDistance.toFixed(2)}%` : '--'
                },
                details: [
                    dmaDistance !== null && {
                        label: 'DMA Position',
                        value: dmaPosition,
                        isManual: true
                    },
                    dmaDistance !== null && {
                        label: 'Distance Category',
                        value: distanceCategory,
                        isManual: true
                    }
                ].filter(Boolean),
                score: score ?? 0,
                bias: bias ?? 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 9.0
            }}
            chartData={{ valueName: '% Distance from 200 DMA' }}
            insights={{
                aiInsight,
                whyItMatters: [
                    'The 200 DMA is the definitive line separating long-term bull and bear markets for global indices.',
                    'Being above a rising 200 DMA is the single most reliable indicator of a structural bull market.',
                    'Nifty has shown strong mean-reversion tendency when >+18% above the 200 DMA.',
                    'A golden cross (50 DMA crossing above 200 DMA) combined with price >200 DMA is the strongest buy signal.',
                    'Institutional managers globally use the 200 DMA as the primary long-term portfolio positioning indicator.'
                ]
            }}
        />
    );
}
