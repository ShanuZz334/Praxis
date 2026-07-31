import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

import { scoreBreadthRatioCard } from '../engine/TechnicalCompositeEngine';

export default function BreadthRatioCard({ cardId, data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.breadth_ratio.id);
    
    // Resolve current value
    const liveRatio = data?.breadth?.breadthRatio;
    const isLiveData = liveRatio !== undefined && liveRatio !== null;
    const currentValue = isLiveData ? liveRatio : (manualOverride ?? null);

    const { score, bias, confidence, aiInsight } = scoreBreadthRatioCard(currentValue);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? parseFloat(currentValue).toFixed(2) : '--';
return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Market Breadth Ratio", 
                category: "Market Breadth", 
                mode: isLiveData ? "AUTO" : "MANUAL",
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Breadth Ratio", value: displayValue }, 
                details: [],
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "Breadth Ratio" }}
            insights={{ aiInsight: aiInsight, whyItMatters: ["Provides context on volume and market breadth.", "Crucial for confirming trend strength."] }}
            />
    );
}
