import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scoreBBCard } from '../engine/TechnicalCompositeEngine';

export default function BBCard({ data = null, manualOverride, lastUpdated, indicatorParams, onOpenSettings }) {
    const configData = getIndicatorConfig('bb_20_2');
    
    const settingsConfig = [
        { id: "bb_period", label: "BB Period", type: "number", min: 2, max: 100, default: 20 },
        { id: "bb_stddev", label: "BB StdDev", type: "number", min: 0.1, max: 5, default: 2 }
    ];

    // Resolve current value from live backend data
    const valObj = data?.bb_20_2 || null;

    const { score, bias, confidence, aiInsight } = scoreBBCard(valObj);

    const formatPrice = (v) => (v !== null && v !== undefined && !isNaN(v) ? "₹" + parseFloat(v).toFixed(2) : '--');
    const formatPercent = (v) => (v !== null && v !== undefined && !isNaN(v) ? (parseFloat(v) * 100).toFixed(2) + '%' : '--');

return (
        <IndicatorCard
            config={{ 
                title: "Bollinger Bands", 
                category: "Volatility", 
                mode: "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
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
                impactWeight: configData.impactWeight 
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
