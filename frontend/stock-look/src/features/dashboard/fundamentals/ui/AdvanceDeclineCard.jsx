/**
 * @file AdvanceDeclineCard.jsx
 * @purpose Displays the Advance/Decline Ratio for index market breadth analysis.
 *
 * DATA SOURCE: Manual Override (Upstox doesn't provide breadth data)
 *
 * SCORING ENGINE: Multi-factor blended approach
 *   Factor 1 (50%): A/D level vs neutral line (1.0)
 *   Factor 2 (30%): Extreme reading contrarian signal adjustment
 *   Factor 3 (20%): Absolute threshold safety bands
 */
import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

// ─── Industry-Grade Scoring Engine ──────────────────────────────────────────
/**
 * Computes a 0–100 score, bias, and confidence for the Advance/Decline ratio.
 *
 * A/D Ratio = Advancing Stocks / Declining Stocks
 * - > 2.0  : Extreme breadth (bullish but can be near-term exhaustion)
 * - 1.2–2.0: Strong broad buying
 * - 0.8–1.2: Mixed / neutral breadth
 * - 0.5–0.8: Broad selling pressure
 * - < 0.5  : Extreme broad selling (panic, but contrarian reversal risk)
 */
function scoreADRatio(adRatio) {
    if (adRatio === null || isNaN(adRatio)) {
        return { score: 50, bias: 'Neutral', confidence: 0, breadthZone: 'Unknown', signalType: 'No Data' };
    }

    // ── Factor 1: Level vs Neutral (0–100) ────────────────────────────────
    // Neutral line is 1.0. Deviation above = bullish. Deviation below = bearish.
    let f1Score;
    if (adRatio > 2.5)       f1Score = 85; // Very strong but potential exhaustion
    else if (adRatio > 1.5)  f1Score = 90; // Strong bullish breadth
    else if (adRatio > 1.2)  f1Score = 78; // Bullish breadth
    else if (adRatio >= 0.9) f1Score = 52; // Near neutral
    else if (adRatio >= 0.7) f1Score = 32; // Moderately bearish breadth
    else if (adRatio >= 0.5) f1Score = 18; // Broad selling
    else                     f1Score = 8;  // Extreme panic

    // ── Factor 2: Extreme Contrarian Adjustment (penalty for exhaustion) ──
    // When breadth is extremely one-sided, it often signals short-term exhaustion
    let f2Score = f1Score;
    let signalType = 'Trending';
    if (adRatio > 2.5) {
        f2Score = Math.max(f1Score - 15, 60); // Reduce score — extreme breadth = near-term caution
        signalType = 'Exhaustion Risk';
    } else if (adRatio < 0.4) {
        f2Score = Math.min(f1Score + 20, 40); // Boost slightly — panic = contrarian buy signal
        signalType = 'Contrarian Reversal Signal';
    } else if (adRatio > 1.5) {
        signalType = 'Broad Buying';
    } else if (adRatio < 0.7) {
        signalType = 'Broad Selling';
    } else {
        signalType = 'Mixed Breadth';
    }

    // ── Factor 3: Absolute Safety Bands (0–100) ───────────────────────────
    let f3Score;
    if (adRatio > 2.0)       f3Score = 70; // Strong but cautious
    else if (adRatio > 1.2)  f3Score = 82;
    else if (adRatio >= 0.8) f3Score = 50;
    else if (adRatio >= 0.5) f3Score = 25;
    else                     f3Score = 10;

    // ── Blend ─────────────────────────────────────────────────────────────
    const blended = (f2Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    // ── Bias Mapping ──────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Breadth Zone Label ────────────────────────────────────────────────
    let breadthZone;
    if (adRatio > 2.0)       breadthZone = 'Extreme Breadth';
    else if (adRatio > 1.2)  breadthZone = 'Strong Breadth';
    else if (adRatio >= 0.8) breadthZone = 'Neutral Zone';
    else if (adRatio >= 0.5) breadthZone = 'Weak Breadth';
    else                     breadthZone = 'Panic Zone';

    // ── Confidence: higher at extremes where the signal is clearest ───────
    let confidence;
    if (adRatio > 2.0 || adRatio < 0.5) confidence = 88; // Clear extreme signal
    else if (adRatio > 1.3 || adRatio < 0.7) confidence = 80;
    else confidence = 65; // Neutral zone — less predictive

    return { score: finalScore, bias, confidence, breadthZone, signalType };
}

// ─── Dynamic AI Insight Generator ─────────────────────────────────────────
function generateAiInsight(adRatio, bias, breadthZone, signalType) {
    if (adRatio === null || isNaN(adRatio)) {
        return "Enter the current A/D Ratio (Advancing / Declining stocks) to analyze market breadth. A value above 1.0 means more stocks are advancing than declining.";
    }

    const rounded = adRatio.toFixed(2);

    if (adRatio > 2.5) {
        return `A/D Ratio is extremely elevated at ${rounded}. While this confirms overwhelming bullish breadth, such extremes historically precede short-term consolidation as the market absorbs gains. The rally appears broad but may be near exhaustion.`;
    }
    if (adRatio > 1.5) {
        return `Market breadth is powerfully positive at ${rounded}, confirming the current rally has strong underlying participation across the index. This is a high-quality signal — broad-based moves tend to be more sustainable than narrow, index-led ones.`;
    }
    if (adRatio > 1.2) {
        return `Breadth is moderately bullish at ${rounded}. More stocks are advancing than declining, which lends credibility to the uptrend. Watch for this ratio to hold above 1.0 on pullbacks for trend confirmation.`;
    }
    if (adRatio >= 0.8) {
        return `A/D Ratio of ${rounded} reflects balanced and inconclusive market breadth. Roughly equal advancing and declining stocks suggest the market is in a consolidation or decision zone — no clear directional edge from breadth alone.`;
    }
    if (adRatio >= 0.5) {
        return `Market breadth is weakening at ${rounded}. More stocks are declining than advancing, indicating the selling is broad-based rather than isolated. This undermines the case for a durable rally and increases downside risk.`;
    }
    return `A/D Ratio of ${rounded} signals extreme broad-based panic selling. While structurally bearish, historical data shows that extreme breadth readings below 0.5 often coincide with short-term capitulation bottoms — a potential contrarian reversal setup.`;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AdvanceDeclineCard({ data, manualOverride, lastUpdated }) {
    const adRatio = (manualOverride !== undefined && manualOverride !== null && manualOverride !== '')
        ? parseFloat(manualOverride)
        : null;

    const configData = getIndicatorConfig('advance_decline');
    const { score, bias, confidence, breadthZone, signalType } = scoreADRatio(adRatio);
    const aiInsight = generateAiInsight(adRatio, bias, breadthZone, signalType);

    return (
        <IndicatorCard
            config={{
                title: 'Advance / Decline',
                category: 'Market Health',
                mode: 'MANUAL',
                creditScore: configData?.creditScore ?? 8,
                updateTime: lastUpdated ?? '--:--',
                source: 'Manual',
                aiModel: configData?.aiModel ?? 'Engine v3'
            }}
            data={{
                currentValueObj: {
                    label: 'A/D Ratio',
                    value: adRatio !== null ? adRatio.toFixed(2) : '--'
                },
                details: [
                    adRatio !== null && {
                        label: 'Breadth Zone',
                        value: breadthZone,
                        isManual: true
                    },
                    adRatio !== null && {
                        label: 'Signal Type',
                        value: signalType,
                        isManual: true
                    }
                ].filter(Boolean),
                score: score ?? 0,
                bias: bias ?? 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 7.0
            }}
            chartData={{ valueName: 'A/D Ratio' }}
            insights={{
                aiInsight,
                whyItMatters: [
                    'Breadth analysis reveals whether the full index or just a few large caps are driving moves.',
                    'A rising index with falling A/D ratio signals hidden internal weakness — a classic divergence warning.',
                    'Extreme A/D readings (>2.0 or <0.5) are contrarian indicators for short-term reversals.',
                    'Strong breadth (A/D > 1.2) on breakouts confirms institutional participation across the market.',
                    'Breadth deterioration often precedes a major index correction by several weeks.'
                ]
            }}
        />
    );
}
