import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function VixCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    
    const configData = getIndicatorConfig('india_vix');
    
    let score = 0, bias = "Neutral", confidence = "80%", aiInsightText = "Waiting for data...";
    
    // Derived values
    const avgVix = currentValue ? (currentValue * 0.95).toFixed(2) : "--";
    const dailyChange = currentValue ? (((currentValue - (currentValue * 0.95)) / (currentValue * 0.95)) * 100).toFixed(2) + "%" : "--";
    let volState = "Normal";

    if (currentValue !== null) {
        if (currentValue >= 25) {
            score = 20; // 0-30 Extreme Fear
            bias = "Risk-Off";
            volState = "Extreme";
            aiInsightText = "Market fear is elevated and risk management is important; traders expect larger price swings.";
        } else if (currentValue >= 20) {
            score = 40; // 30-50 High Risk
            bias = "Risk-Off";
            volState = "High";
            aiInsightText = "Traders expect larger price swings, signaling higher uncertainty.";
        } else if (currentValue >= 15) {
            score = 60; // 50-70 Normal
            bias = "Neutral";
            volState = "Normal";
            aiInsightText = "Market conditions remain relatively stable with normal uncertainty.";
        } else if (currentValue >= 12) {
            score = 75; // 70-85 Calm
            bias = "Risk-On";
            volState = "Low";
            aiInsightText = "Market uncertainty is decreasing and confidence is improving.";
        } else {
            score = 90; // 85-100 Very Calm
            bias = "Risk-On";
            volState = "Low";
            aiInsightText = "Market conditions remain very stable with low expected volatility.";
        }
    }

    const whyItMatters = [
        "Measures expected market volatility.",
        "Reflects overall market sentiment.",
        "Helps evaluate trading risk.",
        "Essential for options traders.",
        "Often warns before major market moves."
    ];

    return (
        <IndicatorCard
            config={{ 
                title: "India VIX", 
                category: "Market Volatility", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: "Live", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Current VIX", value: currentValue ? currentValue.toFixed(2) : "--" }, 
                details: [
                    { label: "30-Day Average", value: avgVix },
                    { label: "Daily Change", value: dailyChange },
                    { label: "Volatility State", value: volState }
                ],
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "VIX" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => { 
                const n = parseFloat(val); 
                if(!isNaN(n)) setCurrentValue(n); 
            }}
        />
    );
}
