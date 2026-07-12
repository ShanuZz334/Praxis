/**
 * @file ForwardPECard.jsx
 * @purpose Displays the Forward P/E Ratio fundamental indicator.
 *
 * DATA SOURCES:
 *  - currentFwdPE   → LIVE: Upstox key-ratios API (if available) or MANUAL (forward_pe)
 *  - currentPE      → LIVE: Upstox key-ratios API (for comparison)
 *  - projectedEPS   → MANUAL: manualOverride (projected_eps)
 *
 * MODE:
 *  - AUTO  when currentFwdPE is sourced from Upstox
 *  - MANUAL when currentFwdPE falls back to manual override
 */

import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

// ─── Industry-Grade Scoring Engine ──────────────────────────────────────────
/**
 * Computes a 0–100 score, bias label, and confidence % for Forward PE.
 *
 * Strategy: Evaluates the premium/discount of Forward PE vs Trailing PE.
 *   - Lower Forward PE vs Trailing PE = Expected earnings growth (Bullish)
 *   - Higher Forward PE vs Trailing PE = Expected earnings contraction (Bearish)
 */
function scoreForwardPE(currentFwdPE, currentPE) {
    if (currentFwdPE === null || currentFwdPE === undefined || isNaN(currentFwdPE)) {
        return { score: 50, bias: 'Neutral', confidence: 60 };
    }

    if (currentPE === null || currentPE === undefined || isNaN(currentPE)) {
        // Absolute Forward PE scoring if Trailing PE is missing
        let absScore = 50;
        if (currentFwdPE < 10)       absScore = 95;
        else if (currentFwdPE < 15)  absScore = 80;
        else if (currentFwdPE < 20)  absScore = 65;
        else if (currentFwdPE < 25)  absScore = 50;
        else if (currentFwdPE < 35)  absScore = 30;
        else                         absScore = 10;
        
        let bias;
        if (absScore >= 80)      bias = 'Strong Bullish';
        else if (absScore >= 62) bias = 'Bullish';
        else if (absScore >= 42) bias = 'Neutral';
        else if (absScore >= 25) bias = 'Bearish';
        else                     bias = 'Strong Bearish';
        
        return { score: absScore, bias, confidence: 65 };
    }

    // Relative scoring: Forward PE vs Trailing PE
    const growthPremium = (currentPE - currentFwdPE) / currentPE; // Positive means Fwd PE is lower (growth)
    
    let relScore = 50;
    if (growthPremium > 0.30)       relScore = 95; // 30%+ earnings growth priced in
    else if (growthPremium > 0.15)  relScore = 85; // 15-30% growth
    else if (growthPremium > 0.05)  relScore = 65; // 5-15% growth
    else if (growthPremium > -0.05) relScore = 50; // Flat earnings
    else if (growthPremium > -0.15) relScore = 35; // Slight earnings decline
    else if (growthPremium > -0.30) relScore = 20; // Significant earnings decline
    else                            relScore = 5;  // Severe contraction

    let bias;
    if (relScore >= 80)      bias = 'Strong Bullish';
    else if (relScore >= 62) bias = 'Bullish';
    else if (relScore >= 42) bias = 'Neutral';
    else if (relScore >= 25) bias = 'Bearish';
    else                     bias = 'Strong Bearish';

    return { score: relScore, bias, confidence: 85 };
}

