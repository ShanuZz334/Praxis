import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

import { scoreATRCard } from '../engine/TechnicalCompositeEngine';

export default function ATRCard({ cardId, data = null, manualOverride, lastUpdated, indicatorParams, onOpenSettings, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.atr.id);
    
    const settingsConfig = [
        { id: "atr_period", label: "ATR Period", type: "number", min: 2, max: 100, default: 14 }
    ];

    // Resolve current value from live backend data or manual override
    const isLiveData = data?.atr !== undefined && data?.atr !== null && !isNaN(Number(data.atr));
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const currentValue = isLiveData ? Number(data.atr) : (isManual ? Number(manualOverride) : null);
    const currentPrice = data?.current_price ?? null;
    const mode = isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO");

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreATRCard(currentValue, currentPrice), 'atr', tradingMode);

    const formatVal = (v) => (v !== null && v !== undefined && !isNaN(v) ? parseFloat(v).toFixed(2) : '--');

    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Average True Range", 
                category: "Volatility", 
                mode, 
                creditScore: configData.creditScore, 
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'), 
                source: isLiveData ? configData.source : "Manual", 
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
                impactWeight: configData.impactWeight,
                isManual
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
