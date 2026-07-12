import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function TrinCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    
    const configData = getIndicatorConfig('trin');
    
    let score = 0, bias = "Neutral", confidence = "75%", aiInsightText = "Waiting for data...";
    
    let mktPressure = "Neutral";
    let volPressure = "Moderate";

    if (currentValue !== null) {
        if (currentValue > 2.0) {
            score = 20; // 0-30 Heavy Selling
            bias = "Bearish";
            mktPressure = "Selling";
            volPressure = "Strong";
            aiInsightText = "Panic selling and elevated market fear detected.";
        } else if (currentValue > 1.0) {
            score = 40; // 30-50 Bearish
            bias = "Bearish";
            mktPressure = "Selling";
            volPressure = "Moderate";
            aiInsightText = "Selling pressure dominates the market.";
        } else if (currentValue === 1.0) {
            score = 60; // 50-70 Balanced
            bias = "Neutral";
            mktPressure = "Neutral";
            volPressure = "Moderate";
            aiInsightText = "Buyers and sellers remain balanced.";
        } else if (currentValue >= 0.5) {
            score = 75; // 70-85 Bullish
            bias = "Bullish";
            mktPressure = "Buying";
            volPressure = "Strong";
            aiInsightText = "Buying volume is stronger than selling volume.";
        } else {
            score = 90; // 85-100 Strong Buying
            bias = "Bullish";
            mktPressure = "Buying";
            volPressure = "Strong";
            aiInsightText = "Excessive optimism and a potentially overheated market; extreme buying pressure.";
        }
    }

    const whyItMatters = [
        "Combines breadth and volume into one indicator.",
        "Measures institutional buying and selling pressure.",
        "Detects panic and capitulation.",
        "Identifies excessive optimism.",
        "Confirms market participation."
    ];

    return (
        <IndicatorCard
            config={{ 
                title: "TRIN (Arms Index)", 
                category: "Market Breadth", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: "Live", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Current TRIN", value: currentValue ? currentValue.toFixed(2) : "--" }, 
                details: [
                    { label: "Market Pressure", value: mktPressure },
                    { label: "Volume Pressure", value: volPressure }
                ],
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "TRIN" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => { 
                const n = parseFloat(val); 
                if(!isNaN(n)) setCurrentValue(n); 
            }}
        />
    );
}
