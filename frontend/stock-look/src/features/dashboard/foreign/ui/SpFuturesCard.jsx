import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function SpFuturesCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const [dailyChange, setDailyChange] = useState(initialData?.dailyChange || null);

    const configData = getIndicatorConfig('sp_futures');

    let score = 0, bias = "Neutral", confidence = "90%", aiInsightText = "Waiting for data...";
    
    if (dailyChange !== null) {
        if (dailyChange >= 0.50) {
            bias = "Bullish";
            score = 85;
            aiInsightText = "U.S. futures indicate positive global risk sentiment, supporting a stronger opening for Indian equities.";
        } else if (dailyChange > 0.10 && dailyChange < 0.50) {
            bias = "Neutral";
            score = 60;
            aiInsightText = "Global sentiment remains supportive with moderate buying interest.";
        } else if (dailyChange >= -0.10 && dailyChange <= 0.10) {
            bias = "Neutral";
            score = 50;
            aiInsightText = "Global markets are showing limited directional bias.";
        } else if (dailyChange < -0.10 && dailyChange > -0.50) {
            bias = "Neutral"; // Wait, spec says Bearish is below -0.50. So this is Neutral but with Negative text?
            score = 40;
            aiInsightText = "Weaker U.S. futures may increase selling pressure during the Indian session.";
        } else if (dailyChange <= -0.50 && dailyChange > -1.50) {
            bias = "Bearish";
            score = 25;
            aiInsightText = "Weaker U.S. futures may increase selling pressure during the Indian session.";
        } else if (dailyChange <= -1.50) {
            bias = "Strong Bearish";
            score = 10;
            aiInsightText = "Significant weakness in U.S. futures suggests elevated global risk-off sentiment.";
        }
    }

    return (
        <IndicatorCard
            config={{
                title: "S&P 500 Futures",
                category: "Global Macro",
                mode: "MANUAL",
                creditScore: configData.creditScore,
                updateTime: "--:--",
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "Futures Price", value: currentValue ?? "--" },
                details: [
                    { label: "Daily Change (%)", value: dailyChange !== null ? `${dailyChange.toFixed(2)}%` : "--" }
                ],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{
                points: initialData?.history || [],
                valueKey: "value",
                valueName: "S&P Futures"
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    "Indicates overnight global market sentiment.",
                    "Influences NIFTY and BANKNIFTY opening direction.",
                    "Reflects institutional risk appetite.",
                    "Confirms global trend strength.",
                    "Provides early market context before NSE opens."
                ]
            }}
            onSave={(val) => {
                const n = parseFloat(val);
                if (!isNaN(n)) {
                    // For manual testing, we simulate daily change as the input value itself
                    // In a real scenario, this would be computed from Current Price vs Prev Close
                    setDailyChange(n);
                    setCurrentValue(5000 + (5000 * n / 100)); // just a dummy calculation
                }
            }}
        />
    );
}
