import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function ATRCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const configData = getIndicatorConfig('atr');
    
    let score = 50, bias = "Normal", confidence = "75%", aiInsightText = "Waiting for data...";
    
    if (currentValue !== null) {
        const val = Number(currentValue);
        score = val >= 0 && val <= 100 ? val : 50; 
        
        if (score >= 85) { 
            bias = "Extreme"; 
            aiInsightText = "Price swings are extreme. The market is experiencing massive volatility expansion."; 
        } else if (score >= 70) { 
            bias = "High"; 
            aiInsightText = "Price swings are increasing and volatility is expanding."; 
        } else if (score >= 50) { 
            bias = "Normal"; 
            aiInsightText = "The market is experiencing normal movement with stable ATR."; 
        } else if (score >= 30) { 
            bias = "Low"; 
            aiInsightText = "Volatility is decreasing and the market is becoming quieter."; 
        } else { 
            bias = "Very Low"; 
            aiInsightText = "The market is consolidating (Very Low ATR) and a breakout may be approaching."; 
        }
    }

    return (
        <IndicatorCard
            config={{ 
                title: "Average True Range", 
                category: "Volatility", 
                mode: "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "ATR Score", value: currentValue ?? "--" }, 
                details: [
                    {label: "30-Day Average", value: "--"}, 
                    {label: "Volatility State", value: bias}
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "ATR Score" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Measures market volatility.",
                    "Helps position sizing.",
                    "Determines stop-loss distance.",
                    "Confirms breakout quality.",
                    "Essential for professional risk management."
                ]
            }}
            onSave={(val) => { 
                const n = parseFloat(val); 
                if(!isNaN(n)) setCurrentValue(n); 
            }}
        />
    );
}
