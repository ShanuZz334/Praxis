import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function VolumeSmaCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue ?? null);
    const [averageVolume] = useState(initialData?.averageVolume ?? 1000000); // Placeholder for manual testing
    
    const configData = getIndicatorConfig('volume_sma');

    let score = 50, bias = "Normal", confidence = "70%", aiInsightText = "Waiting for data...";
    let volumeRatio = "--";

    if (currentValue !== null) {
        const ratio = currentValue / averageVolume;
        volumeRatio = ratio.toFixed(2) + "x";
        
        if (ratio > 2.0) {
            score = 90;
            bias = "Exceptional Activity";
            aiInsightText = "Strong institutional interest and increased conviction.";
        } else if (ratio > 1.5) {
            score = 80;
            bias = "High Participation";
            aiInsightText = "Market participation well supports the current move.";
        } else if (ratio > 1.0) {
            score = 65;
            bias = "High Participation";
            aiInsightText = "Market participation supports the current move.";
        } else if (ratio > 0.8) {
            score = 50;
            bias = "Normal";
            aiInsightText = "Normal market participation.";
        } else {
            score = 20;
            bias = "Low Participation";
            aiInsightText = "The move lacks strong participation.";
        }
    }

    const whyItMatters = [
        "Confirms breakout quality.",
        "Measures trader participation.",
        "Filters weak price movements.",
        "Helps identify institutional activity.",
        "Improves confidence in trend analysis."
    ];

    return (
        <IndicatorCard
            config={{
                title: "Volume SMA (20)",
                category: "Volume Analysis",
                mode: "MANUAL",
                creditScore: configData.creditScore,
                updateTime: "--:--",
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "Current Volume", value: currentValue ?? "--" },
                details: [
                    { label: "Avg Volume", value: averageVolume },
                    { label: "Volume Ratio", value: volumeRatio }
                ],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{
                points: initialData?.history || [],
                valueKey: "value",
                valueName: "Volume Ratio"
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
