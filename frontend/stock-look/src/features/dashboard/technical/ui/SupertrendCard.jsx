import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function SupertrendCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const configData = getIndicatorConfig('supertrend');
    
    let score = 50, bias = "Neutral", confidence = 75, aiInsightText = "Waiting for data...";
    const currentPrice = initialData?.currentPrice || 100;

    if (currentValue !== null) {
        const diff = currentPrice - currentValue;
        const pctDiff = (diff / currentValue) * 100;
        
        if (pctDiff > 0) {
            score = 80;
            bias = "Bullish";
            if (pctDiff < 1) {
                aiInsightText = "Fresh Bullish Flip: trend has shifted upward after sustained buying pressure.";
            } else {
                aiInsightText = "Bullish Trend: buyers remain in control and price continues to respect the Supertrend.";
            }
        } else if (pctDiff < 0) {
            score = 20;
            bias = "Bearish";
            if (pctDiff > -1) {
                aiInsightText = "Fresh Bearish Flip: previous uptrend has ended and market sentiment has weakened.";
            } else {
                aiInsightText = "Bearish Trend: sellers remain dominant and downside momentum persists.";
            }
        } else {
            score = 50;
            bias = "Neutral";
            aiInsightText = "Frequent Trend Flips: market conditions are choppy and trend-following strategies are less reliable.";
        }
    }

    return (
        <IndicatorCard
            config={{ title: "Supertrend", category: "Trend", mode: "MANUAL", creditScore: configData.creditScore, updateTime: "--:--", source: configData.source, aiModel: configData.aiModel }}
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
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Supertrend" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Combines trend direction and volatility (ATR) in one indicator.",
                    "Excellent for trailing stop losses in strong trends.",
                    "Provides clear, visual buy and sell boundaries.",
                    "Reacts dynamically to market volatility.",
                    "Reduces emotional trading by drawing definitive lines in the sand."
                ] 
            }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
