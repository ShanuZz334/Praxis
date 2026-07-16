import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function DxyCard({ cardData, resolveTime, isLive }) {
    const configData = getIndicatorConfig('dxy') || {};
    
    const currentValue = cardData?.value ?? null;
    const score = cardData?.score ?? 50;
    const bias = cardData?.bias ?? "Neutral";
    const confidence = cardData?.confidence ? `${cardData.confidence}%` : "92%";
    const aiInsightText = cardData?.insight ?? "Awaiting data input to generate insights.";
    const impactWeight = cardData?.impact ?? configData.impactWeight ?? "Very High";
    
    const whyItMatters = [
        "Inversely correlated with risk assets.",
        "Reflects global liquidity conditions.",
        "Impacts emerging market capital flows."
    ];

    const displayValue = currentValue !== null ? Number(currentValue).toFixed(2) : "--";

    return (
        <IndicatorCard
            config={{ 
                title: configData.title || "US Dollar Index (DXY)", 
                category: configData.category || "Global Macro", 
                mode: isLive ? "AUTO" : "MANUAL", 
                creditScore: configData.creditScore ?? 5, 
                updateTime: resolveTime, 
                source: configData.source || "Upstox / Manual", 
                aiModel: configData.aiModel || "Praxis DeepSeek-R1"
            }}
            data={{ 
                currentValueObj: { label: "Index Value", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight 
            }}
            chartData={{ points: [], valueKey: "value", valueName: "DXY" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
        />
    );
}
