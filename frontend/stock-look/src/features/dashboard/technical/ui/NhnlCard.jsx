import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function NhnlCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null); // Ratio %
    
    const configData = getIndicatorConfig('nh_nl');
    
    let score = 0, bias = "Neutral", confidence = "80%", aiInsightText = "Waiting for data...";
    
    // Derived values
    const newHighs = currentValue ? Math.floor(currentValue * 10) : 0;
    const newLows = currentValue ? Math.floor((100 - currentValue) * 10) : 0;
    const netHighs = newHighs - newLows;
    let trend = "Neutral";

    if (currentValue !== null) {
        if (currentValue < 30) {
            score = 20;
            bias = "Bearish";
            trend = "Weakening";
            aiInsightText = "Selling pressure is spreading across the market; leadership is narrowing.";
        } else if (currentValue < 50) {
            score = 40;
            bias = "Bearish";
            trend = "Weakening";
            aiInsightText = "More stocks making new lows; trend quality is deteriorating.";
        } else if (currentValue === 50) {
            score = 60;
            bias = "Neutral";
            trend = "Neutral";
            aiInsightText = "Market leadership is balanced between new highs and new lows.";
        } else if (currentValue <= 70) {
            score = 75;
            bias = "Bullish";
            trend = "Improving";
            aiInsightText = "Market leadership is expanding and more stocks are participating in the trend.";
        } else {
            score = 90;
            bias = "Bullish";
            trend = "Improving";
            aiInsightText = "Trend is supported by broad market participation with strong leadership.";
        }
    }

    const whyItMatters = [
        "Measures market leadership.",
        "Confirms trend sustainability.",
        "Detects weakening rallies.",
        "Identifies broad accumulation or distribution.",
        "Helps identify major market turning points."
    ];

    return (
        <IndicatorCard
            config={{ 
                title: "New High / New Low", 
                category: "Market Breadth", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: "Live", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "NH/NL Ratio", value: currentValue ? currentValue.toFixed(1) + "%" : "--" }, 
                details: [
                    { label: "New Highs", value: newHighs || "--" },
                    { label: "New Lows", value: newLows || "--" },
                    { label: "Net Highs", value: netHighs || "--" },
                    { label: "Trend", value: trend }
                ],
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "NH/NL %" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => { 
                const n = parseFloat(val); 
                if(!isNaN(n)) setCurrentValue(n); 
            }}
        />
    );
}
