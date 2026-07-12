import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function RSICard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || 50);

    const configData = getIndicatorConfig('rsi');

    let score = 50;
    let bias = "Neutral";
    let aiInsightText = "";

    if (currentValue >= 70) {
        bias = "Strong Bullish";
        score = 85 - (currentValue - 70); // reduced if >80 as per specs (mocking logic)
        aiInsightText = "Strong bullish momentum detected. However, the market may be entering an overbought zone where short-term pullbacks become more likely.";
    } else if (currentValue >= 55) {
        bias = "Bullish";
        score = 65;
        aiInsightText = "Healthy bullish momentum observed, with buyers maintaining control of the price action.";
    } else if (currentValue >= 45) {
        bias = "Neutral";
        score = 50;
        aiInsightText = "Momentum is balanced with no clear directional advantage for either buyers or sellers.";
    } else if (currentValue >= 30) {
        bias = "Bearish";
        score = 35;
        aiInsightText = "Momentum is weakening, indicating increasing selling pressure in the market.";
    } else {
        bias = "Strong Bearish";
        score = 15;
        aiInsightText = "Oversold conditions present. There is a possibility of a relief rally, but confirmation from other indicators is strongly recommended.";
    }

    const confidence = "70%"; // Base confidence

    return (
        <IndicatorCard
            config={{
                title: "RSI (14)",
                category: "Momentum",
                mode: "MANUAL",
                creditScore: configData.creditScore,
                updateTime: "--:--",
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "Current RSI", value: currentValue },
                details: [
                    { label: "Trend Bias", value: bias }
                ],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "RSI" }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    "Measures market momentum rather than trend direction.",
                    "Helps identify overbought and oversold conditions.",
                    "Useful for spotting potential reversals and momentum shifts.",
                    "Most reliable when combined with trend-following indicators.",
                    "Widely used by institutional and retail traders, making it a commonly watched market signal."
                ]
            }}
            onSave={(val) => {
                const n = parseFloat(val);
                if (!isNaN(n)) setCurrentValue(n);
            }}
        />
    );
}
