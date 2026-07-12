import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function BBCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    const configData = getIndicatorConfig('bb_20_2');
    
    let score = 50, bias = "Neutral", confidence = "75%", aiInsightText = "Waiting for data...";
    
    if (currentValue !== null) {
        const val = Number(currentValue);
        score = val >= 0 && val <= 100 ? val : 50; 
        
        if (score >= 85) { 
            bias = "Strong Bullish"; 
            aiInsightText = "Strong bullish momentum while price may be overextended above the upper band."; 
        } else if (score >= 70) { 
            bias = "Bullish"; 
            aiInsightText = "Volatility is expanding and trend strength is improving."; 
        } else if (score >= 50) { 
            bias = "Neutral"; 
            aiInsightText = "The market is trading around its average value with balanced momentum."; 
        } else if (score >= 30) { 
            bias = "Weak"; 
            aiInsightText = "Volatility has contracted (Band Squeeze) and a significant move may be approaching."; 
        } else { 
            bias = "Bearish"; 
            aiInsightText = "Strong bearish momentum while noting possible oversold conditions below the lower band."; 
        }
    }

    return (
        <IndicatorCard
            config={{ 
                title: "Bollinger Bands", 
                category: "Volatility", 
                mode: "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "BB Score", value: currentValue ?? "--" }, 
                details: [
                    {label: "Upper Band", value: "--"}, 
                    {label: "Middle Band", value: "--"}, 
                    {label: "Lower Band", value: "--"}
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "BB Score" }}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Measures market volatility dynamically.",
                    "Identifies volatility contractions and expansions.",
                    "Detects potential breakout conditions.",
                    "Helps identify overextended price moves.",
                    "Useful for both trend-following and mean-reversion strategies."
                ]
            }}
            onSave={(val) => { 
                const n = parseFloat(val); 
                if(!isNaN(n)) setCurrentValue(n); 
            }}
        />
    );
}
