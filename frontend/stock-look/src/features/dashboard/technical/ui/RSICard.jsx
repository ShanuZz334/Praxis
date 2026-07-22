import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

import { scoreRSICard } from '../engine/TechnicalCompositeEngine';

export default function RSICard({ cardId, data = null, lastUpdated, indicatorParams, onOpenSettings }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.rsi.id);
    
    const settingsConfig = [
        { id: "rsi_period", label: "RSI Period", type: "number", min: 2, max: 50, default: 14 }
    ];

    // Resolve current value
    const currentValue = data?.rsi ?? null;

    const { score, bias, confidence, aiInsight } = scoreRSICard(currentValue);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? parseFloat(currentValue).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "RSI", 
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
                currentValueObj: { label: "Current RSI", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "RSI" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "The premier momentum oscillator for identifying overbought/oversold extremes.",
                    "Wall Street closely monitors the 30 and 70 thresholds.",
                    "Divergence between RSI and price action is a powerful reversal signal.",
                    "In strong uptrends, RSI may stay overbought (>70) for extended periods.",
                    "In strong downtrends, RSI may stay oversold (<30) for extended periods."
                ] 
            }}
            />
    );
}
