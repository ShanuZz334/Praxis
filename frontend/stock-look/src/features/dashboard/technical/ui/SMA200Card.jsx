import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scoreSMA200Card } from '../engine/TechnicalCompositeEngine';

export default function SMA200Card({ cardId, data = null, lastUpdated }) {
    const configData = getIndicatorConfig('sma_200');
    
    // Resolve current value
    const currentValue = data?.sma_200 ?? null;
    const currentPrice = data?.current_price ?? null;

    const { score, bias, confidence, aiInsight } = scoreSMA200Card(currentValue, currentPrice);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? "₹" + parseFloat(currentValue).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ title: "SMA 200", category: "Trend", mode: "AUTO", creditScore: configData.creditScore, updateTime: lastUpdated ?? "--:--", source: configData.source, aiModel: configData.aiModel }}
            data={{ 
                currentValueObj: { label: "Value", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "SMA 200" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "The ultimate institutional benchmark for long-term trend direction.",
                    "Slower and more stable than EMA200.",
                    "Used globally by investors to filter bull and bear markets.",
                    "Major resistance in bear markets and major support in bull markets.",
                    "Forms the slower leg of the famous 'Golden Cross' signal."
                ] 
            }}
            />
    );
}
