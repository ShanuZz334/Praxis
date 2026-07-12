import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function GoldCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const [previousValue, setPreviousValue] = useState(initialData?.previousValue || null);
    
    const configData = getIndicatorConfig('gold');
    
    let score = 0, bias = "Neutral", confidence = "90%", aiInsightText = "Waiting...";
    let details = [];
    
    if (currentValue !== null && previousValue !== null) {
        const change = currentValue - previousValue;
        const pctChange = (change / previousValue) * 100;
        
        details.push({ label: "Daily Change", value: `$${change.toFixed(2)}` });
        details.push({ label: "Change %", value: `${pctChange.toFixed(2)}%` });
        
        if (pctChange > 1.5) {
            score = 20;
            bias = "Strong Bearish";
            aiInsightText = "Strong buying in Gold suggests elevated geopolitical or economic concerns.";
        } else if (pctChange > 0) {
            score = 40;
            bias = "Bearish";
            aiInsightText = "Increasing safe-haven demand reflects growing market uncertainty.";
        } else if (pctChange < 0) {
            score = 80;
            bias = "Bullish";
            aiInsightText = "Investors are moving away from safe-haven assets, indicating stronger global risk appetite.";
        } else {
            score = 60;
            bias = "Neutral";
            aiInsightText = "Safe-haven demand remains balanced with limited impact on market sentiment.";
        }
    }

    return (
        <IndicatorCard
            config={{ 
                title: "Gold", 
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
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Gold" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Measures global risk sentiment.",
                    "Tracks safe-haven demand.",
                    "Reflects inflation expectations.",
                    "Complements VIX and DXY analysis.",
                    "Provides macroeconomic context."
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
