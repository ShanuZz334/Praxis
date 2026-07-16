import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function GoldCard({ cardData, resolveTime, isLive }) {
    const configData = getIndicatorConfig('gold') || {};
    
    const currentValue = cardData?.value ?? null;
    const score = cardData?.score ?? 50;
    const bias = cardData?.bias ?? "Neutral";
    const confidence = cardData?.confidence ? `${cardData.confidence}%` : "92%";
    const aiInsightText = cardData?.insight ?? "Awaiting data input to generate insights.";
    const impactWeight = cardData?.impact ?? configData.impactWeight ?? "Moderate";
    
    const whyItMatters = [
        "Acts as a safe-haven asset.",
        "Reflects inflation expectations.",
        "Inversely correlated with real yields."
    ];

    const displayValue = currentValue !== null ? `$${Number(currentValue).toFixed(2)}` : "--";

    return (
        <IndicatorCard
            config={{ 
                title: configData.title || "Gold", 
                category: configData.category || "Commodities", 
                mode: isLive ? "AUTO" : "MANUAL", 
                creditScore: configData.creditScore ?? 5, 
                updateTime: resolveTime, 
                source: configData.source || "Upstox / Manual", 
                aiModel: configData.aiModel || "Praxis DeepSeek-R1"
            }}
            data={{ 
                currentValueObj: { label: "Price / oz", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight 
            }}
            chartData={{ points: [], valueKey: "value", valueName: "Gold" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
        />
    );
}
