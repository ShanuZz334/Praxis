import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

import { scoreADXCard } from '../engine/TechnicalCompositeEngine';

export default function ADXCard({ cardId, data = null, manualOverride, lastUpdated, indicatorParams, onOpenSettings, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.adx.id);
    
    const settingsConfig = [
        { id: "adx_period", label: "ADX Period", type: "number", min: 5, max: 50, default: 14 }
    ];
    
    // Resolve current value from live data or manual override
    const isLiveData = !!(data?.adx && data.adx.value !== undefined && data.adx.value !== null);
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const currentValueObj = isLiveData ? data.adx : (isManual ? { value: Number(manualOverride) } : null);
    const mode = isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO");

    const isBullish = currentValueObj?.pdi !== undefined && currentValueObj?.mdi !== undefined
        ? Number(currentValueObj.pdi) >= Number(currentValueObj.mdi)
        : (data?.supertrend ? data.supertrend.direction === 1 : (data?.current_price && data?.ema_50 ? data.current_price >= data.ema_50 : null));

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreADXCard(currentValueObj, isBullish), 'adx', tradingMode);

    const displayValue = currentValueObj !== null && currentValueObj.value !== undefined ? parseFloat(currentValueObj.value).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "ADX", 
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
