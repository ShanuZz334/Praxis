import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scoreADXCard } from '../engine/TechnicalCompositeEngine';

export default function ADXCard({ cardId, data = null, lastUpdated, indicatorParams, onOpenSettings }) {
    const configData = getIndicatorConfig('adx');
    
    const settingsConfig = [
        { id: "adx_period", label: "ADX Period", type: "number", min: 5, max: 50, default: 14 }
    ];
    
    // Resolve current value
    const currentValueObj = data?.adx ?? null;

    const { score, bias, confidence, aiInsight } = scoreADXCard(currentValueObj);

    const displayValue = currentValueObj !== null && currentValueObj.value !== undefined ? parseFloat(currentValueObj.value).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "ADX", 
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
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "ADX" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "Measures trend strength, not trend direction.",
                    "Scores below 20 indicate a ranging, choppy market.",
                    "Scores above 25 indicate a strong, trending market.",
                    "Helps avoid false breakouts during consolidation periods.",
                    "Often used to determine whether to use trend-following or mean-reversion strategies."
                ] 
            }}
            />
    );
}
