import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function ObvCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue ?? null);
    const [obvTrend, setObvTrend] = useState(initialData?.obvTrend ?? "Rising");
    const [priceDivergence, setPriceDivergence] = useState(initialData?.priceDivergence ?? "None");
    
    const configData = getIndicatorConfig('obv');

    let score = 50, bias = "Neutral", confidence = "75%", aiInsightText = "Waiting for data...";

    if (currentValue !== null) {
        if (priceDivergence === "Bullish") {
            score = 90;
            bias = "Strong Bullish";
            aiInsightText = "Accumulation is occurring despite weak price action.";
        } else if (priceDivergence === "Bearish") {
            score = 10;
            bias = "Strong Bearish";
            aiInsightText = "The rally lacks volume confirmation and may weaken.";
        } else if (obvTrend === "Rising") {
            score = 75;
            bias = "Bullish";
            aiInsightText = "Buying volume supports the ongoing trend.";
        } else if (obvTrend === "Falling") {
            score = 25;
            bias = "Bearish";
            aiInsightText = "Selling pressure is increasing.";
        } else {
            score = 50;
            bias = "Neutral";
            aiInsightText = "Buyers and sellers are currently balanced.";
        }
    }

    const whyItMatters = [
        "Measures accumulation and distribution.",
        "Confirms price trends.",
        "Detects hidden institutional buying.",
        "Identifies early trend reversals.",
        "One of the most trusted volume indicators."
    ];

    return (
        <IndicatorCard
            config={{
                title: "On-Balance Volume (OBV)",
                category: "Volume Analysis",
                mode: "MANUAL",
                creditScore: configData.creditScore,
                updateTime: "--:--",
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "Current OBV", value: currentValue ?? "--" },
                details: [
                    { label: "OBV Trend", value: obvTrend },
                    { label: "Divergence", value: priceDivergence }
                ],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{
                points: initialData?.history || [],
                valueKey: "value",
                valueName: "OBV"
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters
            }}
            onSave={(val) => {
                const n = parseFloat(val);
                if (!isNaN(n)) setCurrentValue(n);
                // Simple toggle for manual testing
                setObvTrend(prev => prev === "Rising" ? "Falling" : "Rising");
            }}
        />
    );
}
