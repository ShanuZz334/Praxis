import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function MACDCard({ initialData = null }) {
    // We'll use the MACD histogram as the primary modifiable value for simple testing
    const [histogram, setHistogram] = useState(initialData?.currentValue || 1.5);

    const configData = getIndicatorConfig('macd');

    let score = 50;
    let bias = "Neutral";
    let aiInsightText = "";

    if (histogram > 0.5) {
        bias = "Bullish";
        score = 80;
        aiInsightText = "Positive momentum continuation. Increasing bullish momentum with buyers gaining control as the histogram expands.";
    } else if (histogram > 0) {
        bias = "Bullish";
        score = 65;
        aiInsightText = "Bullish crossover detected. Positive momentum is building but remains relatively early.";
    } else if (histogram < -0.5) {
        bias = "Bearish";
        score = 20;
        aiInsightText = "Weakening momentum and increasing selling pressure. The bearish trend appears well-established.";
    } else if (histogram < 0) {
        bias = "Bearish";
        score = 35;
        aiInsightText = "Bearish crossover detected. Momentum is shifting downward with potential for further weakness.";
    } else {
        bias = "Neutral";
        score = 50;
        aiInsightText = "Lack of directional conviction. The MACD and Signal lines are nearly identical.";
    }

    const confidence = "75%"; // Base confidence

    return (
        <IndicatorCard
            config={{
                title: "MACD (12, 26, 9)",
                category: "Trend & Momentum",
                mode: "MANUAL",
                creditScore: configData.creditScore,
                updateTime: "--:--",
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "Histogram", value: histogram },
                details: [
                    { label: "Signal Status", value: bias }
                ],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "MACD Hist" }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    "Combines trend and momentum in one indicator.",
                    "Detects momentum shifts before price reversals.",
                    "Histogram visualizes acceleration or deceleration.",
                    "Zero-line identifies long-term trend direction.",
                    "One of the most trusted confirmation indicators in technical analysis."
                ]
            }}
            onSave={(val) => {
                const n = parseFloat(val);
                if (!isNaN(n)) setHistogram(n);
            }}
        />
    );
}
