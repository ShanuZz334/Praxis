import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scoreEMA20Card } from '../engine/TechnicalCompositeEngine';

export default function EMA20Card({ data = null, lastUpdated }) {
    const configData = getIndicatorConfig('ema_20');
    
    // Resolve current value
    const currentValue = data?.ema_20 ?? null;
    const currentPrice = data?.current_price ?? null;

    const { score, bias, confidence, aiInsight } = scoreEMA20Card(currentValue, currentPrice);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? "₹" + parseFloat(currentValue).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            config={{ title: "EMA 20", category: "Trend", mode: "AUTO", creditScore: configData.creditScore, updateTime: lastUpdated ?? "--:--", source: configData.source, aiModel: configData.aiModel }}
            data={{ 
                currentValueObj: { label: "Value", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "EMA 20" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "One of the most widely used short-term trend indicators.",
                    "Acts as dynamic support during uptrends.",
                    "Acts as dynamic resistance during downtrends.",
                    "Reacts faster than SMA because recent prices carry more weight.",
                    "Forms the foundation for many institutional trading systems."
                ] 
            }}
            />
    );
}
