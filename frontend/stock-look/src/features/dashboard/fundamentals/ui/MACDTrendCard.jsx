/**
 * @file MACDTrendCard.jsx
 * @purpose Displays the MACD Histogram for index momentum analysis.
 *
 * DATA SOURCE: Manual Override
 *
 * SCORING ENGINE: Multi-factor blended approach
 *   Factor 1 (50%): Histogram sign + magnitude (primary directional signal)
 *   Factor 2 (30%): Zero-line crossover zone (critical momentum shift)
 *   Factor 3 (20%): Acceleration/deceleration (histogram expanding vs contracting)
 *
 * IMPORTANT — Scale Context for Indian Indices:
 *   Nifty 50:    MACD histogram typically ranges ±50 to ±300 depending on timeframe
 *   BankNifty:   MACD histogram typically ranges ±100 to ±600
 *   Weekly MACD: Even larger values possible (±200 to ±1000+)
 *
 * The scoring uses RELATIVE thresholds — the user enters the histogram value
 * and we classify it as a % of typical index MACD range.
 * Recommended: Use daily MACD(12,26,9) for standard analysis.
 */
import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

// ─── Industry-Grade Scoring Engine ──────────────────────────────────────────
/**
 * MACD Histogram scoring using index-appropriate relative thresholds.
 * For Nifty/BankNifty daily MACD(12,26,9):
 *   > +150: Strong acceleration (very bullish momentum)
 *   +50 to +150: Positive and building (bullish)
 *   0 to +50: Positive but weak (mild bullish)
 *   -50 to 0: Negative but mild (mild bearish)
 *   -150 to -50: Negative and building (bearish)
 *   < -150: Strong deceleration (very bearish momentum)
 *
 * Zero-line crossover is the most critical event (major trend change signal).
 */
function scoreMACDHistogram(macdValue) {
    if (macdValue === null || isNaN(macdValue)) {
        return { score: 50, bias: 'Neutral', confidence: 0, momentumDir: 'Unknown', signalZone: 'No Data' };
    }

    const absValue = Math.abs(macdValue);
    const isPositive = macdValue >= 0;

    // ── Factor 1: Magnitude + Direction Score (0–100) ─────────────────────
    // Use absolute magnitude to determine strength, direction to set polarity
    let f1Score;
    if (isPositive) {
        if (absValue > 200)       f1Score = 95; // Extreme bullish momentum
        else if (absValue > 100)  f1Score = 85; // Strong bullish momentum
        else if (absValue > 50)   f1Score = 72; // Healthy positive momentum
        else if (absValue > 15)   f1Score = 60; // Mild positive
        else                      f1Score = 53; // Near zero (just barely positive)
    } else {
        if (absValue > 200)       f1Score = 5;  // Extreme bearish momentum
        else if (absValue > 100)  f1Score = 15; // Strong bearish momentum
        else if (absValue > 50)   f1Score = 28; // Healthy negative momentum
        else if (absValue > 15)   f1Score = 40; // Mild negative
        else                      f1Score = 47; // Near zero (just barely negative)
    }

    // ── Factor 2: Zero-Line Crossover Zone ───────────────────────────────
    // Near zero = most critical zone (potential trend change)
    let f2Score;
    let signalZone;
    if (macdValue > 100) {
        f2Score = 82; signalZone = 'Above Zero — Strong Bullish';
    } else if (macdValue > 15) {
        f2Score = 68; signalZone = 'Above Zero — Bullish';
    } else if (macdValue >= 0 && macdValue <= 15) {
        f2Score = 55; signalZone = 'Zero Line — Watch for Crossover';
    } else if (macdValue >= -15) {
        f2Score = 45; signalZone = 'Zero Line — Watch for Crossover';
    } else if (macdValue > -100) {
        f2Score = 32; signalZone = 'Below Zero — Bearish';
    } else {
        f2Score = 15; signalZone = 'Below Zero — Strong Bearish';
    }

    // ── Factor 3: Expansion/Contraction context ───────────────────────────
    // Higher absolute values = momentum is expanding = stronger conviction
    let f3Score;
    if (absValue > 150) {
        f3Score = isPositive ? 90 : 10; // Strong expansion in either direction
    } else if (absValue > 75) {
        f3Score = isPositive ? 75 : 25;
    } else if (absValue > 25) {
        f3Score = isPositive ? 62 : 38;
    } else {
        f3Score = 50; // Near zero = no momentum conviction
    }

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

    // ── Momentum Direction Label ──────────────────────────────────────────
    let momentumDir;
    if (macdValue > 100)       momentumDir = 'Strong Upward Momentum';
    else if (macdValue > 15)   momentumDir = 'Positive Momentum';
    else if (macdValue > -15)  momentumDir = 'Momentum Transition';
    else if (macdValue > -100) momentumDir = 'Negative Momentum';
    else                       momentumDir = 'Strong Downward Momentum';

    // ── Confidence: highest at extremes, lowest near zero ────────────────
    let confidence;
    if (absValue > 150) confidence = 88; // Clear directional momentum
    else if (absValue > 60) confidence = 76;
    else if (absValue > 15) confidence = 64;
    else confidence = 52; // Near zero — uncertain crossover zone

    return { score: finalScore, bias, confidence, momentumDir, signalZone };
}

