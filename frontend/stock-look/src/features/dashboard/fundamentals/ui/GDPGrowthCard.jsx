import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

function scoreGDPGrowth(currentGrowth) {
    if (currentGrowth === null || isNaN(currentGrowth)) {
        return { score: 50, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
    }

    let score = 50;
    let trendDesc = "Stable";
    let bias = "Neutral";

    if (currentGrowth > 8) {
        score = 95; bias = "Strong Bullish"; trendDesc = "Rapid Expansion";
    } else if (currentGrowth > 6) {
        score = 82; bias = "Bullish"; trendDesc = "Healthy Expansion";
    } else if (currentGrowth > 4) {
        score = 60; bias = "Neutral"; trendDesc = "Moderate Growth";
    } else if (currentGrowth > 0) {
        score = 35; bias = "Bearish"; trendDesc = "Economic Slowdown";
    } else {
        score = 10; bias = "Strong Bearish"; trendDesc = "Contraction (Recession)";
    }

    return { score, bias, confidence: '85%', trendDesc };
}

function generateAiInsight(currentGrowth, trendDesc) {
    if (currentGrowth === null || isNaN(currentGrowth)) {
        return "Waiting for manual GDP Growth input to generate insight.";
    }

    let text = `The broader economy is currently in a state of ${trendDesc}, expanding at a rate of ${currentGrowth}%.`;

    if (trendDesc === "Rapid Expansion") {
        text += " This highly stimulative environment acts as a massive tailwind for corporate earnings, heavily favoring pro-cyclical sectors like Industrials and Financials.";
    } else if (trendDesc === "Healthy Expansion") {
        text += " Steady economic expansion provides a supportive backdrop for overall market valuations without triggering immediate inflation fears.";
    } else if (trendDesc === "Economic Slowdown") {
        text += " A slowing GDP puts pressure on corporate margins and consumer spending. Defensive sectors usually outperform in this regime.";
    } else if (trendDesc === "Contraction (Recession)") {
        text += " An actively shrinking economy implies rising unemployment, collapsing demand, and severe earnings downgrades. High market risk.";
    }

    return text;
}

export default function GDPGrowthCard({ data = null, manualOverride, lastUpdated }) {
    // 1. Core State (100% Manual Macro Indicator)
    const isManual = true;
    const currentGrowth = manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? parseFloat(manualOverride) 
        : null;

    // 2. Load Central Config
    const configData = getIndicatorConfig('gdp_growth');

    // 3. Praxis Engine
    const { score, bias, confidence, trendDesc } = scoreGDPGrowth(currentGrowth);
    const aiInsightText = generateAiInsight(currentGrowth, trendDesc);

        return (
        <IndicatorCard
            config={{
                title: 'GDP Growth',
                category: 'Growth',
                mode: 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: 'Manual (Macro)',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'GDP Growth (%)', value: currentGrowth !== null ? currentGrowth : '--' },
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
                    'Measures overall macroeconomic health.',
                    'Drives top-line revenue for most sectors.',
                    'Influences monetary policy decisions.'
                ]
            }}
        />
    );
}
