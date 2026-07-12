import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function ADXCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const configData = getIndicatorConfig('adx');
    
    let score = 50, bias = "Neutral", confidence = 75, aiInsightText = "Waiting for data...";

    if (currentValue !== null) {
        if (currentValue > 40) {
            score = 90;
            bias = "Strong Trend";
            aiInsightText = "ADX is above 40; a strong trend is established but extremely high readings may eventually weaken.";
        } else if (currentValue > 25) {
            score = 75;
            bias = "Trending";
            aiInsightText = "ADX is rising above 25; trend strength is increasing and trend-following indicators become more reliable.";
        } else if (currentValue > 20) {
            score = 50;
            bias = "Weak Trend";
            aiInsightText = "ADX is falling or weak; trend momentum is fading even if price continues moving in the same direction.";
        } else {
            score = 25;
            bias = "Ranging";
            aiInsightText = "ADX is below 20; the market lacks a strong trend and range-bound strategies may perform better.";
        }
    }

    return (
        <IndicatorCard
            config={{ title: "ADX (14)", category: "Trend", mode: "MANUAL", creditScore: configData.creditScore, updateTime: "--:--", source: configData.source, aiModel: configData.aiModel }}
            data={{ 
                currentValueObj: { label: "Value", value: currentValue ?? "--" }, 
                details: [
                    { label: "Trend Strength", value: bias }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "ADX" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Identifies whether a market is trending or ranging.",
                    "Prevents false signals by filtering out choppy markets.",
                    "Measures trend strength, not trend direction.",
                    "Highly complementary to moving averages and MACD.",
                    "A rising ADX validates breakout signals."
                ] 
            }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
