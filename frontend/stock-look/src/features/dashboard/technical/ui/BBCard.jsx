import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

import { scoreBBCard } from '../engine/TechnicalCompositeEngine';

export default function BBCard({ cardId, data = null, manualOverride, lastUpdated, indicatorParams, onOpenSettings, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.bb_20_2.id);
    
    const settingsConfig = [
        { id: "bb_period", label: "BB Period", type: "number", min: 2, max: 100, default: 20 },
        { id: "bb_stddev", label: "BB StdDev", type: "number", min: 0.1, max: 5, default: 2 }
    ];

    // Resolve current value from live backend data or manual override
    const isLiveData = !!(data?.bb_20_2 && data.bb_20_2.pb !== undefined && data.bb_20_2.pb !== null);
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const valObj = isLiveData ? data.bb_20_2 : (isManual ? { pb: Number(manualOverride) } : null);
    const mode = isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO");

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreBBCard(valObj), 'bb_20_2', tradingMode);

    const formatPrice = (v) => (v !== null && v !== undefined && !isNaN(v) ? "₹" + parseFloat(v).toFixed(2) : '--');
    const formatPercent = (v) => (v !== null && v !== undefined && !isNaN(v) ? (parseFloat(v) * 100).toFixed(2) + '%' : '--');

    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Bollinger Bands", 
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
                currentValueObj: { label: "%b Score", value: formatPercent(valObj?.pb) }, 
                details: [
                    {label: "Upper Band", value: formatPrice(valObj?.upper)}, 
                    {label: "Middle Band", value: formatPrice(valObj?.middle)}, 
                    {label: "Lower Band", value: formatPrice(valObj?.lower)}
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight,
                isManual 
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "BB Score" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "Measures market volatility dynamically.",
                    "Identifies volatility contractions and expansions.",
                    "Detects potential breakout conditions.",
                    "Helps identify overextended price moves.",
                    "Useful for both trend-following and mean-reversion strategies."
                ]
            }}
            />
    );
}
