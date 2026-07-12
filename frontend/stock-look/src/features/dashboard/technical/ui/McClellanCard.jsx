import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function McClellanCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    
    const configData = getIndicatorConfig('mcclellan');
    
    let score = 0, bias = "Neutral", confidence = "75%", aiInsightText = "Waiting for data...";
    
    let momentum = "Neutral";
    let zeroLine = "Near Zero";

    if (currentValue !== null) {
        if (currentValue < -50) {
            score = 20;
            bias = "Bearish";
            momentum = "Weakening";
            zeroLine = "Below";
            aiInsightText = "Strong negative reading; widespread selling pressure in the market.";
        } else if (currentValue < 0) {
            score = 40;
            bias = "Bearish";
            momentum = "Weakening";
            zeroLine = "Below";
            aiInsightText = "Oscillator is below zero; market participation is weakening.";
        } else if (currentValue === 0) {
            score = 60;
            bias = "Neutral";
            momentum = "Neutral";
            zeroLine = "Near Zero";
            aiInsightText = "Oscillator near zero; this may represent an early change in market participation.";
        } else if (currentValue <= 50) {
            score = 75;
            bias = "Bullish";
            momentum = "Improving";
            zeroLine = "Above";
            aiInsightText = "Oscillator is above zero; market breadth momentum is improving.";
        } else {
            score = 90;
            bias = "Bullish";
            momentum = "Improving";
            zeroLine = "Above";
            aiInsightText = "Strong positive reading; highlights broad buying momentum.";
        }
    }

    const whyItMatters = [
        "Measures breadth momentum.",
        "Detects internal market shifts early.",
        "Identifies improving or weakening participation.",
        "Confirms trend sustainability.",
        "Often leads index price movement."
    ];

    return (
        <IndicatorCard
            config={{ 
                title: "McClellan Oscillator", 
                category: "Market Breadth", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: "Live", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Oscillator", value: currentValue ?? "--" }, 
                details: [
                    { label: "Momentum", value: momentum },
                    { label: "Zero Line", value: zeroLine }
                ],
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "McClellan" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => { 
                const n = parseFloat(val); 
                if(!isNaN(n)) setCurrentValue(n); 
            }}
        />
    );
}
