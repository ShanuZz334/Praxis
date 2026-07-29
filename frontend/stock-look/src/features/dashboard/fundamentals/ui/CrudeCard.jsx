import React from 'react';

import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scoreCrudeOil, generateAiInsightCrudeOil } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function CrudeCard({ cardId, data, manualOverride, lastUpdated }) {
    // 1. Core State & Extraction
    const hasLiveData = data?.crude !== undefined && data?.crude !== null;
    let isManual = !hasLiveData;
    let extractedValue = hasLiveData ? cleanNum(data.crude) : null;
    
    const currentValue = isManual ? (manualOverride !== undefined && manualOverride !== null && manualOverride !== '' ? cleanNum(manualOverride) : null) : extractedValue;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.crude.id);

    // 3. Praxis Engine
    // Note: Most macro indicators just take a single value for scoring
    const scoreObj = scoreCrudeOil(currentValue);
    const { score, bias, trendDesc } = scoreObj;
    
    const cCard = computeCardConfidence({
        hasLiveData: !isManual,
        isManual: !!manualOverride && isManual,
        sourcePipeline: isManual ? 'manual' : 'upstox',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
    }, 'fundamentals');
    
    const aiInsightText = generateAiInsightCrudeOil(scoreObj, currentValue);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Crude Oil',
                category: 'Global',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Price', value: currentValue !== null ? (typeof currentValue === 'number' ? '$' + currentValue.toFixed(2) : '$' + currentValue) : '--' },
                details: [],
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Price ($)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: ["Measures energy costs.","High crude hurts import-dependent economies."]
            }}
        />
    );
}

