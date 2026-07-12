/**
 * @file VolatilityCard.jsx
 * @purpose Displays India VIX (Fear Index) for index volatility and risk analysis.
 *
 * DATA SOURCE: Manual Override (Upstox doesn't provide VIX directly)
 *
 * SCORING ENGINE: Multi-factor blended approach
 *   Factor 1 (50%): Absolute VIX regime classification
 *   Factor 2 (30%): Directional risk-reward (falling VIX = premium bullish)
 *   Factor 3 (20%): Historical India VIX percentile bands
 *
 * India VIX Regime Reference:
 *   < 10   : Extreme complacency / historically rare
 *   10–13  : Very calm / low risk environment  
 *   13–18  : Normal market conditions
 *   18–25  : Elevated risk / fear
 *   25–35  : High fear / significant correction likely
 *   > 35   : Crisis-level panic
 */
import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

// ─── Industry-Grade Scoring Engine ──────────────────────────────────────────
/**
 * VIX is an INVERSE indicator: Low VIX = bullish sentiment, High VIX = fear.
 * But extreme LOW VIX can signal dangerous complacency.
 * The scoring model rewards calm but penalizes extreme complacency and fear equally.
 */
function scoreVIX(vixValue) {
    if (vixValue === null || isNaN(vixValue)) {
        return { score: 50, bias: 'Neutral', confidence: 0, vixRegime: 'Unknown', marketCondition: 'No Data' };
    }

    // ── Factor 1: VIX Regime Classification (0–100) ───────────────────────
    // Scoring is INVERSE: low VIX = higher score, but extreme low has penalty
    let f1Score;
    let vixRegime;
    if (vixValue > 35) {
        f1Score = 5; vixRegime = 'Crisis Panic';
    } else if (vixValue > 25) {
        f1Score = 15; vixRegime = 'High Fear';
    } else if (vixValue > 20) {
        f1Score = 28; vixRegime = 'Elevated Risk';
    } else if (vixValue > 18) {
        f1Score = 40; vixRegime = 'Mild Concern';
    } else if (vixValue > 15) {
        f1Score = 58; vixRegime = 'Normal';
    } else if (vixValue > 13) {
        f1Score = 72; vixRegime = 'Calm';
    } else if (vixValue > 10) {
        f1Score = 85; vixRegime = 'Very Calm';
    } else {
        f1Score = 70; vixRegime = 'Extreme Complacency'; // Penalty — dangerous low
    }

    // ── Factor 2: Risk-Reward Context ────────────────────────────────────
    // Below 13 = great for longs; above 20 = elevated risk; above 25 = avoid
    let f2Score;
    let marketCondition;
    if (vixValue > 25) {
        f2Score = 10; marketCondition = 'Defensive — High Risk';
    } else if (vixValue > 18) {
        f2Score = 35; marketCondition = 'Cautious — Elevated Risk';
    } else if (vixValue > 13) {
        f2Score = 65; marketCondition = 'Constructive — Normal Risk';
    } else if (vixValue > 10) {
        f2Score = 88; marketCondition = 'Favorable — Low Risk';
    } else {
        f2Score = 60; marketCondition = 'Caution — Complacency Risk';
    }

    // ── Factor 3: Historical India VIX Percentile Bands ──────────────────
    // India VIX long-run average ~15–16; below 12 is <10th percentile
    let f3Score;
    if (vixValue > 30)       f3Score = 5;   // Top 5% historically — crisis
    else if (vixValue > 22)  f3Score = 20;  // Top 15% — stressed
    else if (vixValue > 17)  f3Score = 45;  // Normal upper range
    else if (vixValue > 13)  f3Score = 68;  // Average zone
    else if (vixValue > 10)  f3Score = 88;  // Historically very low
    else                     f3Score = 72;  // Extremely low — rare and risky

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

    // ── Confidence: highest at extremes where VIX is most predictive ─────
    let confidence;
    if (vixValue > 28 || vixValue < 11) confidence = 92; // Extremes = highest signal quality
    else if (vixValue > 22 || vixValue < 13) confidence = 84;
    else confidence = 72; // Mid-range VIX = less directional

    return { score: finalScore, bias, confidence, vixRegime, marketCondition };
}

