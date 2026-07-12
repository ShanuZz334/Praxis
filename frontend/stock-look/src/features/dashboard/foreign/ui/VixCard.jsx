import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function VixCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const [previousValue, setPreviousValue] = useState(initialData?.previousValue || null);
    
    const configData = getIndicatorConfig('vix');
    
    let score = 0, bias = "Neutral", confidence = "95%", aiInsightText = "Waiting...";
    let details = [];
    
    if (currentValue !== null) {
        if (previousValue !== null) {
            const change = currentValue - previousValue;
            const pctChange = (change / previousValue) * 100;
            details.push({ label: "Daily Change", value: `${change.toFixed(2)} pts` });
            details.push({ label: "Change %", value: `${pctChange.toFixed(2)}%` });
        }
        
        if (currentValue > 40) {
            score = 10;
            bias = "Strong Bearish";
            aiInsightText = "Elevated fear is driving market volatility and risk management becomes increasingly important.";
        } else if (currentValue > 30) {
            score = 30;
            bias = "Bearish";
            aiInsightText = "Elevated fear is driving market volatility and risk management becomes increasingly important.";
        } else if (currentValue > 20) {
            score = 50;
            bias = "Neutral";
            aiInsightText = "Uncertainty is increasing and traders should expect larger market swings.";
        } else if (currentValue > 15) {
            score = 70;
            bias = "Bullish";
            aiInsightText = "Volatility remains within normal levels and market conditions are stable.";
        } else {
            score = 90;
            bias = "Bullish";
            aiInsightText = "Market volatility expectations remain low, indicating strong investor confidence.";
        }
    }

    return (
        <IndicatorCard
            config={{ 
                title: "CBOE Volatility Index (VIX)", 
                category: "Volatility", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Index Value", value: currentValue ?? "--" }, 
                details, 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "VIX" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Measures global market fear.",
                    "Reflects expected volatility.",
                    "Confirms overall market sentiment.",
                    "Helps assess trading risk.",
                    "One of the world's most widely followed risk indicators."
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
