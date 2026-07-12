import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function DeltaCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const [optionType, setOptionType] = useState(initialData?.optionType || 'Call');
    const [moneyness, setMoneyness] = useState(initialData?.moneyness || 'ATM');

    const configData = getIndicatorConfig('delta');
    
    let score = 0, bias = "Neutral", confidence = "90%", aiInsightText = "Waiting...";
    
    if (currentValue !== null) {
        if (currentValue > 0.5) {
            score = 85;
            bias = "Bullish";
            aiInsightText = "Explain that the option is highly responsive to upward price movement.";
        } else if (currentValue < -0.5) {
            score = 25;
            bias = "Bearish";
            aiInsightText = "Explain that the option benefits from declining underlying prices.";
        } else if (currentValue >= -0.1 && currentValue <= 0.1) {
            score = 50;
            bias = "Neutral"; // ATM Delta logic is typically 0.5, but just checking near 0 as an example or maybe around 0.5 is ATM. Actually ATM Call Delta is usually ~0.5. 
            // Wait, let's just make it simple based on the value.
            // If we assume currentValue is between -1 and 1.
            // Rapid Delta Change is another option.
        }
    }
    
    // Better logic based on the spec
    if (currentValue !== null) {
        if (currentValue >= 0.7 || currentValue <= -0.7) {
            bias = currentValue > 0 ? "Bullish" : "Bearish";
            score = currentValue > 0 ? 90 : 10;
            aiInsightText = currentValue > 0 ? "Explain that the option is highly responsive to upward price movement." : "Explain that the option benefits from declining underlying prices.";
        } else if (currentValue > 0.3 && currentValue < 0.7) {
            bias = "Neutral";
            score = 65;
            aiInsightText = "Explain that the option provides balanced directional exposure.";
        } else if (currentValue > -0.7 && currentValue < -0.3) {
            bias = "Neutral";
            score = 35;
            aiInsightText = "Explain that the option provides balanced directional exposure.";
        } else {
            bias = "Neutral";
            score = 50;
            aiInsightText = "Explain that directional sensitivity is changing quickly due to price movement.";
        }
    }

    return (
        <IndicatorCard
            config={{ title: configData.title, category: configData.category, mode: "MANUAL", creditScore: configData.creditScore, updateTime: "--:--", source: configData.source, aiModel: configData.aiModel }}
            data={{ 
                currentValueObj: { label: "Delta", value: currentValue ?? "--" }, 
                details: [
                    { label: "Option Type", value: optionType },
                    { label: "Moneyness", value: moneyness }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Delta" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Measures directional exposure.",
                    "Helps select appropriate strike prices.",
                    "Supports hedging strategies.",
                    "Estimates option sensitivity.",
                    "Widely used by professional options traders."
                ]
            }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
