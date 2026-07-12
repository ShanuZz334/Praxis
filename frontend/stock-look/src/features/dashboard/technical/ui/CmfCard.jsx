import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function CmfCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue ?? null);
    const configData = getIndicatorConfig('cmf');

    let score = 50, bias = "Neutral", confidence = "75%", aiInsightText = "Waiting for data...";
    let moneyFlow = "Neutral";
    
    if (currentValue !== null) {
        if (currentValue > 0.20) {
            score = 90;
            bias = "Strong Accumulation";
            moneyFlow = "Accumulation";
            aiInsightText = "Strong institutional accumulation supporting the trend.";
        } else if (currentValue > 0) {
            score = 70;
            bias = "Bullish";
            moneyFlow = "Accumulation";
            aiInsightText = "Buying pressure is stronger than selling pressure.";
        } else if (currentValue < -0.20) {
            score = 10;
            bias = "Strong Distribution";
            moneyFlow = "Distribution";
            aiInsightText = "Heavy distribution and weakening market participation.";
        } else if (currentValue < 0) {
            score = 30;
            bias = "Bearish";
            moneyFlow = "Distribution";
            aiInsightText = "Increasing selling pressure.";
        } else {
            score = 50;
            bias = "Neutral";
            moneyFlow = "Neutral";
            aiInsightText = "Neutral money flow.";
        }
    }

    const whyItMatters = [
        "Measures real buying and selling pressure.",
        "Identifies accumulation and distribution.",
        "Confirms breakout quality.",
        "Detects volume-price divergence.",
        "Complements OBV by incorporating candle position."
    ];

    return (
        <IndicatorCard
            config={{
                title: "Chaikin Money Flow",
                category: "Volume Analysis",
                mode: "MANUAL",
                creditScore: configData.creditScore,
                updateTime: "--:--",
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "Current CMF", value: currentValue ?? "--" },
                details: [
                    { label: "Money Flow", value: moneyFlow }
                ],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{
                points: initialData?.history || [],
                valueKey: "value",
                valueName: "CMF"
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters
            }}
            onSave={(val) => {
                const n = parseFloat(val);
                if (!isNaN(n)) setCurrentValue(n);
            }}
        />
    );
}
