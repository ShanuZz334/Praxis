import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function UsdInrCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const configData = getIndicatorConfig('usd_inr');
    
    let score = 0, bias = "Neutral", confidence = "92%", aiInsightText = "Waiting...";
    let impactWeight = configData.impactWeight || "Very High";
    
    // Derived states (mocking logic from spec)
    let dailyChange = "₹0.00";
    let dailyChangePercent = "0.00%";
    
    if (currentValue !== null) {
        // Simplified mockup logic to deduce score and bias based on standard movement
        // Let's assume currentValue indicates some change for the mock
        if (currentValue < 83.0) {
            score = 90;
            bias = "Bullish";
            dailyChange = "-₹0.20";
            dailyChangePercent = "-0.24%";
            aiInsightText = "The Rupee is strengthening against the Dollar, supporting lower import costs and improving market sentiment.";
        } else if (currentValue > 83.5) {
            score = 20;
            bias = "Bearish";
            dailyChange = "+₹0.25";
            dailyChangePercent = "+0.30%";
            aiInsightText = "Rupee weakness may increase inflationary pressure and reduce foreign investor confidence.";
        } else {
            score = 70;
            bias = "Neutral";
            dailyChange = "+₹0.00";
            dailyChangePercent = "0.00%";
            aiInsightText = "Currency markets remain stable with limited impact on equities.";
        }
    }

    const whyItMatters = [
        "Measures Rupee strength.",
        "Influences FII investment flows.",
        "Impacts import costs and inflation.",
        "Affects corporate earnings.",
        "Strong macroeconomic indicator."
    ];

    return (
        <IndicatorCard
            config={{ 
                title: configData.title || "USD/INR Exchange Rate", 
                category: configData.category || "Global Macro", 
                mode: "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "USD/INR Rate", value: currentValue ?? "--" }, 
                details: [
                    { label: "Daily Change", value: dailyChange },
                    { label: "Daily Change (%)", value: dailyChangePercent }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "USD/INR" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
