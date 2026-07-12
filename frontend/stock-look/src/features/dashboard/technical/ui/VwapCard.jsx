import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function VwapCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue ?? null);
    const [pricePosition, setPricePosition] = useState(initialData?.pricePosition ?? "Above");
    const [distance, setDistance] = useState(initialData?.distance ?? "+1.5%");
    const [sessionTrend, setSessionTrend] = useState(initialData?.sessionTrend ?? "Bullish");
    
    const configData = getIndicatorConfig('vwap');

    let score = 50, bias = "Neutral", confidence = "80%", aiInsightText = "Waiting for data...";

    if (currentValue !== null) {
        if (pricePosition === "Repeated Bounce") {
            score = 90;
            bias = "Strong Bullish";
            aiInsightText = "Institutional buying is supporting the trend.";
        } else if (pricePosition === "Repeated Rejection") {
            score = 10;
            bias = "Strong Bearish";
            aiInsightText = "Institutional selling pressure remains active.";
        } else if (pricePosition === "Above") {
            score = 75;
            bias = "Bullish";
            aiInsightText = "Buyers are controlling today's trading session.";
        } else if (pricePosition === "Below") {
            score = 25;
            bias = "Bearish";
            aiInsightText = "Sellers remain in control.";
        } else {
            score = 50;
            bias = "Neutral";
            aiInsightText = "The market is trading close to today's fair value.";
        }
    }

    const whyItMatters = [
        "Identifies fair value for the current session.",
        "Tracks institutional buying and selling.",
        "Confirms intraday trend direction.",
        "Helps identify optimal entry and exit points.",
        "One of the most respected institutional indicators."
    ];

    return (
        <IndicatorCard
            config={{
                title: "VWAP",
                category: "Volume Analysis",
                mode: "MANUAL",
                creditScore: configData.creditScore,
                updateTime: "--:--",
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "Current VWAP", value: currentValue ?? "--" },
                details: [
                    { label: "Price Position", value: pricePosition },
                    { label: "Distance", value: distance },
                    { label: "Session Trend", value: sessionTrend }
                ],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{
                points: initialData?.history || [],
                valueKey: "value",
                valueName: "VWAP"
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters
            }}
            onSave={(val) => {
                const n = parseFloat(val);
                if (!isNaN(n)) setCurrentValue(n);
                // Toggle position for manual testing
                setPricePosition(prev => prev === "Above" ? "Below" : "Above");
                setSessionTrend(prev => prev === "Bullish" ? "Bearish" : "Bullish");
            }}
        />
    );
}
