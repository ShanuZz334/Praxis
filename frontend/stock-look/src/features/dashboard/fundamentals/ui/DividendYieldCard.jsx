import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

function scoreDividendYield(currentYield, bondYield) {
    if (currentYield === null || isNaN(currentYield)) return { score: 0, bias: 'Neutral', confidence: '0%' };

    let score = 50;
    let confidencePoints = 40;

    // 1. Absolute Yield vs Risk-Free Rate (Bond Yield)
    if (bondYield !== null && !isNaN(bondYield)) {
        confidencePoints += 20;
        const spread = currentYield - bondYield;
        if (spread > 2.0) score += 20; // Yielding much more than bonds
        else if (spread > 0) score += 10; // Yielding more than bonds
        else if (currentYield === 0) score -= 10; // No yield
        else score -= 5;
    } else {
        // Fallback to absolute thresholds if bond yield is missing
        if (currentYield > 5.0) score += 20;
        else if (currentYield > 3.0) score += 10;
        else if (currentYield === 0) score -= 10;
    }



    score = Math.max(0, Math.min(100, score));

    let bias = "Neutral";
    if (score >= 80) bias = "Strong Bullish";
    else if (score >= 65) bias = "Bullish";
    else if (score <= 20) bias = "Strong Bearish";
    else if (score <= 35) bias = "Bearish";

    return { score, bias, confidence: `${confidencePoints}%` };
}

function generateAiInsight(currentYield, bondYield) {
    if (currentYield === null || isNaN(currentYield)) return "Awaiting manual entry of the Dividend Yield (%).";
    if (currentYield === 0) return "This stock does not currently pay a dividend, prioritizing internal reinvestment over shareholder distributions.";

    let text = `Offering a dividend yield of ${currentYield}%.`;

    if (bondYield !== null) {
        if (currentYield > bondYield) text += ` This impressively exceeds the 10Y risk-free rate of ${bondYield}%, providing excellent income.`;
        else text += ` This trails the 10Y risk-free rate of ${bondYield}%, meaning bonds offer higher pure income.`;
    }



    return text;
}

export default function DividendYieldCard({ data = null, manualOverride, lastUpdated }) {
    // Upstox API v2 does not provide Dividend Yield in its Key Ratios endpoint.
    // It must be manually provided.
    const isManual = true;

    // 1. Core State
    const currentYield = manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? parseFloat(manualOverride) : null;
    

        
    const bondYield = data?.manualBondYield !== undefined && data?.manualBondYield !== null && data?.manualBondYield !== '' 
        ? parseFloat(data.manualBondYield) : null;

    // 2. Load Central Config
    const configData = getIndicatorConfig('dividend_yield');

    // 3. Praxis Engine Variables
    const { score, bias, confidence } = scoreDividendYield(currentYield, bondYield);
    const aiInsightText = generateAiInsight(currentYield, bondYield);

        return (
        <IndicatorCard
            config={{
                title: 'Dividend Yield',
                category: 'Market Health',
                mode: 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: 'Manual Override',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Dividend Yield (%)', value: currentYield !== null && !isNaN(currentYield) ? currentYield : '--' },
                details: [
                    bondYield !== null && !isNaN(bondYield) && { label: '10Y Bond Yield', value: bondYield + '%', isManual: true }
                ].filter(Boolean),
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Yield (%)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Measures income generated relative to stock price.',
                    'Provides downside protection in bear markets.',
                    'Indicator of mature, stable companies.'
                ]
            }}
        />
    );
}
