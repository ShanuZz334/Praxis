import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function EMA200Card({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const configData = getIndicatorConfig('ema_200');
    
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
            aiInsightText = `Price is above the rising EMA 200, indicating that the market remains in a healthy long-term uptrend supported by institutional buying. (Distance: ${pctDiff.toFixed(2)}%)`;
        } else if (pctDiff < -2) {
            bias = "Bearish";
            aiInsightText = `Price is below the falling EMA 200, indicating that long-term selling pressure remains dominant. (Distance: ${pctDiff.toFixed(2)}%)`;
        } else if (pctDiff > 0) {
            bias = "Bullish";
            aiInsightText = `Price is crossing above EMA 200; a major bullish trend reversal may be developing but requires confirmation.`;
        } else {
            bias = "Neutral";
            aiInsightText = `Price is near EMA 200, indicating that the market is at a critical long-term support/resistance zone.`;
        }
    }

    return (
        <IndicatorCard
            config={{ title: "EMA 200", category: "Trend", mode: "MANUAL", creditScore: configData.creditScore, updateTime: "--:--", source: configData.source, aiModel: configData.aiModel }}
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
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "EMA 200" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Considered the ultimate line in the sand for long-term trend direction.",
                    "Heavily monitored by institutional algorithms and large funds.",
                    "Often marks major cyclical bottoms and tops.",
                    "Provides structural context for all shorter-term indicators.",
                    "A breakdown below EMA200 often triggers institutional stop-losses."
                ] 
            }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
