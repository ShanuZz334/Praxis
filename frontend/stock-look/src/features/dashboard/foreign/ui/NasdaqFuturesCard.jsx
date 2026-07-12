import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function NasdaqFuturesCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const [dailyChange, setDailyChange] = useState(initialData?.dailyChange || null);

    const configData = getIndicatorConfig('nasdaq_futures');

    let score = 0, bias = "Neutral", confidence = "90%", aiInsightText = "Waiting for data...";
    
    if (dailyChange !== null) {
        if (dailyChange >= 0.75) {
            bias = "Bullish";
            score = 85;
            aiInsightText = "Technology stocks are leading global risk appetite, supporting positive sentiment for growth sectors.";
        } else if (dailyChange > 0.15 && dailyChange < 0.75) {
            bias = "Neutral";
            score = 60;
            aiInsightText = "Technology markets remain supportive with moderate buying interest.";
        } else if (dailyChange >= -0.15 && dailyChange <= 0.15) {
            bias = "Neutral";
            score = 50;
            aiInsightText = "Technology sentiment remains balanced.";
        } else if (dailyChange < -0.15 && dailyChange > -0.75) {
            bias = "Neutral";
            score = 40;
            aiInsightText = "Weakness in technology futures may pressure IT and growth-oriented sectors.";
        } else if (dailyChange <= -0.75 && dailyChange > -2.00) {
            bias = "Bearish";
            score = 25;
            aiInsightText = "Weakness in technology futures may pressure IT and growth-oriented sectors.";
        } else if (dailyChange <= -2.00) {
            bias = "Strong Bearish";
            score = 10;
            aiInsightText = "Strong selling in Nasdaq Futures reflects a broader risk-off environment.";
        }
    }

    return (
        <IndicatorCard
            config={{
                title: "Nasdaq Futures",
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
                valueName: "Nasdaq Futures"
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    "Measures global technology sector sentiment.",
                    "Influences Indian IT stocks.",
                    "Reflects investor appetite for growth assets.",
                    "Confirms overnight market momentum.",
                    "Strengthens global sentiment analysis."
                ]
            }}
            onSave={(val) => {
                const n = parseFloat(val);
                if (!isNaN(n)) {
                    setDailyChange(n);
                    setCurrentValue(15000 + (15000 * n / 100)); // dummy calculation
                }
            }}
        />
    );
}
