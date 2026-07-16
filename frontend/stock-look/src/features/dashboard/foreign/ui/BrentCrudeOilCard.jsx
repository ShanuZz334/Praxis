import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function BrentCrudeOilCard({ cardData, resolveTime, isLive }) {
    const configData = getIndicatorConfig('brent_crude') || {};
    
    const currentValue = cardData?.value ?? null;
    const score = cardData?.score ?? 50;
    const bias = cardData?.bias ?? "Neutral";
    const confidence = cardData?.confidence ? `${cardData.confidence}%` : "92%";
    const aiInsightText = cardData?.insight ?? "Awaiting data input to generate insights.";
    const impactWeight = cardData?.impact ?? configData.impactWeight ?? "Very High";
    
    const whyItMatters = [
        "Major component of India's import bill.",
        "Directly impacts current account deficit.",
        "Influences domestic inflation."
    ];

    const displayValue = currentValue !== null ? `$${Number(currentValue).toFixed(2)}` : "--";

    return (
        <IndicatorCard
            config={{ 
                title: configData.title || "Brent Crude Oil", 
                category: configData.category || "Commodities", 
                mode: isLive ? "AUTO" : "MANUAL", 
                creditScore: configData.creditScore ?? 5, 
                updateTime: resolveTime, 
                source: configData.source || "Upstox / Manual", 
                aiModel: configData.aiModel || "Praxis DeepSeek-R1"
            }}
            data={{ 
                currentValueObj: { label: "Price / bbl", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight 
            }}
            chartData={{ points: [], valueKey: "value", valueName: "Crude" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
        />
    );
}
