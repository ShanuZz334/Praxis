import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scoreVwapCard } from '../engine/TechnicalCompositeEngine';

export default function VwapCard({ cardId, data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig('vwap');
    
    // Resolve current value from live backend data
    const currentValue = data?.vwap ?? null;

    const { score, bias, confidence, aiInsight } = scoreVwapCard(currentValue, data?.current_price);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? "₹" + parseFloat(currentValue).toFixed(2) : '--';
return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: "VWAP",
                category: "Volume Analysis",
                mode: "AUTO",
                creditScore: configData.creditScore,
                updateTime: lastUpdated ?? "--:--",
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "Current VWAP", value: displayValue },
                details: [],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{
                points: data?.history || [],
                valueKey: "value",
                valueName: "VWAP"
            }}
            insights={{
                aiInsight: aiInsight,
                whyItMatters: ["Provides context on volume and market breadth.", "Crucial for confirming trend strength."] }}
            />
    );
}


