import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scoreSupportCard } from '../engine/TechnicalCompositeEngine';

export default function SupportCard({ cardId, data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig('support');
    
    const liveValue = data?.support ?? null;
    const isManual = liveValue === null && manualOverride !== null && manualOverride !== undefined;
    const currentValue = liveValue ?? manualOverride ?? null;
    const currentPrice = data?.current_price ?? null;

    const { score, bias, confidence, aiInsight } = scoreSupportCard(currentValue, currentPrice);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? "₹" + parseFloat(currentValue).toFixed(2) : '--';
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Support Level", 
                category: "Market Structure", 
                mode: isManual ? "MANUAL" : "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Support", value: displayValue, isManual }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: [], valueKey: "value", valueName: "Support Score" }}
            insights={{ aiInsight: aiInsight, whyItMatters: ["Support represents a structural floor where buyers previously stepped in.", "A breakdown below support signals a structural shift to the downside."] }}
            />
    );
}
