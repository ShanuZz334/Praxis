import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function SupportCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    
    const configData = getIndicatorConfig('support');
    
    let score = 0, bias = "Neutral", confidence = "75%", aiInsightText = "Waiting...";
    
    if (currentValue !== null) {
        score = currentValue;
        
        if (score <= 30) {
            bias = "Bearish";
            aiInsightText = "Sellers gained control after breaking a key demand zone.";
        } else if (score <= 50) {
            bias = "Weak Support";
            aiInsightText = "Repeated testing weakens support.";
        } else if (score <= 70) {
            bias = "Neutral";
            aiInsightText = "This is an important decision zone.";
        } else if (score <= 85) {
            bias = "Bullish";
            aiInsightText = "Buyers continue defending this level.";
        } else {
            bias = "Strong Bullish";
            aiInsightText = "Buyers successfully defended support.";
        }
    }

    const whyItMatters = [
        "Identifies high-probability buying zones.",
        "Used for stop-loss placement.",
        "Helps estimate downside risk.",
        "Confirms market structure.",
        "Widely used by institutional traders."
    ];

    return (
        <IndicatorCard
            config={{ 
                title: "Support Level", 
                category: "Market Structure", 
                mode: "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Score", value: currentValue ?? "--" }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Support Score" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
