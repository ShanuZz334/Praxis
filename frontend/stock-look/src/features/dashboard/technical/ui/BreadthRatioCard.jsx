import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function BreadthRatioCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    
    const configData = getIndicatorConfig('breadth_ratio');
    
    let score = 0, bias = "Neutral", confidence = "75%", aiInsightText = "Waiting for data...";
    
    // Derived values for dummy data or initial state
    const advancing = currentValue ? Math.floor(1000 * currentValue) : 0;
    const declining = currentValue ? 1000 : 0;
    let participation = "Normal";

    if (currentValue !== null) {
        if (currentValue <= 0.5) {
            score = 20;
            bias = "Strong Bearish";
            participation = "Weak";
            aiInsightText = "Declining stocks significantly outnumber advancing stocks, showing extreme weakness.";
        } else if (currentValue <= 0.99) {
            score = 40;
            bias = "Bearish";
            participation = "Weak";
            aiInsightText = "Declining stocks outnumber advancing stocks, indicating bearish market breadth.";
        } else if (currentValue <= 1.1) {
            score = 60;
            bias = "Neutral";
            participation = "Normal";
            aiInsightText = "Buyers and sellers are relatively balanced, showing neutral market breadth.";
        } else if (currentValue <= 2.0) {
            score = 75;
            bias = "Bullish";
            participation = "Strong";
            aiInsightText = "Broad market participation supports the current uptrend with solid breadth.";
        } else {
            score = 90;
            bias = "Strong Bullish";
            participation = "Strong";
            aiInsightText = "Excellent market participation; advancing stocks dominate the market.";
        }
    }

    const whyItMatters = [
        "Provides a real-time view of market participation.",
        "Confirms whether rallies are broad-based.",
        "Detects weakening market internals.",
        "Easy to interpret.",
        "Complements A/D Line and NH/NL."
    ];

    return (
        <IndicatorCard
            config={{ 
                title: "Market Breadth Ratio", 
                category: "Market Breadth", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: "Live", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Breadth Ratio", value: currentValue ? currentValue.toFixed(2) : "--" }, 
                details: [
                    { label: "Advancing Stocks", value: advancing || "--" },
                    { label: "Declining Stocks", value: declining || "--" },
                    { label: "Participation", value: participation }
                ],
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Breadth Ratio" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => { 
                const n = parseFloat(val); 
                if(!isNaN(n)) setCurrentValue(n); 
            }}
        />
    );
}
