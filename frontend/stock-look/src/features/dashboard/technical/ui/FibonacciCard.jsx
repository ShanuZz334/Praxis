import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function FibonacciCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    
    const configData = getIndicatorConfig('fibonacci');
    
    let score = 0, bias = "Neutral", confidence = "75%", aiInsightText = "Waiting...";
    
    if (currentValue !== null) {
        score = currentValue;
        
        if (score <= 30) {
            bias = "Bearish";
            aiInsightText = "The previous trend has likely ended.";
        } else if (score <= 50) {
            bias = "Bearish";
            aiInsightText = "Buyers are losing control and trend strength is weakening.";
        } else if (score <= 70) {
            bias = "Neutral";
            aiInsightText = "The market is testing the Golden Ratio, a key institutional support area.";
        } else if (score <= 85) {
            bias = "Bullish";
            aiInsightText = "The market is experiencing a healthy correction.";
        } else {
            bias = "Strong Bullish";
            aiInsightText = "The trend remains strong with only a shallow pullback.";
        }
    }

    const whyItMatters = [
        "Identifies high-probability pullback zones.",
        "Estimates dynamic support and resistance.",
        "Helps define entry and exit areas.",
        "Widely followed by institutional traders.",
        "Improves trend continuation analysis."
    ];

    return (
        <IndicatorCard
            config={{ 
                title: "Fibonacci Retracement", 
                category: "Market Structure", 
                mode: "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Score", value: currentValue ?? "--" }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Fibonacci Score" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
