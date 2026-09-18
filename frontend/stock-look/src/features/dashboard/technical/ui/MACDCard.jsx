import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

import { scoreMACDCard } from '../engine/TechnicalCompositeEngine';

export default function MACDCard({ cardId, data = null, manualOverride, lastUpdated, tradingMode = 'swing', indicatorParams, onOpenSettings }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.macd.id);
    
    const settingsConfig = [
        { id: "macd_fast", label: "Fast Length", type: "number", min: 1, max: 50, default: 12 },
        { id: "macd_slow", label: "Slow Length", type: "number", min: 1, max: 100, default: 26 },
        { id: "macd_signal", label: "Signal Smoothing", type: "number", min: 1, max: 50, default: 9 }
    ];

    // Resolve current value
    const isLiveData = data?.macd !== undefined && data?.macd !== null && data?.macd?.histogram !== undefined && data?.macd?.histogram !== null;
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const currentValueObj = isLiveData ? data.macd : (isManual ? { histogram: Number(manualOverride), MACD: Number(manualOverride), signal: 0 } : null);
    const mode = isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO");

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreMACDCard(currentValueObj), 'macd', tradingMode);

    const histValue = currentValueObj?.histogram !== undefined && currentValueObj.histogram !== null ? parseFloat(currentValueObj.histogram).toFixed(2) : '--';
    const macdValue = currentValueObj?.MACD !== undefined && currentValueObj.MACD !== null ? parseFloat(currentValueObj.MACD).toFixed(2) : '--';
    const signalValue = currentValueObj?.signal !== undefined && currentValueObj.signal !== null ? parseFloat(currentValueObj.signal).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "MACD", 
                category: "Trend & Momentum", 
                mode, 
                creditScore: configData.creditScore, 
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'), 
                source: isLiveData ? configData.source : "Manual", 
                aiModel: configData.aiModel,
                settingsConfig,
                onSettingsClick: () => onOpenSettings?.(settingsConfig)
            }}
            data={{ 
                currentValueObj: { label: "Histogram", value: histValue }, 
                details: [
                    { label: "MACD Line", value: macdValue },
                    { label: "Signal Line", value: signalValue }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight,
                isManual
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "MACD Histogram" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "Combines trend following with momentum velocity.",
                    "MACD crossing above Signal is a classic bullish entry trigger.",
                    "MACD crossing below Signal is a classic bearish exit trigger.",
                    "Histogram expanding means trend acceleration.",
                    "Zero-line crossovers indicate major, long-term trend shifts."
                ] 
            }}
            />
    );
}
