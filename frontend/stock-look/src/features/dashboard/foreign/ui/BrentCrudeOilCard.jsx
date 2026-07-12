import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function BrentCrudeOilCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const [previousValue, setPreviousValue] = useState(initialData?.previousValue || null);
    
    const configData = getIndicatorConfig('brent_crude_oil');
    
    let score = 0, bias = "Neutral", confidence = "92%", aiInsightText = "Waiting...";
    let details = [];
    
    if (currentValue !== null && previousValue !== null) {
        const change = currentValue - previousValue;
        const pctChange = (change / previousValue) * 100;
        
        details.push({ label: "Daily Change", value: `$${change.toFixed(2)}` });
        details.push({ label: "Change %", value: `${pctChange.toFixed(2)}%` });
        
        if (pctChange > 2) {
            score = 20;
            bias = "Strong Bearish";
            aiInsightText = "Sustained crude price increases could negatively affect Indian market sentiment.";
        } else if (pctChange > 0) {
            score = 40;
            bias = "Bearish";
            aiInsightText = "Increasing oil prices may pressure inflation, the rupee, and corporate margins.";
        } else if (pctChange < 0) {
            score = 80;
            bias = "Bullish";
            aiInsightText = "Lower oil prices reduce inflationary pressure and improve India's import outlook.";
        } else {
            score = 60;
            bias = "Neutral";
            aiInsightText = "Oil prices remain stable with limited macroeconomic impact.";
        }
    }

    return (
        <IndicatorCard
            config={{ 
                title: "Brent Crude Oil", 
                category: "Commodities", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "USD/Barrel", value: currentValue ?? "--" }, 
                details, 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Brent Crude" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Directly impacts India's import bill.",
                    "Influences inflation and fuel prices.",
                    "Affects corporate profitability.",
                    "Impacts INR movement.",
                    "Strong macroeconomic indicator."
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
