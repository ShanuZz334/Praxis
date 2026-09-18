import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

import { scoreWilliamsRCard } from '../engine/TechnicalCompositeEngine';

export default function WilliamsRCard({ cardId, data = null, manualOverride, lastUpdated, tradingMode = 'swing', indicatorParams, onOpenSettings }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.williams_r.id);
    
    const settingsConfig = [
        { id: "williams_period", label: "Lookback Period", type: "number", min: 1, max: 100, default: 14 }
    ];

    // Resolve current value from live data or manual override
    const isLiveData = data?.williams_r !== undefined && data?.williams_r !== null && !isNaN(Number(data.williams_r));
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const currentValue = isLiveData ? Number(data.williams_r) : (isManual ? Number(manualOverride) : null);
    const mode = isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO");

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreWilliamsRCard(currentValue), 'williams_r', tradingMode);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? parseFloat(currentValue).toFixed(2) + "%" : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Williams %R", 
                category: "Momentum", 
                mode, 
                creditScore: configData.creditScore, 
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'), 
                source: isLiveData ? configData.source : "Manual", 
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
                impactWeight: configData.impactWeight,
                isManual
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