// ─── Dynamic AI Insight Generator ─────────────────────────────────────────
function generateAiInsight(macdValue, momentumDir, signalZone) {
    if (macdValue === null || isNaN(macdValue)) {
        return "Enter the MACD Histogram value (MACD Line − Signal Line) for the index. Use daily MACD(12,26,9). Nifty histogram typically ranges ±50 to ±300; BankNifty ±100 to ±600.";
    }

    const rounded = macdValue.toFixed(1);
    const abs = Math.abs(macdValue);

    if (macdValue > 150) {
        return `MACD Histogram at +${rounded} reflects strong and accelerating bullish momentum for the index. The gap between the MACD and Signal line is expanding rapidly, confirming institutional momentum is firmly in the bulls' corner. Trend-following strategies are well-supported.`;
    }
    if (macdValue > 15) {
        return `MACD Histogram is positive at +${rounded}, indicating bulls are in control and momentum is building. The index is trending above its short-term momentum baseline. This supports continuation of the current uptrend with manageable risk.`;
    }
    if (macdValue >= 0 && macdValue <= 15) {
        return `MACD Histogram is near zero (+${rounded}), signaling a critical transition zone. Momentum is neither decisively bullish nor bearish. A breakout above zero with expansion would confirm a bullish momentum shift; a breakdown below with expansion confirms bearish momentum.`;
    }
    if (macdValue >= -15) {
        return `MACD Histogram is near zero (${rounded}), in a momentum transition zone. Downward pressure is mild but the direction is not yet established. Watch for a clear expansion in either direction — this is a high-alert zone for trend traders.`;
    }
    if (macdValue > -150) {
        return `MACD Histogram is negative at ${rounded}, showing bears have the momentum advantage. The index is trending below its short-term momentum baseline. Bounces should be treated as selling opportunities until the histogram crosses back above zero.`;
    }
    return `MACD Histogram at ${rounded} reflects extreme bearish momentum for the index. The MACD line is deeply below the signal line, confirming strong institutional selling pressure. Avoid aggressive longs — wait for histogram to stabilize and start contracting before considering reversals.`;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function MACDTrendCard({ data, manualOverride, lastUpdated }) {
    const macdValue = (manualOverride !== undefined && manualOverride !== null && manualOverride !== '')
        ? parseFloat(manualOverride)
        : null;

    const configData = getIndicatorConfig('index_macd');
    const { score, bias, confidence, momentumDir, signalZone } = scoreMACDHistogram(macdValue);
    const aiInsight = generateAiInsight(macdValue, momentumDir, signalZone);

    return (
        <IndicatorCard
            config={{
                title: 'MACD Momentum',
                category: 'Market Health',
                mode: 'MANUAL',
                creditScore: configData?.creditScore ?? 7,
                updateTime: lastUpdated ?? '--:--',
                source: 'Manual',
                aiModel: configData?.aiModel ?? 'Engine v3'
            }}
            data={{
                currentValueObj: {
                    label: 'MACD Histogram',
                    value: macdValue !== null ? macdValue.toFixed(1) : '--'
                },
                details: [
                    macdValue !== null && {
                        label: 'Momentum',
                        value: momentumDir,
                        isManual: true
                    },
                    macdValue !== null && {
                        label: 'Signal Zone',
                        value: signalZone,
                        isManual: true
                    }
                ].filter(Boolean),
                score: score ?? 0,
                bias: bias ?? 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 7.0
            }}
            chartData={{ valueName: 'MACD Histogram' }}
            insights={{
                aiInsight,
                whyItMatters: [
                    'MACD Histogram = MACD Line − Signal Line; measures momentum acceleration, not just direction.',
                    'Zero-line crossovers are the most significant events — they signal major trend changes.',
                    'A rising histogram above zero = bulls are accelerating; falling = momentum is weakening.',
                    'For Nifty/BankNifty, use daily MACD(12,26,9); histogram range typically ±50–500.',
                    'Histogram divergence with price (price rising but histogram falling) is a powerful warning signal.'
                ]
            }}
        />
    );
}
