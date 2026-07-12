import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function DxyCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const configData = getIndicatorConfig('dxy');
    
    let score = 0, bias = "Neutral", confidence = "92%", aiInsightText = "Waiting...";
    let impactWeight = configData.impactWeight || "Very High";
    
    let dailyChange = "0.00";
    let dailyChangePercent = "0.00%";
    
    if (currentValue !== null) {
        if (currentValue < 102.0) {
            score = 90;
            bias = "Bullish";
            dailyChange = "-0.50";
            dailyChangePercent = "-0.48%";
            aiInsightText = "The US Dollar is weakening, improving liquidity conditions for emerging markets like India.";
        } else if (currentValue > 105.0) {
            score = 20;
            bias = "Bearish";
            dailyChange = "+0.60";
            dailyChangePercent = "+0.57%";
            aiInsightText = "Dollar strength may pressure emerging market currencies and equities.";
        } else {
            score = 70;
            bias = "Neutral";
            dailyChange = "+0.00";
            dailyChangePercent = "0.00%";
            aiInsightText = "The Dollar remains stable with limited impact on global markets.";
        }
    }

    const whyItMatters = [
        "Measures global Dollar strength.",
        "Influences FII/FPI capital flows.",
        "Impacts the Indian Rupee.",
        "Reflects global liquidity conditions.",
        "One of the most important macroeconomic indicators."
    ];

    return (
        <IndicatorCard
            config={{ 
                title: configData.title || "US Dollar Index (DXY)", 
                category: configData.category || "Global Macro", 
                mode: "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "DXY Index", value: currentValue ?? "--" }, 
                details: [
                    { label: "Daily Change", value: dailyChange },
                    { label: "Daily Change (%)", value: dailyChangePercent }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "DXY" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
