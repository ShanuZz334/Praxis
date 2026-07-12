import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function AtmIvCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || 15.2);
    
    const configData = getIndicatorConfig('atm_iv');
    
    // Scoring logic (dummy values based on spec logic)
    let score = 0, bias = "Neutral", confidence = "90%", aiInsightText = "Waiting...";
    
    if (currentValue < 12) {
        bias = "Bullish";
        score = 90;
        aiInsightText = "Market uncertainty is declining and option premiums are becoming cheaper.";
    } else if (currentValue < 20) {
        bias = "Neutral";
        score = 70;
        aiInsightText = "Volatility expectations remain relatively unchanged.";
    } else if (currentValue < 30) {
        bias = "Cautious";
        score = 40;
        aiInsightText = "Traders expect larger future price movements.";
    } else {
        bias = "Bearish";
        score = 15;
        aiInsightText = "Options are expensive and market uncertainty is elevated.";
    }

    const whyItMatters = [
        "Measures expected market volatility.",
        "Helps evaluate option premiums.",
        "Identifies high-risk periods.",
        "Supports volatility-based trading decisions.",
        "Confirms market uncertainty."
    ];

    return (
        <IndicatorCard
            config={{
                title: "At-the-Money Implied Volatility",
                category: "Volatility",
                mode: "MANUAL",
                creditScore: configData.creditScore,
                updateTime: "--:--",
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "ATM IV (%)", value: `${currentValue}%` },
                details: [
                    { label: "Current ATM Strike", value: "22000" },
                    { label: "IV Trend", value: "Stable" }
                ],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "ATM IV" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => {
                const n = parseFloat(val);
                if (!isNaN(n)) setCurrentValue(n);
            }}
        />
    );
}
