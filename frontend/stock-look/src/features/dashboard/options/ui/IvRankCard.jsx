import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function IvRankCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || 35);
    
    const configData = getIndicatorConfig('iv_rank');
    
    let score = 0, bias = "Neutral", confidence = "90%", aiInsightText = "Waiting...";
    
    if (currentValue < 20) {
        bias = "Bullish";
        score = 85; // Low IV Rank
        aiInsightText = "Implied volatility is near the lower end of its historical range, making option premiums relatively inexpensive.";
    } else if (currentValue < 50) {
        bias = "Neutral";
        score = 65; // Fair Value
        aiInsightText = "Implied volatility is within its normal historical range.";
    } else if (currentValue < 80) {
        bias = "Cautious";
        score = 45; // Expensive
        aiInsightText = "Option premiums are becoming relatively expensive.";
    } else {
        bias = "Bearish";
        score = 15; // Very Expensive
        aiInsightText = "Implied volatility is near historical highs, increasing option premiums and market uncertainty.";
    }

    const whyItMatters = [
        "Identifies expensive and cheap option premiums.",
        "Supports volatility-based strategies.",
        "Improves options timing.",
        "Complements ATM IV and IV Percentile.",
        "Widely used by professional options traders."
    ];

    return (
        <IndicatorCard
            config={{
                title: "IV Rank",
                category: "Volatility",
                mode: "MANUAL",
                creditScore: configData.creditScore,
                updateTime: "--:--",
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "IV Rank (%)", value: `${currentValue}` },
                details: [
                    { label: "Current ATM IV", value: "15.2%" },
                    { label: "Lookback Period", value: "252 Days" }
                ],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "IV Rank" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => {
                const n = parseFloat(val);
                if (!isNaN(n)) setCurrentValue(n);
            }}
        />
    );
}