// ─── Dynamic AI Insight Generator ─────────────────────────────────────────
function generateAiInsight(currentFwdPE, currentPE, bias) {
    if (!currentFwdPE) return 'Waiting for Forward P/E data to generate an insight.';
    
    if (!currentPE) {
        return `The Forward P/E is ${currentFwdPE}x. Trailing P/E is needed for a comprehensive growth comparison.`;
    }

    const diffPercent = Math.abs((currentFwdPE - currentPE) / currentPE * 100).toFixed(1);

    if (currentFwdPE < currentPE) {
        return `Forward P/E is trading at a ${diffPercent}% discount to the trailing P/E of ${currentPE}x. This indicates the market expects strong earnings growth over the next 12 months, driving the valuation multiple lower.`;
    } else if (currentFwdPE > currentPE) {
        return `Forward P/E is trading at a ${diffPercent}% premium to the trailing P/E of ${currentPE}x. This suggests anticipated earnings contraction or that the market price has run ahead of expected fundamental growth.`;
    } else {
        return `Forward P/E aligns perfectly with the trailing P/E at ${currentPE}x, implying expectations for flat earnings growth over the next 12 months.`;
    }
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ForwardPECard({ data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig('forward_pe');

    // ── Step 1: Resolve currentFwdPE (Live from Upstox or manual fallback) ────
    const ratiosArray = Array.isArray(data?.ratios) ? data.ratios : [];
    const upstoxFwdPEObj = ratiosArray.find(r => 
        r.name?.toLowerCase().includes("forward p/e") || 
        r.name?.toLowerCase().includes("forward pe") ||
        r.name?.toLowerCase().includes("fwd pe")
    );
    const parsedFwdPE = upstoxFwdPEObj?.company_value ? parseFloat(upstoxFwdPEObj.company_value) : null;
    
    const isLiveData = parsedFwdPE !== null && !isNaN(parsedFwdPE) && parsedFwdPE > 0;
    const currentFwdPE = isLiveData ? parsedFwdPE : (manualOverride ?? null);

    // ── Step 2: Resolve Trailing PE for comparison (Live) ─────────────────────
    const upstoxPEObj = ratiosArray.find(r =>
        r.name === 'P/E' ||
        r.name === 'PE' ||
        r.name?.toLowerCase() === 'p/e ratio' ||
        r.name?.toLowerCase().includes('price to earnings')
    );
    const parsedPE = upstoxPEObj?.company_value ? parseFloat(upstoxPEObj.company_value) : null;
    const currentPE = (parsedPE !== null && !isNaN(parsedPE)) ? parsedPE : null;

    // ── Step 3: Resolve Projected EPS (Always Manual) ─────────────────────────
    const projectedEPS = data?.manualProjectedEps ?? null;

    // ── Step 4: Run Engine ────────────────────────────────────────────────────
    const { score, bias, confidence } = scoreForwardPE(currentFwdPE, currentPE);

    // ── Step 5: Dynamic AI Insight ────────────────────────────────────────────
    const aiInsight = generateAiInsight(currentFwdPE, currentPE, bias);

    // ── Step 6: Display Value Formatting ──────────────────────────────────────
    const displayFwdPE = currentFwdPE !== null && !isNaN(currentFwdPE)
        ? parseFloat(currentFwdPE).toFixed(2)
        : '--';

    return (
        <IndicatorCard
            config={{
                title: 'Forward P/E',
                category: 'Valuation',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore ?? 5,
                updateTime: lastUpdated ?? '--:--',
                source: isLiveData ? 'Upstox' : 'Manual',
                aiModel: configData?.aiModel ?? 'Engine v2'
            }}
            data={{
                currentValueObj: { 
                    label: 'Current Fwd PE', 
                    value: displayFwdPE 
                },
                details: [
                    { 
                        label: 'Projected EPS (Next 12M)', 
                        value: projectedEPS !== null ? parseFloat(projectedEPS).toFixed(2) : '--', 
                        isManual: true 
                    }
                ],
                score,
                bias,
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Forward P/E'
            }}
            insights={{
                aiInsight,
                whyItMatters: [
                    'Forecasts valuation based on expected future earnings, providing a forward-looking perspective.',
                    'A Forward P/E lower than Trailing P/E indicates expected earnings growth.',
                    'Helps identify if current market prices accurately reflect fundamental growth prospects.',
                    'Crucial for comparing high-growth companies against value stocks.'
                ]
            }}
        />
    );
}
