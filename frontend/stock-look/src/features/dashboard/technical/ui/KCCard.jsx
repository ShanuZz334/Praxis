import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

import { scoreKCCard } from '../engine/TechnicalCompositeEngine';

export default function KCCard({ cardId, data = null, manualOverride, lastUpdated, indicatorParams, onOpenSettings }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.kc.id);
    
    const settingsConfig = [
        { id: "kc_period", label: "KC Period", type: "number", min: 2, max: 100, default: 20 },
        { id: "kc_multiplier", label: "KC Multiplier", type: "number", min: 0.1, max: 5, default: 1.5 },
        { id: "kc_atr_period", label: "KC ATR Period", type: "number", min: 2, max: 100, default: 10 }
    ];

    // Resolve current value from live backend data
    const valObj = data?.kc || null;
    const currentPrice = data?.current_price || null;

    const { score, bias, confidence, aiInsight } = scoreKCCard(valObj, currentPrice);

    const formatVal = (v) => (v !== null && v !== undefined && !isNaN(v) ? "₹" + parseFloat(v).toFixed(2) : '--');

return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Keltner Channel", 
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
                currentValueObj: null, 
                details: [
                    {label: "Upper Channel", value: formatVal(valObj?.upper)}, 
                    {label: "Middle Line", value: formatVal(valObj?.middle)}, 
                    {label: "Lower Channel", value: formatVal(valObj?.lower)}
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "KC Score" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "Identifies trend direction.",
                    "Measures volatility using ATR.",
                    "Detects pullbacks within trends.",
                    "Filters false breakout signals.",
                    "Excellent for trend-following strategies."
                ]
            }}
            />
    );
}
