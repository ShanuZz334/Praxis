import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function OpenInterestChangeCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || 120000);
    const [percentChange, setPercentChange] = useState(initialData?.percentChange || 5.2);
    const [marketPosition, setMarketPosition] = useState(initialData?.marketPosition || "Long Build-up");

    const configData = getIndicatorConfig('oi_change');
    
    let score = 0, bias = "Neutral", confidence = "90%";
    
    // Logic mapping based on OI Change Spec
    if (marketPosition === "Long Build-up") {
        bias = "Bullish";
        score = 85;
    } else if (marketPosition === "Short Covering") {
        bias = "Bullish";
        score = 70;
    } else if (marketPosition === "Long Unwinding") {
        bias = "Bearish";
        score = 40;
    } else if (marketPosition === "Short Build-up") {
        bias = "Strong Bearish";
        score = 15;
    }

    let aiInsightText = "";
    if (marketPosition === "Long Build-up") {
        aiInsightText = "Explain that new long positions are being created, supporting continued upward momentum.";
    } else if (marketPosition === "Short Covering") {
        aiInsightText = "Explain that bearish positions are being closed, supporting near-term upside.";
    } else if (marketPosition === "Long Unwinding") {
        aiInsightText = "Explain that existing long positions are being exited, weakening bullish momentum.";
    } else {
        aiInsightText = "Explain that new bearish positions are entering the market, increasing downside pressure.";
    }

    const whyItMatters = [
        "Identifies institutional positioning.",
        "Distinguishes fresh positions from position unwinding.",
        "Confirms trend strength.",
        "Improves options sentiment analysis.",
        "Supports short-term market direction assessment."
    ];

    const details = [
        { label: "OI Change (%)", value: `${percentChange.toFixed(2)}%`, color: percentChange > 0 ? "text-green-500" : "text-red-500" },
        { label: "Position", value: marketPosition }
    ];

    return (
        <IndicatorCard
            config={{ 
                title: "Open Interest Change", 
                category: "Open Interest", 
                mode: "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Current OI Change", value: currentValue.toLocaleString() }, 
                details, 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ 
                points: initialData?.history || [{date:"2026-07-01",value:4.5}, {date:"2026-07-02",value:5.2}], 
                valueKey: "value", 
                valueName: "OI Chg %" 
            }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters 
            }}
            onSave={(val) => { 
                const n = parseFloat(val); 
                if(!isNaN(n)) setCurrentValue(n); 
            }}
        />
    );
}
