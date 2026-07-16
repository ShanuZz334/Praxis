import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function Us10yYieldCard({ cardData, resolveTime, isLive }) {
    const configData = getIndicatorConfig('us_10y_yield') || {};
    
    const currentValue = cardData?.value ?? null;
    const score = cardData?.score ?? 50;
    const bias = cardData?.bias ?? "Neutral";
    const confidence = cardData?.confidence ? `${cardData.confidence}%` : "92%";
    const aiInsightText = cardData?.insight ?? "Awaiting data input to generate insights.";
    const impactWeight = cardData?.impact ?? configData.impactWeight ?? "Very High";
    
    const whyItMatters = [
        "Measures global interest rate expectations.",
        "Reflects worldwide liquidity conditions.",
        "Influences FII/FPI capital flows.",
        "Impacts equity valuations.",
        "Critical macroeconomic indicator."
    ];

    const displayValue = currentValue !== null ? `${Number(currentValue).toFixed(3)}%` : "--";

    return (
        <IndicatorCard
            config={{ 
                title: configData.title || "US 10-Year Treasury Yield", 
                category: configData.category || "Rates & Volatility", 
                mode: isLive ? "AUTO" : "MANUAL", 
                creditScore: configData.creditScore ?? 5, 
                updateTime: resolveTime, 
                source: configData.source || "Upstox / Manual", 
                aiModel: configData.aiModel || "Praxis DeepSeek-R1"
            }}
            data={{ 
                currentValueObj: { label: "10-Year Yield (%)", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight 
            }}
            chartData={{ points: [], valueKey: "value", valueName: "Yield" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
        />
    );
}
