import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scoreStochRSICard } from '../engine/TechnicalCompositeEngine';

export default function StochRSICard({ data = null, lastUpdated, indicatorParams, onOpenSettings }) {
    const configData = getIndicatorConfig('stoch_rsi');
    
    const settingsConfig = [
        { id: "stoch_rsi_period", label: "RSI Length", type: "number", min: 1, max: 50, default: 14 },
        { id: "stoch_period", label: "Stochastic Length", type: "number", min: 1, max: 50, default: 14 },
        { id: "stoch_k_period", label: "%K Smoothing", type: "number", min: 1, max: 20, default: 3 },
        { id: "stoch_d_period", label: "%D Smoothing", type: "number", min: 1, max: 20, default: 3 }
    ];

    // Resolve current value
    const currentValueObj = data?.stoch_rsi ?? null;

    const { score, bias, confidence, aiInsight } = scoreStochRSICard(currentValueObj);

    const kValue = currentValueObj?.k !== undefined && currentValueObj.k !== null ? parseFloat(currentValueObj.k).toFixed(2) + "%" : '--';
    const dValue = currentValueObj?.d !== undefined && currentValueObj.d !== null ? parseFloat(currentValueObj.d).toFixed(2) + "%" : '--';
    
    return (
        <IndicatorCard
            config={{ 
                title: "Stochastic RSI", 
                category: "Momentum", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel,
                settingsConfig,
                onSettingsClick: () => onOpenSettings?.(settingsConfig)
            }}
            data={{ 
                currentValueObj: { label: "%K Value", value: kValue }, 
                details: [
                    { label: "%D Value", value: dValue }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "StochRSI" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "A derivative of RSI, making it extremely sensitive to momentum shifts.",
                    "Excellent for identifying micro-cycles within a larger trend.",
                    "%K crossing above %D in oversold territory is a highly actionable signal.",
                    "Because it is so fast, it produces many false signals in choppy markets.",
                    "Best used in confluence with slower trend filters like SMA 200."
                ] 
            }}
            />
    );
}
