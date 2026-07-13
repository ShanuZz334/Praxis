import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scoreVixCard } from '../engine/TechnicalCompositeEngine';

export default function VixCard({ data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig('india_vix');
    
    // Wire directly to live background synced India VIX, fallback to manual
    const liveValue = data?.india_vix ?? null;
    const isManual = liveValue === null && manualOverride !== null && manualOverride !== undefined;
    const currentValue = liveValue ?? manualOverride ?? null;

    const { score, bias, confidence, aiInsight } = scoreVixCard(currentValue);

    const displayValue = currentValue !== null && currentValue !== undefined && !isNaN(currentValue) ? parseFloat(currentValue).toFixed(2) + "%" : '--';

return (
        <IndicatorCard
            config={{ 
                title: "India VIX", 
                category: "Market Volatility", 
                mode: isManual ? "MANUAL" : "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Current VIX", value: displayValue, isManual }, 
                details: [
                    { label: "VIX Close", value: displayValue }
                ],
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "VIX" }}
            insights={{ aiInsight: aiInsight, whyItMatters: [
                "A measure of market expectation of volatility over the next 30 days.",
                "High values indicate fear and uncertainty.",
                "Low values indicate complacency."
            ] }}
            />
    );
}
