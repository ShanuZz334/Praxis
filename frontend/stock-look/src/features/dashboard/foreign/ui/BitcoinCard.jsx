import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function BitcoinCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const [previousValue, setPreviousValue] = useState(initialData?.previousValue || null);
    
    const configData = getIndicatorConfig('bitcoin');
    
    let score = 0, bias = "Neutral", confidence = "85%", aiInsightText = "Waiting...";
    let details = [];
    
    if (currentValue !== null && previousValue !== null) {
        const change = currentValue - previousValue;
        const pctChange = (change / previousValue) * 100;
        
        details.push({ label: "Daily Change", value: `$${change.toFixed(2)}` });
        details.push({ label: "Change %", value: `${pctChange.toFixed(2)}%` });
        
        if (pctChange < -5) {
            score = 20;
            bias = "Strong Bearish";
            aiInsightText = "Strong selling in Bitcoin reflects heightened risk aversion across speculative assets.";
        } else if (pctChange < 0) {
            score = 40;
            bias = "Bearish";
            aiInsightText = "Weakening Bitcoin prices indicate declining speculative risk appetite.";
        } else if (pctChange > 0) {
            score = 80;
            bias = "Bullish";
            aiInsightText = "Investors are showing increased appetite for higher-risk assets, supporting broader market sentiment.";
        } else {
            score = 60;
            bias = "Neutral";
            aiInsightText = "Cryptocurrency markets remain relatively balanced with limited impact on global risk sentiment.";
        }
    }

    return (
        <IndicatorCard
            config={{ 
                title: "Bitcoin (BTC/USD)", 
                category: "Digital Assets", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "USD", value: currentValue ?? "--" }, 
                details, 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "BTC" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Measures speculative risk appetite.",
                    "Provides additional global sentiment context.",
                    "Complements equity futures.",
                    "Supports macro risk analysis.",
                    "Helps identify shifts in investor behavior."
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
