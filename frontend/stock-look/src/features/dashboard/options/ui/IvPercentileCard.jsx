import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function IvPercentileCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || 40);
    
    const configData = getIndicatorConfig('iv_percentile');
    
    let score = 0, bias = "Neutral", confidence = "90%", aiInsightText = "Waiting...";
    
    if (currentValue < 20) {
        bias = "Bullish";
        score = 85;
        aiInsightText = "Current implied volatility is lower than most historical observations, indicating relatively inexpensive option premiums.";
    } else if (currentValue < 50) {
        bias = "Neutral";
        score = 65;
        aiInsightText = "Implied volatility is within its normal historical range.";
    } else if (currentValue < 80) {
        bias = "Cautious";
        score = 45;
        aiInsightText = "Implied volatility is higher than average and option premiums are becoming expensive.";
    } else {
        bias = "Bearish";
        score = 15;
        aiInsightText = "Implied volatility has remained below the current level for most of the historical period, indicating elevated option premiums and higher uncertainty.";
    }

    const whyItMatters = [
        "Measures historical volatility frequency.",
        "Evaluates option premium levels.",
        "Supports volatility trading strategies.",
        "Complements IV Rank.",
        "Improves options pricing analysis."
    ];

    return (
        <IndicatorCard
            config={{
                title: "IV Percentile",
                category: "Volatility",
                mode: "MANUAL",
                creditScore: configData.creditScore,
                updateTime: "--:--",
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "IV Percentile (%)", value: `${currentValue}` },
                details: [
                    { label: "Current ATM IV", value: "15.2%" },
                    { label: "Lookback Period", value: "252 Days" }
                ],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "IV Percentile" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => {
                const n = parseFloat(val);
                if (!isNaN(n)) setCurrentValue(n);
            }}
        />
    );
}
