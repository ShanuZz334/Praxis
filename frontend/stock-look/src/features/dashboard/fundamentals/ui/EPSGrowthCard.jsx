import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

function scoreEPSGrowth(currentGrowth) {
    if (currentGrowth === null || isNaN(currentGrowth)) return { score: 0, bias: 'Neutral', confidence: '0%' };

    let score = 50;
    let confidencePoints = 40; // Base confidence

    // 1. Absolute Growth Check
    if (currentGrowth >= 20) score += 20;
    else if (currentGrowth >= 10) score += 10;
    else if (currentGrowth > 0) score += 0;
    else if (currentGrowth < 0) score -= 30;


    score = Math.max(0, Math.min(100, score));

    let bias = "Neutral";
    if (score >= 80) bias = "Strong Bullish";
    else if (score >= 65) bias = "Bullish";
    else if (score <= 20) bias = "Strong Bearish";
    else if (score <= 35) bias = "Bearish";

    return { score, bias, confidence: `${confidencePoints}%` };
}

function generateAiInsight(currentGrowth) {
    if (currentGrowth === null || isNaN(currentGrowth)) return "Awaiting manual entry of the EPS Growth (%).";

    let absoluteText = "";
    if (currentGrowth > 20) absoluteText = `Exceptional absolute growth of ${currentGrowth}%.`;
    else if (currentGrowth > 10) absoluteText = `Healthy absolute growth of ${currentGrowth}%.`;
    else if (currentGrowth > 0) absoluteText = `Modest growth of ${currentGrowth}%.`;
    else absoluteText = `Earnings contraction of ${currentGrowth}%.`;

    return absoluteText;
}

export default function EPSGrowthCard({ data = null, manualOverride, lastUpdated }) {
    // Upstox API v2 does not provide 'EPS Growth' directly.
    // It provides 'EPS (TTM)' but without historical data, we cannot derive growth.
    // Therefore, this is fully manual.
    const isManual = true;

    // 1. Core State
    const currentGrowth = manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? parseFloat(manualOverride) 
        : null;


    // 2. Load Central Config
    const configData = getIndicatorConfig('eps_growth');

    // 3. Praxis Engine Variables
    const { score, bias, confidence } = scoreEPSGrowth(currentGrowth);
    const aiInsightText = generateAiInsight(currentGrowth);

        return (
        <IndicatorCard
            config={{
                title: 'EPS Growth',
                category: 'Growth',
                mode: 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'EPS Growth (%)', value: currentGrowth !== null && !isNaN(currentGrowth) ? currentGrowth : '--' },
                details: [],
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Growth (%)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Primary driver of long-term stock returns.',
                    'Shows if revenue growth translates to the bottom line.',
                    'Critical for PEG ratio valuation.'
                ]
            }}
        />
    );
}
