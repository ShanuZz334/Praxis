import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

import { scoreObvCard } from '../engine/TechnicalCompositeEngine';

export default function ObvCard({ cardId, data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.obv.id);
    
    // Resolve current value from live backend data
    const currentValue = data?.obv ?? null;

    const { score, bias, confidence, aiInsight } = scoreObvCard(data?.obv, data?.obv_sma);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(currentValue) : '--';
return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: "On-Balance Volume (OBV)",
                category: "Volume Analysis",
                mode: "AUTO",
                creditScore: configData.creditScore,
                updateTime: lastUpdated ?? "--:--",
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "Current OBV", value: displayValue },
                details: [],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{
                points: data?.history || [],
                valueKey: "value",
                valueName: "OBV"
            }}
            insights={{
                aiInsight: aiInsight,
                whyItMatters: ["Provides context on volume and market breadth.", "Crucial for confirming trend strength."] }}
            />
    );
}
