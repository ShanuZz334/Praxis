import React from 'react';

import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scoreCPIInflation, generateAiInsightCPIInflation } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function CPICard({ cardId, data, manualOverride, lastUpdated }) {
    // 1. Core State & Extraction
    let isManual = true;
    let extractedValue = null;

    // 1. Live Data Extraction (FRED)
    if (data?.cpiInflation !== undefined && data?.cpiInflation !== null) {
        extractedValue = data.cpiInflation;
        isManual = false;
    }
    const currentValue = isManual ? (manualOverride !== undefined && manualOverride !== null && manualOverride !== '' ? cleanNum(manualOverride) : null) : extractedValue;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.cpi.id);

    // 3. Praxis Engine
    // Note: Most macro indicators just take a single value for scoring
    const scoreObj = scoreCPIInflation(currentValue);
    const { score, bias, trendDesc } = scoreObj;
    
    const cCard = computeCardConfidence({
        hasLiveData: !isManual,
        isManual: !!manualOverride && isManual,
        sourcePipeline: isManual ? 'manual' : 'upstox',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
    }, 'fundamentals');
    
    const aiInsightText = generateAiInsightCPIInflation(scoreObj, currentValue);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'CPI Inflation',
                category: 'Macro',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Inflation', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + '%' : currentValue + '%') : '--' },
                details: [],
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Inflation (%)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: ["Measures consumer price changes.","High inflation reduces real returns."]
            }}
        />
    );
}
