import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function SilverCard({ cardData, resolveTime, isLive }) {
    const configData = getIndicatorConfig('silver') || {};
    
    const currentValue = cardData?.value ?? null;
    const score = cardData?.score ?? 50;
    const bias = cardData?.bias ?? "Neutral";
    const confidence = cardData?.confidence ? `${cardData.confidence}%` : "92%";
    const aiInsightText = cardData?.insight ?? "Awaiting data input to generate insights.";
    const impactWeight = cardData?.impact ?? configData.impactWeight ?? "Low";
    
    const whyItMatters = [
        "Reflects both monetary and industrial demand.",
        "Often leads precious metal cycles.",
        "Signals economic expansion when rallying."
    ];

    const displayValue = currentValue !== null ? `$${Number(currentValue).toFixed(2)}` : "--";

    return (
        <IndicatorCard
            config={{ 
                title: configData.title || "Silver", 
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
            chartData={{ points: [], valueKey: "value", valueName: "Silver" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
        />
    );
}
