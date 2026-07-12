import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function VegaCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const [currentIV, setCurrentIV] = useState(initialData?.currentIV || '15%');
    const [ivSensitivity, setIvSensitivity] = useState(initialData?.ivSensitivity || '--');

    const configData = getIndicatorConfig('vega');
    
    let score = 0, bias = "Neutral", confidence = "90%", aiInsightText = "Waiting...";
    
    if (currentValue !== null) {
        if (currentValue < 2) { // Arbitrary low vega
            score = 85;
            bias = "Bullish";
            aiInsightText = "Explain that the option premium is relatively stable against changes in implied volatility.";
        } else if (currentValue >= 2 && currentValue < 5) {
            score = 65;
            bias = "Neutral";
            aiInsightText = "Explain that option pricing has a normal sensitivity to volatility changes.";
        } else if (currentValue >= 5 && currentValue < 10) {
            score = 30;
            bias = "Cautious";
            aiInsightText = "Explain that small changes in implied volatility can significantly affect the option premium.";
        } else {
            score = 10;
            bias = "High Risk";
            aiInsightText = "Explain that the option is highly sensitive to volatility changes and carries increased pricing risk.";
        }
    }

    return (
        <IndicatorCard
            config={{ title: configData.title, category: configData.category, mode: "MANUAL", creditScore: configData.creditScore, updateTime: "--:--", source: configData.source, aiModel: configData.aiModel }}
            data={{ 
                currentValueObj: { label: "Vega", value: currentValue ?? "--" }, 
                details: [
                    { label: "Current IV", value: currentIV },
                    { label: "IV Sensitivity", value: ivSensitivity }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Vega" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Measures volatility sensitivity.",
                    "Helps evaluate option pricing risk.",
                    "Supports volatility-based strategies.",
                    "Improves option selection.",
                    "Essential for volatility trading."
                ]
            }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
