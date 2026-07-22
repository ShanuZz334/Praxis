import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

import { scoreEMA200Card } from '../engine/TechnicalCompositeEngine';

export default function EMA200Card({ cardId, data = null, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.ema_200.id);
    
    // Resolve current value
    const currentValue = data?.ema_200 ?? null;
    const currentPrice = data?.current_price ?? null;

    const { score, bias, confidence, aiInsight } = scoreEMA200Card(currentValue, currentPrice);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? "₹" + parseFloat(currentValue).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ title: "EMA 200", category: "Trend", mode: "AUTO", creditScore: configData.creditScore, updateTime: lastUpdated ?? "--:--", source: configData.source, aiModel: configData.aiModel }}
            data={{ 
                currentValueObj: { label: "Value", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "EMA 200" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "The ultimate institutional trend filter.",
                    "Price above EMA 200 indicates a long-term bull market.",
                    "Price below EMA 200 indicates a long-term bear market.",
                    "Acts as major psychological support and resistance.",
                    "Crucial for identifying macro market regimes."
                ] 
            }}
            />
    );
}
