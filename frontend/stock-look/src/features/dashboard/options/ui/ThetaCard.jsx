import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function ThetaCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const [daysToExpiry, setDaysToExpiry] = useState(initialData?.daysToExpiry || 7);

    const configData = getIndicatorConfig('theta');
    
    let score = 0, bias = "Neutral", confidence = "90%", aiInsightText = "Waiting...";
    
    if (currentValue !== null) {
        // Theta is typically negative, so higher absolute value means more decay.
        const absTheta = Math.abs(currentValue);
        
        if (absTheta < 5) { // Arbitrary low decay
            score = 85;
            bias = "Bullish";
            aiInsightText = "Explain that time decay remains limited, making the option less sensitive to the passage of time.";
        } else if (absTheta >= 5 && absTheta < 15) {
            score = 65;
            bias = "Neutral";
            aiInsightText = "Explain that normal time decay is affecting the option premium.";
        } else if (absTheta >= 15 && absTheta < 30) {
            score = 30;
            bias = "Bearish";
            aiInsightText = "Explain that option value is declining rapidly as expiry approaches.";
        } else {
            score = 10;
            bias = "High Risk";
            aiInsightText = "Explain that time decay is accelerating significantly, increasing the risk for option buyers.";
        }
    }

    return (
        <IndicatorCard
            config={{ title: configData.title, category: configData.category, mode: "MANUAL", creditScore: configData.creditScore, updateTime: "--:--", source: configData.source, aiModel: configData.aiModel }}
            data={{ 
                currentValueObj: { label: "Theta", value: currentValue ?? "--" }, 
                details: [
                    { label: "Daily Time Decay", value: currentValue !== null ? currentValue.toString() : "--" },
                    { label: "Days to Expiry", value: daysToExpiry }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Theta" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Measures daily option premium erosion.",
                    "Helps evaluate expiry risk.",
                    "Essential for option selling strategies.",
                    "Supports position management.",
                    "Improves option selection."
                ]
            }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
