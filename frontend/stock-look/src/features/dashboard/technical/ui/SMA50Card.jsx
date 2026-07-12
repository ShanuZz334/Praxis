import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function SMA50Card({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const configData = getIndicatorConfig('sma_50');
    
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
            aiInsightText = `Price is above rising SMA 50; the market remains in a healthy medium-term uptrend. (Distance: ${pctDiff.toFixed(2)}%)`;
        } else if (pctDiff < -1) {
            bias = "Bearish";
            aiInsightText = `Price is below falling SMA 50; sellers dominate the medium-term trend. (Distance: ${pctDiff.toFixed(2)}%)`;
        } else if (pctDiff > 0) {
            bias = "Bullish";
            aiInsightText = `Price crossing above SMA 50; buyers have regained medium-term control.`;
        } else {
            bias = "Neutral";
            aiInsightText = `Price near SMA 50; the market is testing an important trend support/resistance level.`;
        }
    }

    return (
        <IndicatorCard
            config={{ title: "SMA 50", category: "Trend", mode: "MANUAL", creditScore: configData.creditScore, updateTime: "--:--", source: configData.source, aiModel: configData.aiModel }}
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
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "SMA 50" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Highly respected medium-term trend indicator.",
                    "Less sensitive to daily volatility than EMA50.",
                    "Widely used in traditional charting and technical analysis.",
                    "Often serves as a trailing stop for swing traders.",
                    "A key component of the famous 'Golden Cross' and 'Death Cross' signals."
                ] 
            }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
