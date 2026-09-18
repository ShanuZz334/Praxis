import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

import { scoreKCCard } from '../engine/TechnicalCompositeEngine';

export default function KCCard({ cardId, data = null, manualOverride, lastUpdated, indicatorParams, onOpenSettings, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.kc.id);
    
    const settingsConfig = [
        { id: "kc_period", label: "KC Period", type: "number", min: 2, max: 100, default: 20 },
        { id: "kc_multiplier", label: "KC Multiplier", type: "number", min: 0.1, max: 5, default: 1.5 },
        { id: "kc_atr_period", label: "KC ATR Period", type: "number", min: 2, max: 100, default: 10 }
    ];

    // Resolve current value from live backend data or manual override
    const isLiveData = !!(data?.kc && (data.kc.middle !== undefined || data.kc.upper !== undefined));
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const valObj = isLiveData ? data.kc : (isManual ? Number(manualOverride) : null);
    const currentPrice = data?.current_price || null;
    const mode = isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO");

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreKCCard(valObj, currentPrice), 'kc', tradingMode);

    const formatVal = (v) => (v !== null && v !== undefined && !isNaN(v) ? "₹" + parseFloat(v).toFixed(2) : '--');

    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Keltner Channel", 
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
                currentValueObj: isManual ? { label: "Manual KC Middle", value: formatVal(valObj) } : null, 
                details: [
                    {label: "Upper Channel", value: formatVal(valObj?.upper)}, 
                    {label: "Middle Line", value: formatVal(isManual ? valObj : valObj?.middle)}, 
                    {label: "Lower Channel", value: formatVal(valObj?.lower)}
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight,
                isManual
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
