import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scoreMACDCard } from '../engine/TechnicalCompositeEngine';

export default function MACDCard({ data = null, lastUpdated, indicatorParams, onOpenSettings }) {
    const configData = getIndicatorConfig('macd');
    
    const settingsConfig = [
        { id: "macd_fast", label: "Fast Length", type: "number", min: 1, max: 50, default: 12 },
        { id: "macd_slow", label: "Slow Length", type: "number", min: 1, max: 100, default: 26 },
        { id: "macd_signal", label: "Signal Smoothing", type: "number", min: 1, max: 50, default: 9 }
    ];

    // Resolve current value
    const currentValueObj = data?.macd ?? null;

    const { score, bias, confidence, aiInsight } = scoreMACDCard(currentValueObj);

    const histValue = currentValueObj?.histogram !== undefined && currentValueObj.histogram !== null ? parseFloat(currentValueObj.histogram).toFixed(2) : '--';
    const macdValue = currentValueObj?.MACD !== undefined && currentValueObj.MACD !== null ? parseFloat(currentValueObj.MACD).toFixed(2) : '--';
    const signalValue = currentValueObj?.signal !== undefined && currentValueObj.signal !== null ? parseFloat(currentValueObj.signal).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            config={{ 
                title: "MACD", 
                category: "Trend & Momentum", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
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
                impactWeight: configData.impactWeight 
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
