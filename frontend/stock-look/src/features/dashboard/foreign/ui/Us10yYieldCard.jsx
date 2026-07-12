import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function Us10yYieldCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const configData = getIndicatorConfig('us_10y_yield');
    
    let score = 0, bias = "Neutral", confidence = "92%", aiInsightText = "Waiting...";
    let impactWeight = configData.impactWeight || "Very High";
    
    let dailyChange = "0 bps";
    let dailyChangePercent = "0.00%";
    
    if (currentValue !== null) {
        if (currentValue < 4.0) {
            score = 90;
            bias = "Bullish";
            dailyChange = "-5 bps";
            dailyChangePercent = "-1.20%";
            aiInsightText = "Declining Treasury yields improve liquidity conditions and generally support equity markets.";
        } else if (currentValue > 4.5) {
            score = 20;
            bias = "Bearish";
            dailyChange = "+6 bps";
            dailyChangePercent = "+1.40%";
            aiInsightText = "Higher Treasury yields increase borrowing costs and may pressure equity valuations.";
        } else {
            score = 70;
            bias = "Neutral";
            dailyChange = "0 bps";
            dailyChangePercent = "0.00%";
            aiInsightText = "Bond markets remain stable with limited macroeconomic impact.";
        }
    }

    const whyItMatters = [
        "Measures global interest rate expectations.",
        "Reflects worldwide liquidity conditions.",
        "Influences FII/FPI capital flows.",
        "Impacts equity valuations.",
        "Critical macroeconomic indicator."
    ];

    return (
        <IndicatorCard
            config={{ 
                title: configData.title || "US 10-Year Treasury Yield", 
                category: configData.category || "Global Macro", 
                mode: "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "10-Year Yield (%)", value: currentValue ?? "--" }, 
                details: [
                    { label: "Daily Change", value: dailyChange },
                    { label: "Daily Change (%)", value: dailyChangePercent }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "Yield" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => { const n = parseFloat(val); if(!isNaN(n)) setCurrentValue(n); }}
        />
    );
}
