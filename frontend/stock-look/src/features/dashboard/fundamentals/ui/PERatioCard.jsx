/**
 * @file PERatioCard.jsx
 * @purpose Displays the P/E Ratio fundamental indicator.
 *
 * DATA SOURCES:
 *  - currentPE   → LIVE: Upstox key-ratios API (data.ratios[].company_value where name = "P/E")
 *  - sectorPE    → LIVE: Upstox key-ratios API (data.ratios[].sector_value)
 *
 * MODE:
 *  - AUTO  when currentPE is sourced from Upstox
 *  - MANUAL when currentPE falls back to manual override
 */

import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

// ─── Industry-Grade Scoring Engine ──────────────────────────────────────────
/**
 * Computes a 0–100 score, bias label, and confidence % for PE ratio.
 *
 * Strategy: Multi-factor blended scoring.
 *   Factor 1 (50%): PE vs Historical Average  → measures current valuation extremity
 *   Factor 2 (30%): PE vs Sector Average      → measures relative sector richness
 *   Factor 3 (20%): Absolute PE thresholds    → absolute safety bands
 */
function scorePERatio(currentPE, historicalAvg, sectorPE) {
    if (currentPE === null || currentPE === undefined || isNaN(currentPE)) {
        return { score: 50, bias: 'Neutral', confidence: 60 };
    }

    // ── Factor 1: vs Historical Average (0–100) ────────────────────────────
    let f1Score = 50;
    if (historicalAvg && !isNaN(historicalAvg) && historicalAvg > 0) {
        const deviation = (currentPE - historicalAvg) / historicalAvg; // -ve = cheap, +ve = expensive
        // Score inversely proportional to deviation (cheaper = higher score)
        f1Score = Math.max(0, Math.min(100, 50 - (deviation * 200)));
    } else {
        // Absolute fallback bands when no historical avg is provided
        if (currentPE < 10)       f1Score = 95;
        else if (currentPE < 15)  f1Score = 80;
        else if (currentPE < 20)  f1Score = 65;
        else if (currentPE < 25)  f1Score = 50;
        else if (currentPE < 30)  f1Score = 35;
        else if (currentPE < 40)  f1Score = 20;
        else                      f1Score = 5;
    }

    // ── Factor 2: vs Sector PE (0–100) ────────────────────────────────────
    let f2Score = 50;
    let hasSector = false;
    if (sectorPE && !isNaN(sectorPE) && sectorPE > 0) {
        hasSector = true;
        const sectorDev = (currentPE - sectorPE) / sectorPE;
        f2Score = Math.max(0, Math.min(100, 50 - (sectorDev * 150)));
    }

    // ── Factor 3: Absolute PE Safety Bands (0–100) ────────────────────────
    let f3Score = 50;
    if (currentPE < 10)       f3Score = 95;  // Extremely cheap
    else if (currentPE < 15)  f3Score = 82;  // Cheap
    else if (currentPE < 22)  f3Score = 65;  // Fair value zone
    else if (currentPE < 28)  f3Score = 45;  // Slightly stretched
    else if (currentPE < 35)  f3Score = 28;  // Expensive
    else if (currentPE < 50)  f3Score = 15;  // Very expensive
    else                      f3Score = 5;   // Bubble territory

    // ── Blend Factors ──────────────────────────────────────────────────────
    const blendedScore = hasSector
        ? (f1Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20)
        : (f1Score * 0.60) + (f3Score * 0.40);

    const finalScore = Math.round(Math.max(0, Math.min(100, blendedScore)));

    // ── Bias Mapping ───────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Confidence: higher when more data sources are present ─────────────
    const confidence = hasSector ? 90 : (historicalAvg ? 82 : 70);

    return { score: finalScore, bias, confidence };
}

