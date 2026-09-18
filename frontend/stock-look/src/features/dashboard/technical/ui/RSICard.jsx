import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';
import { scoreRSICard } from '../engine/TechnicalCompositeEngine';

export default function RSICard({ cardId, data = null, manualOverride, lastUpdated, tradingMode = 'swing', indicatorParams, onOpenSettings }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.rsi.id);
    
    const settingsConfig = [
        { id: "rsi_period", label: "RSI Period", type: "number", min: 2, max: 50, default: 14 }
    ];

    // Resolve current value from live data or manual override
    const isLiveData = data?.rsi !== undefined && data?.rsi !== null && !isNaN(Number(data.rsi));
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const currentValue = isLiveData ? Number(data.rsi) : (isManual ? Number(manualOverride) : null);
    const mode = isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO");

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreRSICard(currentValue), 'rsi', tradingMode);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? parseFloat(currentValue).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "RSI", 
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
                currentValueObj: { label: "Current RSI", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight,
                isManual
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