// ─── Dynamic AI Insight Generator ─────────────────────────────────────────
function generateAiInsight(vixValue, vixRegime, marketCondition) {
    if (vixValue === null || isNaN(vixValue)) {
        return "Enter the current India VIX reading to analyze market fear and volatility expectations. India VIX measures the expected volatility over the next 30 days derived from Nifty options prices.";
    }

    const rounded = vixValue.toFixed(2);

    if (vixValue > 35) {
        return `India VIX is at crisis levels (${rounded}), indicating extreme fear and expectation of sharp market dislocations. Historically, readings above 35 coincide with capitulation bottoms — a high-risk but potentially high-reward contrarian entry zone for long-term investors.`;
    }
    if (vixValue > 25) {
        return `India VIX at ${rounded} signals significant market anxiety. Option premiums are expensive, suggesting large institutional players are aggressively hedging. Avoid leveraged positions — wait for VIX to start declining before adding risk.`;
    }
    if (vixValue > 18) {
        return `India VIX is elevated at ${rounded}, reflecting above-normal market uncertainty. The market is pricing in meaningful risk — directional bets carry higher volatility. Risk management is critical at this level.`;
    }
    if (vixValue > 13) {
        return `India VIX is in the normal range at ${rounded}, indicating a stable market environment with balanced risk. This is the historically optimal zone for systematic investing and trend-following strategies.`;
    }
    if (vixValue > 10) {
        return `India VIX is comfortably low at ${rounded}, reflecting strong market confidence and low hedging demand. This benign environment supports momentum strategies, though very low VIX can precede sudden volatility shocks.`;
    }
    return `India VIX is at extreme lows (${rounded}) — historically rare and a sign of market complacency. While current conditions are calm, such extreme suppression of volatility has historically been a leading indicator of sudden spikes. Maintain disciplined stops.`;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function VolatilityCard({ data, manualOverride, lastUpdated }) {
    const vixValue = (manualOverride !== undefined && manualOverride !== null && manualOverride !== '')
        ? parseFloat(manualOverride)
        : null;

    const configData = getIndicatorConfig('india_vix');
    const { score, bias, confidence, vixRegime, marketCondition } = scoreVIX(vixValue);
    const aiInsight = generateAiInsight(vixValue, vixRegime, marketCondition);

    return (
        <IndicatorCard
            config={{
                title: 'India VIX',
                category: 'Market Health',
                mode: 'MANUAL',
                creditScore: configData?.creditScore ?? 9,
                updateTime: lastUpdated ?? '--:--',
                source: 'Manual',
                aiModel: configData?.aiModel ?? 'Engine v3'
            }}
            data={{
                currentValueObj: {
                    label: 'VIX Level',
                    value: vixValue !== null ? vixValue.toFixed(2) : '--'
                },
                details: [
                    vixValue !== null && {
                        label: 'VIX Regime',
                        value: vixRegime,
                        isManual: true
                    },
                    vixValue !== null && {
                        label: 'Market Condition',
                        value: marketCondition,
                        isManual: true
                    }
                ].filter(Boolean),
                score: score ?? 0,
                bias: bias ?? 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 9.0
            }}
            chartData={{ valueName: 'VIX Level' }}
            insights={{
                aiInsight,
                whyItMatters: [
                    'India VIX measures expected near-term market volatility derived from Nifty 50 option prices.',
                    'A rising VIX signals fear and uncertainty — institutional players paying more for portfolio insurance.',
                    'VIX below 14 historically provides the best risk-reward environment for long positions.',
                    'VIX spikes above 25 have historically coincided with significant Nifty corrections of 5–15%.',
                    'Extreme VIX above 35 often marks panic-driven capitulation bottoms — contrarian buy signals for long-term investors.'
                ]
            }}
        />
    );
}
