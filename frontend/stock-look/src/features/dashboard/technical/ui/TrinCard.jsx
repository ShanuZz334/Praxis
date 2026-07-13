import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scoreTrinCard } from '../engine/TechnicalCompositeEngine';

export default function TrinCard({ data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig('trin');
    
    // Resolve current value
    const isLiveData = false; 
    const currentValue = isLiveData ? null : (manualOverride ?? null);

    const { score, bias, confidence, aiInsight } = scoreTrinCard(currentValue);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? parseFloat(currentValue).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            config={{ 
                title: "TRIN (Arms Index)", 
                category: "Market Breadth", 
                mode: "MANUAL",
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Current TRIN", value: displayValue }, 
                details: [],
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "TRIN" }}
            insights={{ aiInsight: aiInsight, whyItMatters: ["Provides context on volume and market breadth.", "Crucial for confirming trend strength."] }}
            />
    );
}
