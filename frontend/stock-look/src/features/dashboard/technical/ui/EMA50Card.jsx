import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scoreEMA50Card } from '../engine/TechnicalCompositeEngine';

export default function EMA50Card({ data = null, lastUpdated }) {
    const configData = getIndicatorConfig('ema_50');
    
    // Resolve current value
    const currentValue = data?.ema_50 ?? null;
    const currentPrice = data?.current_price ?? null;

    const { score, bias, confidence, aiInsight } = scoreEMA50Card(currentValue, currentPrice);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? "₹" + parseFloat(currentValue).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            config={{ title: "EMA 50", category: "Trend", mode: "AUTO", creditScore: configData.creditScore, updateTime: lastUpdated ?? "--:--", source: configData.source, aiModel: configData.aiModel }}
            data={{ 
                currentValueObj: { label: "Value", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "EMA 50" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "One of the most respected institutional trend indicators.",
                    "Filters short-term market noise better than EMA20.",
                    "Often acts as medium-term dynamic support and resistance.",
                    "Used by funds and swing traders to identify trend direction.",
                    "Frequently combined with EMA20 and EMA200 for trend confirmation."
                ] 
            }}
            />
    );
}