// ─── Dynamic AI Insight Generator ─────────────────────────────────────────
function generateAiInsight(currentPE, historicalAvg, sectorPE, bias) {
    if (!currentPE) return 'Waiting for P/E data to generate an insight.';

    const vsHist = historicalAvg
        ? currentPE < historicalAvg
            ? `trading at a ${((1 - currentPE / historicalAvg) * 100).toFixed(1)}% discount to its historical average of ${historicalAvg}x`
            : `trading at a ${((currentPE / historicalAvg - 1) * 100).toFixed(1)}% premium to its historical average of ${historicalAvg}x`
        : null;

    const vsSector = sectorPE
        ? currentPE < sectorPE
            ? `cheaper than its sector peers at ${sectorPE}x`
            : `richer than sector peers at ${sectorPE}x`
        : null;

    const contextParts = [vsHist, vsSector].filter(Boolean).join(', and ');
    const context = contextParts ? ` The stock is currently ${contextParts}.` : '';

    if (bias === 'Strong Bullish' || bias === 'Bullish') {
        return `The current P/E of ${currentPE}x suggests the market is offering an attractive entry point from a valuation standpoint.${context} This may represent a favorable risk/reward for long-term investors.`;
    } else if (bias === 'Neutral') {
        return `At ${currentPE}x earnings, the stock appears fairly valued relative to growth expectations.${context} Monitor for earnings acceleration or deceleration before taking a directional view.`;
    } else if (bias === 'Bearish') {
        return `The P/E of ${currentPE}x suggests elevated expectations are already priced in.${context} Investors should exercise caution and await a more favorable entry.`;
    } else {
        return `At ${currentPE}x earnings, the stock is trading at a significant premium that may not be justified by fundamentals.${context} Downside risk is elevated if growth disappoints.`;
    }
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function PERatioCard({ data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig('pe_ratio');

    // ── Step 1: Resolve currentPE (Live from Upstox or manual fallback) ────
    const ratiosArray = Array.isArray(data?.ratios) ? data.ratios : [];
    const upstoxPEObj = ratiosArray.find(r =>
        r.name === 'P/E' ||
        r.name === 'PE' ||
        r.name?.toLowerCase() === 'p/e ratio' ||
        r.name?.toLowerCase().includes('price to earnings')
    );
    const parsedPE = upstoxPEObj?.company_value ? parseFloat(upstoxPEObj.company_value) : null;

    const isLiveData = parsedPE !== null && !isNaN(parsedPE) && parsedPE > 0;
    const currentPE  = isLiveData ? parsedPE : (manualOverride ?? null);

    // ── Step 2: Resolve Sector PE (Live from Upstox) ──────────
    const sectorPE = upstoxPEObj?.sector_value ? parseFloat(upstoxPEObj.sector_value) : null;
    const historicalPE = null; // Removed to strictly comply with Zero Clutter Rule (NO Fallbacks/Historical inputs)

    // ── Step 3: Run Engine ────────────────────────────────────────────────
    const { score, bias, confidence } = scorePERatio(currentPE, historicalPE, sectorPE);

    // ── Step 4: Dynamic AI Insight ────────────────────────────────────────
    const aiInsight = generateAiInsight(currentPE, historicalPE, sectorPE, bias);

    // ── Step 5: Display Value Formatting ──────────────────────────────────
    const displayPE = currentPE !== null && !isNaN(currentPE)
        ? parseFloat(currentPE).toFixed(2)
        : '--';

    return (
        <IndicatorCard
            config={{
                title: 'P/E Ratio',
                category: 'Valuation',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore ?? 5,
                updateTime: lastUpdated ?? '--:--',
                source: isLiveData ? 'Upstox' : 'Manual',
                aiModel: configData?.aiModel ?? 'Engine v2'
            }}
            data={{
                currentValueObj: {
                    label: 'Current P/E',
                    value: displayPE,
                },
                details: [
                    sectorPE !== null && {
                        label: 'Sector P/E',
                        value: parseFloat(sectorPE).toFixed(1),
                        isManual: false,
                    }
                ].filter(Boolean),
                score,
                bias,
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 5.0,
            }}
            chartData={{
                points: [],   // Chart populated when historical ratio data is available
                valueKey: 'value',
                valueName: 'P/E Ratio',
            }}
            insights={{
                aiInsight,
                whyItMatters: [
                    'Primary metric for relative equity valuation — compares price to earnings power.',
                    'A PE below historical average may signal undervaluation; above may signal overextension.',
                    'Sector-relative PE reveals whether a stock is cheap or expensive vs its peers.',
                    'High PE requires strong future earnings growth to be justified — tracks growth expectations.',
                    'Low PE can signal value opportunities but may also reflect deteriorating fundamentals.',
                ],
            }}
        />
    );
}
