import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function EMA20Card({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const configData = getIndicatorConfig('ema_20');
    
    let score = 50, bias = "Neutral", confidence = 75, aiInsightText = "Waiting for data...";
    const currentPrice = initialData?.currentPrice || 100; // Mock current price

    if (currentValue !== null) {
        const diff = currentPrice - currentValue;
        const pctDiff = (diff / currentValue) * 100;
        
        if (pctDiff > 5) score = 90;
        else if (pctDiff > 0) score = 60 + (pctDiff * 6);
        else if (pctDiff < -5) score = 10;
        else score = 40 + (pctDiff * 6);

        if (pctDiff > 1) {
            bias = "Bullish";
            aiInsightText = `Price is above the rising EMA 20, indicating buyers are maintaining short-term trend control. (Distance: ${pctDiff.toFixed(2)}%)`;
        } else if (pctDiff < -1) {
            bias = "Bearish";
            aiInsightText = `Price is below the falling EMA 20, indicating sellers control the short-term trend. (Distance: ${pctDiff.toFixed(2)}%)`;
        } else if (pctDiff > 0) {
            bias = "Bullish";
            aiInsightText = `Price is above a relatively flat EMA 20, indicating a bullish bias but weak trend strength.`;
        } else {
            bias = "Neutral";
            aiInsightText = `Price is near the EMA 20, indicating the market is testing dynamic support/resistance.`;
        }
    }

    return (
        <IndicatorCard
            config={{ title: "EMA 20", category: "Trend", mode: "MANUAL", creditScore: configData.creditScore, updateTime: "--:--", source: configData.source, aiModel: configData.aiModel }}
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
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "EMA 20" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "One of the most widely used short-term trend indicators.",
                    "Acts as dynamic support during uptrends.",
                    "Acts as dynamic resistance during downtrends.",
                    "Reacts faster than SMA because recent prices carry more weight.",
                    "Forms the foundation for many institutional trading systems."
                ] 
            }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
