import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

import { scoreSupertrendCard } from '../engine/TechnicalCompositeEngine';

export default function SupertrendCard({ cardId, data = null, manualOverride, lastUpdated, indicatorParams, onOpenSettings, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.supertrend.id);
    
    const settingsConfig = [
        { id: "supertrend_period", label: "Supertrend Period", type: "number", min: 1, max: 50, default: 10 },
        { id: "supertrend_multiplier", label: "Supertrend Multiplier", type: "number", min: 1, max: 10, default: 3 }
    ];
    
    // Resolve current value from live data or manual override
    const currentPrice = data?.current_price ?? null;
    const isLiveData = !!(data?.supertrend && data.supertrend.value !== undefined && data.supertrend.value !== null);
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const currentValueObj = isLiveData 
        ? data.supertrend 
        : (isManual ? { value: Number(manualOverride), isUptrend: currentPrice !== null ? currentPrice >= Number(manualOverride) : true } : null);
    const mode = isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO");

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreSupertrendCard(currentValueObj, currentPrice), 'supertrend', tradingMode);

    const displayValue = currentValueObj !== null && currentValueObj.value !== undefined ? "₹" + parseFloat(currentValueObj.value).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Supertrend", 
                category: "Trend", 
                mode, 
                creditScore: configData.creditScore, 
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'), 
                source: isLiveData ? configData.source : "Manual", 
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
                impactWeight: configData.impactWeight,
                isManual
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
