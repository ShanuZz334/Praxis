import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

import { scoreCmfCard } from '../engine/TechnicalCompositeEngine';

export default function CmfCard({ cardId, data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.cmf.id);
    
    // Resolve current value from live backend data, fallback to manual
    const liveValue = data?.cmf ?? null;
    const isManual = liveValue === null && manualOverride !== null && manualOverride !== undefined;
    const currentValue = liveValue ?? manualOverride ?? null;

    const { score, bias, confidence, aiInsight } = scoreCmfCard(currentValue);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? parseFloat(currentValue).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: "Chaikin Money Flow",
                category: "Volume Analysis",
                mode: isManual ? "MANUAL" : "AUTO",
                creditScore: configData.creditScore,
                updateTime: lastUpdated ?? "--:--",
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "Current CMF", value: displayValue, isManual },
                details: [],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{
                points: data?.history || [],
                valueKey: "value",
                valueName: "CMF"
            }}
            insights={{
                aiInsight: aiInsight,
                whyItMatters: ["Provides context on volume and market breadth.", "Crucial for confirming trend strength."] }}
            />
    );
}
