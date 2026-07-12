import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function DowFuturesCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const [dailyChange, setDailyChange] = useState(initialData?.dailyChange || null);

    const configData = getIndicatorConfig('dow_futures');

    let score = 0, bias = "Neutral", confidence = "90%", aiInsightText = "Waiting for data...";
    
    if (dailyChange !== null) {
        if (dailyChange >= 0.50) {
            bias = "Bullish";
            score = 85;
            aiInsightText = "Blue-chip U.S. stocks indicate strong institutional confidence, supporting a positive global market outlook.";
        } else if (dailyChange > 0.10 && dailyChange < 0.50) {
            bias = "Neutral";
            score = 60;
            aiInsightText = "Large-cap stocks continue to support overall market sentiment.";
        } else if (dailyChange >= -0.10 && dailyChange <= 0.10) {
            bias = "Neutral";
            score = 50;
            aiInsightText = "Institutional sentiment remains balanced.";
        } else if (dailyChange < -0.10 && dailyChange > -0.50) {
            bias = "Neutral";
            score = 40;
            aiInsightText = "Weakness in blue-chip stocks may weigh on broader global markets.";
        } else if (dailyChange <= -0.50 && dailyChange > -1.25) {
            bias = "Bearish";
            score = 25;
            aiInsightText = "Weakness in blue-chip stocks may weigh on broader global markets.";
        } else if (dailyChange <= -1.25) {
            bias = "Strong Bearish";
            score = 10;
            aiInsightText = "Strong selling in Dow Futures indicates a broader shift toward risk-off sentiment.";
        }
    }

    return (
        <IndicatorCard
            config={{
                title: "Dow Jones Futures",
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
                valueName: "Dow Futures"
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    "Measures institutional confidence in blue-chip companies.",
                    "Reflects global risk appetite.",
                    "Confirms overnight market direction.",
                    "Complements S&P 500 and Nasdaq Futures.",
                    "Improves global sentiment analysis."
                ]
            }}
            onSave={(val) => {
                const n = parseFloat(val);
                if (!isNaN(n)) {
                    setDailyChange(n);
                    setCurrentValue(38000 + (38000 * n / 100)); // dummy calculation
                }
            }}
        />
    );
}
