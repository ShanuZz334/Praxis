import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function GammaCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const [optionType, setOptionType] = useState(initialData?.optionType || 'Call');
    const [moneyness, setMoneyness] = useState(initialData?.moneyness || 'ATM');

    const configData = getIndicatorConfig('gamma');
    
    let score = 0, bias = "Neutral", confidence = "90%", aiInsightText = "Waiting...";
    
    if (currentValue !== null) {
        if (currentValue < 0.02) { // Arbitrary low value
            score = 85;
            bias = "Bullish";
            aiInsightText = "Explain that Delta is expected to remain relatively stable with small price movements.";
        } else if (currentValue >= 0.02 && currentValue < 0.05) {
            score = 65;
            bias = "Neutral";
            aiInsightText = "Explain that directional sensitivity remains within normal levels.";
        } else if (currentValue >= 0.05 && currentValue < 0.1) {
            score = 30;
            bias = "Cautious";
            aiInsightText = "Explain that Delta can change rapidly, increasing both opportunity and trading risk.";
        } else {
            score = 10;
            bias = "High Risk";
            aiInsightText = "Explain that options are highly sensitive to small market movements, especially near expiry.";
        }
    }

    return (
        <IndicatorCard
            config={{ title: configData.title, category: configData.category, mode: "MANUAL", creditScore: configData.creditScore, updateTime: "--:--", source: configData.source, aiModel: configData.aiModel }}
            data={{ 
                currentValueObj: { label: "Gamma", value: currentValue ?? "--" }, 
                details: [
                    { label: "Option Type", value: optionType },
                    { label: "Moneyness", value: moneyness }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Gamma" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Measures Delta stability.",
                    "Identifies high-risk option positions.",
                    "Supports options risk management.",
                    "Improves strike selection.",
                    "Essential for Gamma exposure analysis."
                ]
            }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
