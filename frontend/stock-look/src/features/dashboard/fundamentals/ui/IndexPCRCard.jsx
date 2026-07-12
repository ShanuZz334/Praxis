/**
 * @file IndexPCRCard.jsx
 * @purpose Displays the Put-Call Ratio (PCR) for index options sentiment analysis.
 *
 * DATA SOURCE: Manual Override (Upstox Options Chain provides raw data, PCR calculation needed)
 *
 * SCORING ENGINE: Multi-factor blended approach
 *   Factor 1 (50%): PCR level vs contrarian thresholds (primary signal)
 *   Factor 2 (30%): Options dominance strength (how far from 1.0 neutral)
 *   Factor 3 (20%): Historical India PCR context (NSE typical range: 0.6–1.5)
 *
 * PCR Interpretation (Contrarian Indicator):
 *   > 1.5  : Extreme put dominance = extreme bearish sentiment = CONTRARIAN BULLISH
 *   1.2–1.5: Put dominated = bearish crowd = mildly contrarian bullish
 *   0.8–1.2: Balanced / neutral positioning
 *   0.6–0.8: Call dominated = complacency = mildly bearish signal
 *   < 0.6  : Extreme call dominance = extreme greed = CONTRARIAN BEARISH
 */
import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

// ─── Industry-Grade Scoring Engine ──────────────────────────────────────────
/**
 * PCR is a CONTRARIAN indicator:
 * - High PCR (fear) → market likely to reverse up
 * - Low PCR (greed) → market likely to reverse down
 * Scoring is therefore INVERSELY proportional at extremes.
 */
function scorePCR(pcrValue) {
    if (pcrValue === null || isNaN(pcrValue)) {
        return { score: 50, bias: 'Neutral', confidence: 0, optionsBias: 'Unknown', signalStrength: 'No Data' };
    }

    // ── Factor 1: Contrarian Level Score (0–100) ──────────────────────────
    // HIGH PCR = bullish contrarian signal (bearish crowd = market bottom)
    // LOW PCR = bearish contrarian signal (bullish crowd = market top)
    let f1Score;
    if (pcrValue > 1.8)       f1Score = 95; // Extreme put buying = extreme bearish = strong bottom signal
    else if (pcrValue > 1.5)  f1Score = 85; // Heavy put buying = oversold sentiment
    else if (pcrValue > 1.2)  f1Score = 72; // Moderate put dominance = bullish lean
    else if (pcrValue > 0.9)  f1Score = 52; // Near neutral
    else if (pcrValue > 0.7)  f1Score = 38; // Mild call dominance = mild complacency
    else if (pcrValue > 0.55) f1Score = 22; // Strong call dominance = overbought sentiment
    else                      f1Score = 8;  // Extreme greed = strong top signal

    // ── Factor 2: Options Dominance Strength ─────────────────────────────
    // How far from neutral (1.0) — further away = stronger signal
    const distanceFromNeutral = Math.abs(pcrValue - 1.0);
    let f2Score;
    let signalStrength;
    if (distanceFromNeutral > 0.7) {
        f2Score = (pcrValue > 1.0) ? 90 : 10; // Extreme — very strong contrarian signal
        signalStrength = 'Extreme';
    } else if (distanceFromNeutral > 0.4) {
        f2Score = (pcrValue > 1.0) ? 72 : 28; // Strong
        signalStrength = 'Strong';
    } else if (distanceFromNeutral > 0.2) {
        f2Score = (pcrValue > 1.0) ? 60 : 40; // Moderate
        signalStrength = 'Moderate';
    } else {
        f2Score = 52; // Near neutral — weak signal
        signalStrength = 'Neutral';
    }

    // ── Factor 3: Historical India PCR Context ───────────────────────────
    // NSE historical PCR typically ranges 0.6–1.4; extremes beyond are rare
    let f3Score;
    if (pcrValue > 1.6)       f3Score = 90; // Top 5% historically — strong bottom signal
    else if (pcrValue > 1.3)  f3Score = 75; // Top 20%
    else if (pcrValue > 0.9)  f3Score = 52; // Middle range
    else if (pcrValue > 0.65) f3Score = 30; // Lower 20%
    else                      f3Score = 8;  // Bottom 5% — strong top signal

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

    // ── Options Dominance Label ───────────────────────────────────────────
    let optionsBias;
    if (pcrValue > 1.5)       optionsBias = 'Extreme Put Dominance';
    else if (pcrValue > 1.2)  optionsBias = 'Put Dominated';
    else if (pcrValue > 0.8)  optionsBias = 'Balanced';
    else if (pcrValue > 0.6)  optionsBias = 'Call Dominated';
    else                      optionsBias = 'Extreme Call Dominance';

    // ── Confidence: highest at extremes where PCR is most predictive ─────
    let confidence;
    if (pcrValue > 1.6 || pcrValue < 0.6) confidence = 88; // Extreme readings = high signal quality
    else if (pcrValue > 1.3 || pcrValue < 0.75) confidence = 78;
    else confidence = 60; // Neutral zone = weak predictive power

    return { score: finalScore, bias, confidence, optionsBias, signalStrength };
}

