import React from 'react';

import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scoreNiftyPB, generateAiInsightNiftyPB } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function NiftyPBCard({ cardId, data, manualOverride, lastUpdated }) {
    // 1. Live Data Extraction (Upstox / NSE)
    const pbObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => ['p/b', 'pb', 'price to book'].includes(r.name?.toLowerCase()));
    let extractedValue = pbObj?.company_value ? cleanNum(pbObj.company_value) : null;

    let isManual = extractedValue === null || isNaN(extractedValue);
    
    const currentValue = isManual ? (manualOverride !== undefined && manualOverride !== null && manualOverride !== '' ? cleanNum(manualOverride) : null) : extractedValue;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.nifty_pb.id);

    // 3. Praxis Engine
    // Note: Most macro indicators just take a single value for scoring
    const scoreObj = scoreNiftyPB(currentValue);
    const { score, bias, trendDesc } = scoreObj;
    
    const cCard = computeCardConfidence({
        hasLiveData: !isManual,
        isManual: !!manualOverride && isManual,
        sourcePipeline: isManual ? 'manual' : 'upstox',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
    }, 'fundamentals');
    
    const aiInsightText = generateAiInsightNiftyPB(scoreObj, currentValue);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Nifty P/B',
                category: 'Valuation',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Nifty P/B', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + 'x' : currentValue + 'x') : '--' },
                details: [],
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Nifty P/B (x)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: ["Evaluates broad market book value.","Helps identify overvalued or undervalued indices."]
            }}
        />
    );
}
