import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function ADLineCard({ initialData = null }) {
    const [currentValue, setCurrentValue] = useState(initialData?.currentValue || null);
    
    const configData = getIndicatorConfig('ad_line');
    
    let score = 0, bias = "Neutral", confidence = "80%", aiInsightText = "Waiting for data...";
    
    const netAdvances = currentValue ? Math.floor(currentValue * 0.1) : 0;
    const advancing = currentValue ? Math.floor(currentValue * 0.5) + netAdvances : 0;
    const declining = currentValue ? Math.floor(currentValue * 0.5) - netAdvances : 0;
    let trend = "Flat";

    if (currentValue !== null) {
        if (currentValue < -1000) {
            score = 25;
            bias = "Bearish";
            trend = "Falling";
            aiInsightText = "The rally is losing internal strength and should be monitored closely.";
        } else if (currentValue < 0) {
            score = 40;
            bias = "Bearish";
            trend = "Falling";
            aiInsightText = "Selling pressure is becoming widespread.";
        } else if (currentValue === 0) {
            score = 60;
            bias = "Neutral";
            trend = "Flat";
            aiInsightText = "Market participation remains neutral and balanced.";
        } else if (currentValue <= 1000) {
            score = 75;
            bias = "Bullish";
            trend = "Rising";
            aiInsightText = "The broader market is participating in the rally.";
        } else {
            score = 90;
            bias = "Bullish";
            trend = "Rising";
            aiInsightText = "Market participation is improving strongly despite weak price action.";
        }
    }

    const whyItMatters = [
        "Measures overall market health.",
        "Confirms trend participation.",
        "Detects hidden market weakness.",
        "Identifies early reversals.",
        "One of the most trusted breadth indicators."
    ];

    return (
        <IndicatorCard
            config={{ 
                title: "Advance / Decline Line", 
                category: "Market Breadth", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: "Live", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "A/D Line", value: currentValue ?? "--" }, 
                details: [
                    { label: "Net Advances", value: netAdvances || "--" },
                    { label: "Advancing Stocks", value: advancing || "--" },
                    { label: "Declining Stocks", value: declining || "--" },
                    { label: "Trend", value: trend }
                ],
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: initialData?.history || [], valueKey: "value", valueName: "A/D Line" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
            onSave={(val) => { 
                const n = parseFloat(val); 
                if(!isNaN(n)) setCurrentValue(n); 
            }}
        />
    );
}
