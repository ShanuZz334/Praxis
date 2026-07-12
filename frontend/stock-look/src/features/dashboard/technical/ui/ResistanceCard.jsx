import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function ResistanceCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    
    const configData = getIndicatorConfig('resistance');
    
    let score = 0, bias = "Neutral", confidence = "75%", aiInsightText = "Waiting...";
    
    if (currentValue !== null) {
        score = currentValue;
        
        if (score <= 30) {
            bias = "Strong Bearish";
            aiInsightText = "Resistance is becoming increasingly significant.";
        } else if (score <= 50) {
            bias = "Bearish";
            aiInsightText = "Sellers continue defending this area.";
        } else if (score <= 70) {
            bias = "Neutral";
            aiInsightText = "The market is approaching an important supply zone.";
        } else if (score <= 85) {
            bias = "Bullish";
            aiInsightText = "The breakout lacked conviction and sellers regained control.";
        } else {
            bias = "Strong Bullish";
            aiInsightText = "Buyers have absorbed selling pressure and momentum has shifted upward.";
        }
    }

    const whyItMatters = [
        "Identifies major selling zones.",
        "Helps define profit targets.",
        "Confirms breakout quality.",
        "Supports risk management.",
        "Essential for market structure analysis."
    ];

    return (
        <IndicatorCard
            config={{ 
                title: "Resistance Level", 
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
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Resistance Score" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
