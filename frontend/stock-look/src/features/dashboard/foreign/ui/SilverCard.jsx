import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function SilverCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const [previousValue, setPreviousValue] = useState(initialData?.previousValue || null);
    
    const configData = getIndicatorConfig('silver');
    
    let score = 0, bias = "Neutral", confidence = "88%", aiInsightText = "Waiting...";
    let details = [];
    
    if (currentValue !== null && previousValue !== null) {
        const change = currentValue - previousValue;
        const pctChange = (change / previousValue) * 100;
        
        details.push({ label: "Daily Change", value: `$${change.toFixed(2)}` });
        details.push({ label: "Change %", value: `${pctChange.toFixed(2)}%` });
        
        if (pctChange < -2) {
            score = 20;
            bias = "Strong Bearish";
            aiInsightText = "Sustained weakness in Silver suggests deteriorating global growth expectations.";
        } else if (pctChange < 0) {
            score = 40;
            bias = "Bearish";
            aiInsightText = "Weaker Silver prices may reflect slowing industrial activity or weaker economic expectations.";
        } else if (pctChange > 0) {
            score = 80;
            bias = "Bullish";
            aiInsightText = "Improving industrial demand is supporting Silver prices, indicating positive global economic sentiment.";
        } else {
            score = 60;
            bias = "Neutral";
            aiInsightText = "Industrial demand remains balanced with limited macroeconomic impact.";
        }
    }

    return (
        <IndicatorCard
            config={{ 
                title: "Silver", 
                category: "Commodities", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "USD/Ounce", value: currentValue ?? "--" }, 
                details, 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Silver" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Measures industrial commodity demand.",
                    "Reflects global economic activity.",
                    "Complements Gold analysis.",
                    "Supports macroeconomic assessment.",
                    "Confirms commodity market trends."
                ] 
            }}
            onSave={(val) => { 
                const n = parseFloat(val); 
                if(!isNaN(n)) {
                    setPreviousValue(currentValue || n);
                    setCurrentValue(n); 
                }
            }}
        />
    );
}
