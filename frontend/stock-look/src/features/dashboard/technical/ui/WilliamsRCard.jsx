import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

import { scoreWilliamsRCard } from '../engine/TechnicalCompositeEngine';

export default function WilliamsRCard({ cardId, data = null, lastUpdated, indicatorParams, onOpenSettings }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.williams_r.id);
    
    const settingsConfig = [
        { id: "williams_period", label: "Lookback Period", type: "number", min: 1, max: 100, default: 14 }
    ];

    // Resolve current value
    const currentValue = data?.williams_r ?? null;

    const { score, bias, confidence, aiInsight } = scoreWilliamsRCard(currentValue);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? parseFloat(currentValue).toFixed(2) + "%" : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Williams %R", 
                category: "Momentum", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel,
                settingsConfig,
                onSettingsClick: () => onOpenSettings?.(settingsConfig)
            }}
            data={{ 
                currentValueObj: { label: "Williams %R", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "Williams %R" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "Measures overbought and oversold levels, similar to Stochastic.",
                    "Scale is inverted: 0 to -20 is overbought, -80 to -100 is oversold.",
                    "Reacts very quickly to changes in price momentum.",
                    "Can remain pinned at extreme levels during strong trends.",
                    "Often precedes RSI in signaling a potential reversal."
                ] 
            }}
            />
    );
}
