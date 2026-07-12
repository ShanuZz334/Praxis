import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function WilliamsRCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || -50);

    const configData = getIndicatorConfig('williams_r');

    let score = 50;
    let bias = "Neutral";
    let aiInsightText = "";

    if (currentValue >= -20) {
        bias = "Strong Bullish";
        score = 85;
        aiInsightText = "Strong bullish momentum detected. However, be cautious of overbought conditions. Always confirm with trend indicators.";
    } else if (currentValue >= -45) {
        bias = "Bullish";
        score = 65;
        aiInsightText = "Healthy bullish momentum observed, confirming short-term buyer strength. Ensure trend indicators support this direction.";
    } else if (currentValue >= -55) {
        bias = "Neutral";
        score = 50;
        aiInsightText = "Balanced momentum with no clear advantage for buyers or sellers at the moment.";
    } else if (currentValue >= -80) {
        bias = "Bearish";
        score = 35;
        aiInsightText = "Bearish momentum is active, suggesting increasing weakness in the current price action.";
    } else {
        bias = "Strong Bearish";
        score = 15;
        aiInsightText = "Strong selling pressure detected, though the market may be entering oversold territory. Look for potential exhaustion signals.";
    }

    const confidence = "65%"; // Base confidence

    return (
        <IndicatorCard
            config={{
                title: "Williams %R (14)",
                category: "Momentum",
                mode: "MANUAL",
                creditScore: configData.creditScore,
                updateTime: "--:--",
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "Williams %R", value: currentValue },
                details: [
                    { label: "Momentum Bias", value: bias }
                ],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Williams %R" }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    "Measures momentum using price position within a recent range.",
                    "Detects potential overbought and oversold conditions quickly.",
                    "Useful for timing entries during established trends.",
                    "More responsive than many traditional oscillators.",
                    "Best used alongside trend confirmation indicators."
                ]
            }}
            onSave={(val) => {
                const n = parseFloat(val);
                if (!isNaN(n)) setCurrentValue(n);
            }}
        />
    );
}
