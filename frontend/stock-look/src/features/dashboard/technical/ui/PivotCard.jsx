import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function PivotCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    
    const configData = getIndicatorConfig('pivot');
    
    let score = 0, bias = "Neutral", confidence = "75%", aiInsightText = "Waiting...";
    
    if (currentValue !== null) {
        score = currentValue;
        
        if (score <= 30) {
            bias = "Bearish Momentum";
            aiInsightText = "Sellers have gained control.";
        } else if (score <= 50) {
            bias = "Bearish";
            aiInsightText = "Price is below pivot.";
        } else if (score <= 70) {
            bias = "Neutral";
            aiInsightText = "The market is balanced with no clear advantage.";
        } else if (score <= 85) {
            bias = "Bullish";
            aiInsightText = "Buyers currently control the trading session.";
        } else {
            bias = "Bullish Momentum";
            aiInsightText = "Bullish momentum is strengthening.";
        }
    }

    const whyItMatters = [
        "Defines the day's key trading levels.",
        "Identifies likely support and resistance.",
        "Helps estimate profit targets.",
        "Widely used by intraday traders.",
        "Excellent for breakout confirmation."
    ];

    return (
        <IndicatorCard
            config={{ 
                title: "Pivot Points", 
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
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Pivot Score" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