// ─── Dynamic AI Insight Generator ─────────────────────────────────────────
function generateAiInsight(pcrValue, optionsBias, signalStrength) {
    if (pcrValue === null || isNaN(pcrValue)) {
        return "Enter the current Put-Call Ratio (Total Put OI / Total Call OI) to analyze options market sentiment. PCR is a powerful contrarian indicator — extreme readings often precede market reversals.";
    }

    const rounded = pcrValue.toFixed(2);

    if (pcrValue > 1.8) {
        return `PCR is at extreme levels (${rounded}), indicating massive put buying across the index. When the crowd is this bearish, the market is often over-positioned for a decline. Historically, NSE PCR above 1.8 has been one of the most reliable bottom indicators for Nifty/BankNifty.`;
    }
    if (pcrValue > 1.3) {
        return `PCR of ${rounded} shows put-dominated options positioning. Traders are heavily hedged and expecting downside — a contrarian bullish signal. When fear is extreme, corrections are often overdone and sharp reversals follow.`;
    }
    if (pcrValue > 0.8) {
        return `PCR of ${rounded} reflects balanced options positioning with no extreme directional bet. The market is in a neutral sentiment zone — price action and technical setups will dominate over sentiment signals at this level.`;
    }
    if (pcrValue > 0.6) {
        return `PCR of ${rounded} shows call-dominated positioning, suggesting market participants are complacent and expecting further upside. This level of one-sided bullishness is a mild contrarian warning — risk of short-term correction increases.`;
    }
    return `PCR of ${rounded} reflects extreme call buying and bullish complacency. Historically, NSE PCR below 0.6 has been associated with short-term market tops. The risk-reward for fresh longs is unfavorable at this sentiment extreme.`;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function IndexPCRCard({ data, manualOverride, lastUpdated }) {
    const pcrValue = (manualOverride !== undefined && manualOverride !== null && manualOverride !== '')
        ? parseFloat(manualOverride)
        : null;

    const configData = getIndicatorConfig('index_pcr');
    const { score, bias, confidence, optionsBias, signalStrength } = scorePCR(pcrValue);
    const aiInsight = generateAiInsight(pcrValue, optionsBias, signalStrength);

    return (
        <IndicatorCard
            config={{
                title: 'Put-Call Ratio',
                category: 'Market Health',
                mode: 'MANUAL',
                creditScore: configData?.creditScore ?? 8,
                updateTime: lastUpdated ?? '--:--',
                source: 'Manual',
                aiModel: configData?.aiModel ?? 'Engine v3'
            }}
            data={{
                currentValueObj: {
                    label: 'PCR',
                    value: pcrValue !== null ? pcrValue.toFixed(2) : '--'
                },
                details: [
                    pcrValue !== null && {
                        label: 'Options Bias',
                        value: optionsBias,
                        isManual: true
                    },
                    pcrValue !== null && {
                        label: 'Signal Strength',
                        value: signalStrength,
                        isManual: true
                    }
                ].filter(Boolean),
                score: score ?? 0,
                bias: bias ?? 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 7.0
            }}
            chartData={{ valueName: 'PCR' }}
            insights={{
                aiInsight,
                whyItMatters: [
                    'PCR is a contrarian indicator — extreme fear (high PCR) often signals a bottom, extreme greed (low PCR) often signals a top.',
                    'Measures the ratio of Put Open Interest to Call Open Interest on NSE index options.',
                    'PCR above 1.5 has historically been one of the most reliable bottom signals for Nifty.',
                    'PCR below 0.6 signals excessive bullish complacency — a setup for potential sharp corrections.',
                    'Best used in conjunction with VIX and price action to confirm reversal setups.'
                ]
            }}
        />
    );
}
