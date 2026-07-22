import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

import { scoreATRCard } from '../engine/TechnicalCompositeEngine';

export default function ATRCard({ cardId, data = null, manualOverride, lastUpdated, indicatorParams, onOpenSettings }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.atr.id);
    
    const settingsConfig = [
        { id: "atr_period", label: "ATR Period", type: "number", min: 2, max: 100, default: 14 }
    ];

    // Resolve current value from live backend data
    const currentValue = data?.atr ?? null;
    const currentPrice = data?.current_price ?? null;

    const { score, bias, confidence, aiInsight } = scoreATRCard(currentValue, currentPrice);

    const formatVal = (v) => (v !== null && v !== undefined && !isNaN(v) ? parseFloat(v).toFixed(2) : '--');

return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Average True Range", 
                category: "Volatility", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel,
                settingsConfig,
                onSettingsClick: () => onOpenSettings?.(settingsConfig)
            }}
            data={{ 
                currentValueObj: { label: "ATR Score", value: formatVal(currentValue) }, 
                details: [
                    {label: "Period", value: indicatorParams?.atr_period || 14}
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "ATR Score" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "Measures market volatility.",
                    "Helps position sizing.",
                    "Determines stop-loss distance.",
                    "Confirms breakout quality.",
                    "Essential for professional risk management."
                ]
            }}
            />
    );
}
