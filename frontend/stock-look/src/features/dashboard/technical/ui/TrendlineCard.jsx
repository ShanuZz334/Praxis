import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function TrendlineCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    
    const configData = getIndicatorConfig('trendline');
    
    let score = 0, bias = "Neutral", confidence = "75%", aiInsightText = "Waiting...";
    
    if (currentValue !== null) {
        score = currentValue;
        
        if (score <= 30) {
            bias = "Bearish";
            aiInsightText = "Market structure is changing.";
        } else if (score <= 50) {
            bias = "Weak Trend";
            aiInsightText = "Breakout lacked confirmation.";
        } else if (score <= 70) {
            bias = "Neutral";
            aiInsightText = "Trendline reliability has increased.";
        } else if (score <= 85) {
            bias = "Bullish";
            aiInsightText = "Buyers/sellers continue respecting the current trend.";
        } else {
            bias = "Strong Bullish";
            aiInsightText = "Trend remains healthy.";
        }
    }

    const whyItMatters = [
        "Defines market structure.",
        "Identifies dynamic support and resistance.",
        "Detects trend continuation.",
        "Detects structural reversals.",
        "Used by almost every professional technical analyst."
    ];

    return (
        <IndicatorCard
            config={{ 
                title: "Trendline", 
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
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Trendline Score" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
