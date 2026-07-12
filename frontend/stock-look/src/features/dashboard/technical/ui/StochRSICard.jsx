import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function StochRSICard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || 50);

    const configData = getIndicatorConfig('stoch_rsi');

    let score = 50;
    let bias = "Neutral";
    let aiInsightText = "";

    if (currentValue >= 80) {
        bias = "Bullish"; // or Overbought
        score = 80;
        aiInsightText = "Strong bullish momentum detected. However, be warned about possible exhaustion as the indicator is in the overbought zone.";
    } else if (currentValue >= 60) {
        bias = "Bullish";
        score = 70;
        aiInsightText = "Positive momentum is established, with buyers showing strength.";
    } else if (currentValue >= 40) {
        bias = "Neutral";
        score = 50;
        aiInsightText = "Momentum is unstable and range-bound. Repeated crossovers suggest a lack of clear trend direction.";
    } else if (currentValue >= 20) {
        bias = "Bearish";
        score = 30;
        aiInsightText = "Negative momentum is established, with sellers controlling the short-term action.";
    } else {
        bias = "Bullish"; // Relief rally expectations
        score = 20;
        aiInsightText = "Oversold condition detected. Increasing bullish momentum is possible from this level, though confirmation is required.";
    }

    const confidence = "65%"; // Base confidence

    return (
        <IndicatorCard
            config={{
                title: "Stochastic RSI (14,14,3,3)",
                category: "Momentum",
                mode: "MANUAL",
                creditScore: configData.creditScore,
                updateTime: "--:--",
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "%K Value", value: currentValue },
                details: [
                    { label: "Momentum", value: bias }
                ],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Stoch RSI" }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    "Detects momentum changes earlier than RSI.",
                    "Identifies potential reversals quickly.",
                    "Useful in ranging markets.",
                    "Helps refine entry and exit timing.",
                    "Works best as a confirmation indicator rather than a standalone signal."
                ]
            }}
            onSave={(val) => {
                const n = parseFloat(val);
                if (!isNaN(n)) setCurrentValue(n);
            }}
        />
    );
}
