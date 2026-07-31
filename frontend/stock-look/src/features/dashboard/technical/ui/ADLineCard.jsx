import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

import { scoreADLineCard } from '../engine/TechnicalCompositeEngine';

export default function ADLineCard({ cardId, data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.ad_line.id);
    
    // Resolve current value
    const liveNet = data?.breadth?.netAdvances;
    const isLiveData = liveNet !== undefined && liveNet !== null;
    const currentValue = isLiveData ? liveNet : (manualOverride ?? null);

    const { score, bias, confidence, aiInsight } = scoreADLineCard(currentValue);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? parseFloat(currentValue).toFixed(2) : '--';
return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Advance / Decline Line", 
                category: "Market Breadth", 
                mode: isLiveData ? "AUTO" : "MANUAL",
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "A/D Line", value: displayValue }, 
                details: [],
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: [], valueKey: "value", valueName: "A/D Line" }}
            insights={{ aiInsight: aiInsight, whyItMatters: ["Provides context on volume and market breadth.", "Crucial for confirming trend strength."] }}
            />
    );
}
