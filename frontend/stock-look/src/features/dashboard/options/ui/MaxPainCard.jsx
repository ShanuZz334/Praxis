import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function MaxPainCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || 21500); // Max Pain Strike
    const [spot, setSpot] = useState(initialData?.spot || 21650);

    const configData = getIndicatorConfig('max_pain');

    const distancePct = (((spot - currentValue) / currentValue) * 100).toFixed(2);
    const absDist = Math.abs(parseFloat(distancePct));

    // Calculate Bias and Score
    let score = 50;
    let bias = "Neutral";
    let confidence = "88%";

    if (absDist < 0.5) {
        bias = "Neutral";
        score = 50;
    } else if (absDist < 1.5) {
        bias = "Moderately Bullish/Bearish"; // In real usage, depends on direction of movement
        score = 65;
    } else {
        bias = "Trend Strengthening";
        score = 85;
    }

    // AI Insight
    let aiInsightText = "";
    if (absDist < 0.5) {
        aiInsightText = "Explain that price is trading close to the Max Pain level, indicating balanced options positioning.";
    } else if (absDist < 1.5) {
        aiInsightText = "Explain that expiry-related positioning may attract price toward the Max Pain strike.";
    } else {
        aiInsightText = "Explain that directional momentum is currently stronger than expiry positioning.";
    }

    const whyItMatters = [
        "Identifies important expiry levels.",
        "Tracks institutional options positioning.",
        "Improves expiry-week analysis.",
        "Complements Open Interest analysis.",
        "Supports short-term market assessment."
    ];

    const handleSave = (val) => {
        const n = parseFloat(val);
        if (!isNaN(n)) setCurrentValue(n);
    };

    return (
        <IndicatorCard
            config={{ 
                title: "Max Pain", 
                category: "Market Positioning", 
                mode: "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Max Pain Strike", value: currentValue }, 
                details: [
                    { label: "Current Spot", value: spot },
                    { label: "Distance", value: `${distancePct}%` }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Max Pain" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={handleSave}
        />
    );
}
