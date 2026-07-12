/**
 * @file PBRatioCard.jsx
 * @purpose Displays the Price-to-Book (P/B) Ratio fundamental indicator.
 *
 * DATA SOURCES:
 *  - currentPB    → LIVE: Upstox key-ratios API (if available) or MANUAL (pb_ratio)
 *  - sectorPB     → LIVE: Upstox key-ratios API (data.ratios[].sector_value)
 *
 * SCORING ENGINE:
 *  Compares current PB against historical and sector averages.
 */
import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { formatDecimal } from '@/shared/utils/formatters';

/**
 * Robust scoring engine for P/B Ratio.
 * 
 * Returns: { score: number, bias: string, confidence: string }
 */
function scorePBRatio(currentPB, historicalPB, sectorPB) {
    if (!currentPB) {
        return { score: 0, bias: "Unknown", confidence: "0%" };
    }

    let score = 50;
    let bias = "Neutral";
    let confidence = "50%";
    let conditionsMet = 0;

    // 1. Compare vs Historical Average (Primary Weight)
    if (historicalPB) {
        conditionsMet++;
        if (currentPB <= historicalPB * 0.7) {
            score += 30; // Deep discount to own history
        } else if (currentPB < historicalPB * 0.95) {
            score += 15; // Moderate discount
        } else if (currentPB >= historicalPB * 1.3) {
            score -= 30; // Severe premium
        } else if (currentPB > historicalPB * 1.05) {
            score -= 15; // Moderate premium
        }
    }

    // 2. Compare vs Sector Average (Secondary Weight)
    if (sectorPB) {
        conditionsMet++;
        if (currentPB <= sectorPB * 0.8) {
            score += 15;
        } else if (currentPB < sectorPB * 0.95) {
            score += 5;
        } else if (currentPB >= sectorPB * 1.2) {
            score -= 15;
        } else if (currentPB > sectorPB * 1.05) {
            score -= 5;
        }
    }

    // Normalize Score
    score = Math.max(0, Math.min(100, score));

    // Determine Bias
    if (score >= 80) bias = "Strong Bullish";
    else if (score >= 60) bias = "Bullish";
    else if (score <= 20) bias = "Strong Bearish";
    else if (score <= 40) bias = "Bearish";
    else bias = "Neutral";

    // Determine Confidence
    if (conditionsMet === 2) confidence = "90%";
    else if (conditionsMet === 1) confidence = "70%";
    else confidence = "40%"; // Only have current PB

    return { score, bias, confidence };
}

/**
 * Generates dynamic human-readable insights based on the mathematical relationships.
 */
function generateAiInsight(currentPB, historicalPB, sectorPB) {
    if (!currentPB) {
        return "Insufficient data to analyze Price-to-Book valuation. Waiting for Upstox feed or manual override.";
    }

    if (historicalPB && sectorPB) {
        if (currentPB < historicalPB && currentPB < sectorPB) {
            return `Trading at a dual discount to both its historical average (${historicalPB}) and the sector (${sectorPB}), presenting a compelling value proposition assuming asset quality remains intact.`;
        } else if (currentPB > historicalPB && currentPB > sectorPB) {
            return `Priced at a premium over both historical norms and sector peers. Investors are pricing in exceptional future ROE or significant intangible asset value not captured on the balance sheet.`;
        } else if (currentPB < historicalPB && currentPB > sectorPB) {
            return `Historically undervalued for this specific company, but still commands a premium over the broader sector average of ${sectorPB}.`;
        } else {
            return `Trading above historical norms but below the sector average. The market recognizes improving fundamentals but hasn't fully re-rated it to sector levels.`;
        }
    }

    if (historicalPB) {
        if (currentPB < historicalPB * 0.9) return `Trading at a significant discount to its historical book value multiple, suggesting potential undervaluation or structural asset impairment.`;
        if (currentPB > historicalPB * 1.1) return `Commanding a premium over its historical book value average, indicating market optimism regarding asset yield.`;
        return `Fairly valued relative to its own historical book value multiples.`;
    }

    if (sectorPB) {
        if (currentPB < sectorPB) return `Trading cheaper than the sector average on a price-to-book basis.`;
        if (currentPB > sectorPB) return `Commanding a premium over sector peers for its net assets.`;
    }

    return `Current P/B stands at ${currentPB}.`;
}

export default function PBRatioCard({ data = null, manualOverride, lastUpdated }) {
    // 1. Live Data Extraction (Upstox)
    const upstoxPBObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => r.name === "P/B" || r.name === "PB" || r.name?.toLowerCase().includes("pb ratio"));
    const parsedUpstoxPB = upstoxPBObj?.company_value ? parseFloat(upstoxPBObj.company_value) : null;
    
    // 2. Data Resolution
    const isLiveData = parsedUpstoxPB !== null && !isNaN(parsedUpstoxPB);
    const currentPB = isLiveData ? parsedUpstoxPB : (manualOverride ? parseFloat(manualOverride) : null);
    
    const historicalPB = null; // Removed to comply with Zero Clutter Rule
    const sectorPB = upstoxPBObj?.sector_value ? parseFloat(upstoxPBObj.sector_value) : null;

    // 3. Calculation Engine
    const { score, bias, confidence } = scorePBRatio(currentPB, historicalPB, sectorPB);
    const aiInsightText = generateAiInsight(currentPB, historicalPB, sectorPB);

    // 4. Configuration
    const configData = getIndicatorConfig('pb_ratio');

    return (
        <IndicatorCard
            config={{
                title: 'P/B Ratio',
                category: 'Valuation',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isLiveData ? 'Upstox API' : 'Manual Override',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { 
                    label: 'Current PB', 
                    value: currentPB !== null ? `${formatDecimal(currentPB)}x` : '--' 
                },
                details: [
                    sectorPB !== null && {
                        label: 'Sector P/B',
                        value: `${formatDecimal(sectorPB)}x`,
                        isManual: false,
                    }
                ].filter(Boolean),
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '0%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'P/B Ratio'
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'Compares market capitalization to accounting book value.',
                    'Crucial for evaluating financial stocks like banks and NBFCs.',
                    'A ratio under 1.0 may indicate deep undervaluation if assets are sound.'
                ]
            }}
        />
    );
}
