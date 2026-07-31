import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

import { scoreNhnlCard } from '../engine/TechnicalCompositeEngine';

export default function NhnlCard({ cardId, data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.nh_nl.id);
    
    // Resolve current value
    const liveNHNL = data?.breadth?.nhnlRatio;
    const isLiveData = liveNHNL !== undefined && liveNHNL !== null;
    const currentValue = isLiveData ? liveNHNL : (manualOverride ?? null);

    const { score, bias, confidence, aiInsight } = scoreNhnlCard(currentValue);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? parseFloat(currentValue).toFixed(2) : '--';
return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "New High / New Low", 
                category: "Market Breadth", 
                mode: isLiveData ? "AUTO" : "MANUAL",
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "NH/NL Ratio", value: displayValue }, 
                details: [],
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: [], valueKey: "value", valueName: "NH/NL %" }}
            insights={{ aiInsight: aiInsight, whyItMatters: ["Provides context on volume and market breadth.", "Crucial for confirming trend strength."] }}
            />
    );
}
