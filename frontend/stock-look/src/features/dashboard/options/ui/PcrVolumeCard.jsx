import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function PcrVolumeCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || 0.90);
    const [trend, setTrend] = useState(initialData?.trend || "Stable");

    const configData = getIndicatorConfig('pcr_volume');

    // Calculate Bias and Score
    let score = 50;
    let bias = "Neutral";
    let confidence = "85%";
    let sentiment = "Neutral";

    if (currentValue > 1.10) {
        bias = "Bullish";
        score = 85;
        sentiment = "Bullish";
    } else if (currentValue >= 0.80 && currentValue <= 1.10) {
        bias = "Neutral";
        score = 60;
        sentiment = "Neutral";
    } else if (currentValue >= 0.60 && currentValue < 0.80) {
        bias = "Bearish";
        score = 40;
        sentiment = "Bearish";
    } else {
        bias = "Strong Bearish";
        score = 20;
        sentiment = "Strong Bearish";
    }

    // AI Insight
    let aiInsightText = "";
    if (currentValue > 1.10) {
        aiInsightText = "Explain that Put trading activity is stronger than Call activity, indicating improving bullish sentiment.";
    } else if (currentValue >= 0.80) {
        aiInsightText = "Explain that trading activity remains balanced between Calls and Puts.";
    } else {
        aiInsightText = "Explain that Call trading activity dominates, indicating bearish market sentiment.";
    }

    const whyItMatters = [
        "Measures real-time options sentiment.",
        "Tracks short-term trader positioning.",
        "Confirms momentum shifts.",
        "Complements PCR (OI).",
        "Improves intraday options analysis."
    ];

    const handleSave = (val) => {
        const n = parseFloat(val);
        if (!isNaN(n)) setCurrentValue(n);
    };

    return (
        <IndicatorCard
            config={{ 
                title: "Put-Call Ratio (Volume)", 
                category: "Put-Call Ratio", 
                mode: "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "PCR (Volume)", value: currentValue.toFixed(2) }, 
                details: [
                    { label: "Trend", value: trend },
                    { label: "Sentiment", value: sentiment }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "PCR (Volume)" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={handleSave}
        />
    );
}
