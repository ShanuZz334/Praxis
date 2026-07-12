import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function KCCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const configData = getIndicatorConfig('kc');
    
    let score = 50, bias = "Neutral", confidence = "75%", aiInsightText = "Waiting for data...";
    
    if (currentValue !== null) {
        const val = Number(currentValue);
        score = val >= 0 && val <= 100 ? val : 50; 
        
        if (score >= 85) { 
            bias = "Strong Bullish"; 
            aiInsightText = "Buying momentum is exceptionally strong above the upper channel."; 
        } else if (score >= 70) { 
            bias = "Bullish"; 
            aiInsightText = "Price is above EMA. Buyers remain in control."; 
        } else if (score >= 50) { 
            bias = "Neutral"; 
            aiInsightText = "The market is trading around its trend value. Trend strength is weak and the market may be consolidating."; 
        } else if (score >= 30) { 
            bias = "Weak"; 
            aiInsightText = "Price is below EMA. Trend is weakening."; 
        } else { 
            bias = "Bearish"; 
            aiInsightText = "Selling pressure has accelerated below the lower channel."; 
        }
    }

    return (
        <IndicatorCard
            config={{ 
                title: "Keltner Channel", 
                category: "Volatility", 
                mode: "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "KC Score", value: currentValue ?? "--" }, 
                details: [
                    {label: "Upper Channel", value: "--"}, 
                    {label: "Middle Line", value: "--"}, 
                    {label: "Lower Channel", value: "--"}
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "KC Score" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Identifies trend direction.",
                    "Measures volatility using ATR.",
                    "Detects pullbacks within trends.",
                    "Filters false breakout signals.",
                    "Excellent for trend-following strategies."
                ]
            }}
            onSave={(val) => { 
                const n = parseFloat(val); 
                if(!isNaN(n)) setCurrentValue(n); 
            }}
        />
    );
}
