import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function TotalPutOpenInterestCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || 1350000);
    const [highestOIStrike, setHighestOIStrike] = useState(initialData?.highestOIStrike || 22000);
    const [oiChange, setOiChange] = useState(initialData?.oiChange || 65000);

    const configData = getIndicatorConfig('total_put_oi');
    
    let score = 0, bias = "Neutral", confidence = "85%";
    
    // Logic mapping based on Total Put OI Spec
    if (currentValue < 500000) {
        bias = "Strong Bearish";
        score = 20;
    } else if (currentValue >= 500000 && currentValue <= 1000000) {
        bias = "Bearish";
        score = 45;
    } else if (currentValue > 1000000 && currentValue <= 2000000) {
        bias = "Neutral";
        score = 65;
    } else {
        bias = "Bullish";
        score = 85;
    }

    let aiInsightText = "";
    if (bias === "Bullish") {
        aiInsightText = "Explain that option writers are building strong support below current price levels.";
    } else if (bias === "Neutral" && oiChange > 0) {
        aiInsightText = "Explain that buyers continue defending lower price levels.";
    } else if (bias === "Neutral") {
        aiInsightText = "Explain that market support remains relatively unchanged.";
    } else {
        aiInsightText = "Explain that support is weakening as Put writers close their positions.";
    }

    const whyItMatters = [
        "Identifies potential support zones.",
        "Tracks institutional Put writing.",
        "Measures bullish market positioning.",
        "Confirms trend continuation.",
        "Improves options market analysis."
    ];

    const details = [
        { label: "Highest OI Strike", value: highestOIStrike.toLocaleString() },
        { label: "Change", value: oiChange > 0 ? `+${oiChange.toLocaleString()}` : oiChange.toLocaleString(), color: oiChange > 0 ? "text-green-500" : "text-red-500" }
    ];

    return (
        <IndicatorCard
            config={{ 
                title: "Total Put Open Interest", 
                category: "Open Interest", 
                mode: "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Total Put OI", value: currentValue.toLocaleString() }, 
                details, 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ 
                points: initialData?.history || [{date:"2026-07-01",value:1300000}, {date:"2026-07-02",value:1350000}], 
                valueKey: "value", 
                valueName: "Put OI" 
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
