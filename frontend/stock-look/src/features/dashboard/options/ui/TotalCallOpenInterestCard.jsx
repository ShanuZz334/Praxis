import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function TotalCallOpenInterestCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || 1250000);
    const [highestOIStrike, setHighestOIStrike] = useState(initialData?.highestOIStrike || 22500);
    const [oiChange, setOiChange] = useState(initialData?.oiChange || 45000);

    const configData = getIndicatorConfig('total_call_oi');
    
    let score = 0, bias = "Neutral", confidence = "85%";
    
    // Logic mapping based on Total Call OI Spec
    if (currentValue < 500000) {
        bias = "Bullish";
        score = 85;
    } else if (currentValue >= 500000 && currentValue <= 1500000) {
        bias = "Neutral";
        score = 65;
    } else if (currentValue > 1500000 && currentValue <= 3000000) {
        bias = "Bearish";
        score = 45;
    } else {
        bias = "Strong Bearish";
        score = 20;
    }

    let aiInsightText = "";
    if (bias === "Strong Bearish") {
        aiInsightText = "Explain that option writers are building resistance near current price levels.";
    } else if (bias === "Bearish" && oiChange > 100000) {
        aiInsightText = "Explain that fresh Call writing indicates increasing resistance expectations.";
    } else if (bias === "Neutral") {
        aiInsightText = "Explain that resistance remains relatively unchanged.";
    } else {
        aiInsightText = "Explain that resistance is weakening as Call writers unwind positions.";
    }

    const whyItMatters = [
        "Identifies potential resistance zones.",
        "Tracks institutional option writing.",
        "Measures market positioning.",
        "Confirms trend strength.",
        "Supports options-based market analysis."
    ];

    const details = [
        { label: "Highest OI Strike", value: highestOIStrike.toLocaleString() },
        { label: "Change", value: oiChange > 0 ? `+${oiChange.toLocaleString()}` : oiChange.toLocaleString(), color: oiChange > 0 ? "text-green-500" : "text-red-500" }
    ];

    return (
        <IndicatorCard
            config={{ 
                title: "Total Call Open Interest", 
                category: "Open Interest", 
                mode: "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Total Call OI", value: currentValue.toLocaleString() }, 
                details, 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ 
                points: initialData?.history || [{date:"2026-07-01",value:1200000}, {date:"2026-07-02",value:1250000}], 
                valueKey: "value", 
                valueName: "Call OI" 
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
