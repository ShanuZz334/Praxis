import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

import { scoreSupertrendCard } from '../engine/TechnicalCompositeEngine';

export default function SupertrendCard({ cardId, data = null, lastUpdated, indicatorParams, onOpenSettings }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.supertrend.id);
    
    const settingsConfig = [
        { id: "supertrend_period", label: "Supertrend Period", type: "number", min: 1, max: 50, default: 10 },
        { id: "supertrend_multiplier", label: "Supertrend Multiplier", type: "number", min: 1, max: 10, default: 3 }
    ];
    
    // Resolve current value
    const currentValueObj = data?.supertrend ?? null;
    const currentPrice = data?.current_price ?? null;

    const { score, bias, confidence, aiInsight } = scoreSupertrendCard(currentValueObj, currentPrice);

    const displayValue = currentValueObj !== null && currentValueObj.value !== undefined ? parseFloat(currentValueObj.value).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Supertrend", 
                category: "Trend", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel,
                settingsConfig,
                onSettingsClick: () => onOpenSettings?.(settingsConfig)
            }}
            data={{ 
                currentValueObj: { label: "Value", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "Supertrend" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "Combines trend direction and volatility (ATR) in one indicator.",
                    "Excellent for trailing stop losses in strong trends.",
                    "Keeps you in a winning trade during normal pullbacks.",
                    "Can generate false signals during choppy, range-bound markets.",
                    "Reduces emotional trading by drawing definitive lines in the sand."
                ] 
            }}
            />
    );
}
