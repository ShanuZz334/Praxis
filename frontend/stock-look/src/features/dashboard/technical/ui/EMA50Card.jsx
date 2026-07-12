import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function EMA50Card({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const configData = getIndicatorConfig('ema_50');
    
    let score = 50, bias = "Neutral", confidence = 75, aiInsightText = "Waiting for data...";
    const currentPrice = initialData?.currentPrice || 100;

    if (currentValue !== null) {
        const diff = currentPrice - currentValue;
        const pctDiff = (diff / currentValue) * 100;
        
        if (pctDiff > 5) score = 90;
        else if (pctDiff > 0) score = 60 + (pctDiff * 6);
        else if (pctDiff < -5) score = 10;
        else score = 40 + (pctDiff * 6);

        if (pctDiff > 1) {
            bias = "Bullish";
            aiInsightText = `Price is above the rising EMA 50; the medium-term trend remains healthy and buyers continue to control the market. (Distance: ${pctDiff.toFixed(2)}%)`;
        } else if (pctDiff < -1) {
            bias = "Bearish";
            aiInsightText = `Price is below the falling EMA 50, indicating increasing selling pressure and weakening market structure. (Distance: ${pctDiff.toFixed(2)}%)`;
        } else if (pctDiff > 0) {
            bias = "Bullish";
            aiInsightText = `Price is testing EMA 50; the market is testing an important dynamic support/resistance level.`;
        } else {
            bias = "Neutral";
            aiInsightText = `Flat EMA 50 indicates a lack of trend and increased probability of sideways movement.`;
        }
    }

    return (
        <IndicatorCard
            config={{ title: "EMA 50", category: "Trend", mode: "MANUAL", creditScore: configData.creditScore, updateTime: "--:--", source: configData.source, aiModel: configData.aiModel }}
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
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "EMA 50" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "One of the most respected institutional trend indicators.",
                    "Filters short-term market noise better than EMA20.",
                    "Often acts as medium-term dynamic support and resistance.",
                    "Used by funds and swing traders to identify trend direction.",
                    "Frequently combined with EMA20 and EMA200 for trend confirmation."
                ] 
            }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
