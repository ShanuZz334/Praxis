import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function UsdInrCard({ cardData, resolveTime, isLive }) {
    const configData = getIndicatorConfig('usd_inr');
    
    const currentValue = cardData?.value ?? null;
    const score = cardData?.score ?? 50;
    const bias = cardData?.bias ?? "Neutral";
    const confidence = cardData?.confidence ? `${cardData.confidence}%` : "92%";
    const aiInsightText = cardData?.insight ?? "Awaiting data input to generate insights.";
    const impactWeight = cardData?.impact ?? configData.impactWeight ?? "Very High";
    
    const whyItMatters = [
        "Measures Rupee strength.",
        "Influences FII investment flows.",
        "Impacts import costs and inflation.",
        "Affects corporate earnings.",
        "Strong macroeconomic indicator."
    ];

    const displayValue = currentValue !== null ? `₹${Number(currentValue).toFixed(2)}` : "--";

    return (
        <IndicatorCard
            config={{ 
                title: configData.title || "USD/INR Exchange Rate", 
                category: configData.category || "Global Macro", 
                mode: isLive ? "AUTO" : "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: resolveTime, 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "USD/INR Rate", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight 
            }}
            chartData={{ points: [], valueKey: "value", valueName: "USD/INR" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
        />
    );
}
