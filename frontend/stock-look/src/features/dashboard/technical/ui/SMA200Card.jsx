import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function SMA200Card({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const configData = getIndicatorConfig('sma_200');
    
    let score = 50, bias = "Neutral", confidence = 75, aiInsightText = "Waiting for data...";
    const currentPrice = initialData?.currentPrice || 100;

    if (currentValue !== null) {
        const diff = currentPrice - currentValue;
        const pctDiff = (diff / currentValue) * 100;
        
        if (pctDiff > 5) score = 90;
        else if (pctDiff > 0) score = 60 + (pctDiff * 6);
        else if (pctDiff < -5) score = 10;
        else score = 40 + (pctDiff * 6);

        if (pctDiff > 2) {
            bias = "Bullish";
            aiInsightText = `Price is above rising SMA 200, indicating that the long-term market structure remains healthy. (Distance: ${pctDiff.toFixed(2)}%)`;
        } else if (pctDiff < -2) {
            bias = "Bearish";
            aiInsightText = `Price is below falling SMA 200, indicating that long-term selling pressure remains dominant. (Distance: ${pctDiff.toFixed(2)}%)`;
        } else if (pctDiff > 0) {
            bias = "Bullish";
            aiInsightText = `Price crossing above SMA 200; the market may be entering a new long-term bullish phase.`;
        } else {
            bias = "Neutral";
            aiInsightText = `Price near SMA 200; the market is testing one of the most important long-term support/resistance levels.`;
        }
    }

    return (
        <IndicatorCard
            config={{ title: "SMA 200", category: "Trend", mode: "MANUAL", creditScore: configData.creditScore, updateTime: "--:--", source: configData.source, aiModel: configData.aiModel }}
            data={{ 
                currentValueObj: { label: "Value", value: currentValue ?? "--" }, 
                details: [
                    { label: "Trend Dir", value: bias }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "SMA 200" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "The ultimate institutional benchmark for long-term trend direction.",
                    "Slower and more stable than EMA200.",
                    "Used globally by investors to filter bull and bear markets.",
                    "Major resistance in bear markets and major support in bull markets.",
                    "Forms the slower leg of the famous 'Golden Cross' signal."
                ] 
            }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
