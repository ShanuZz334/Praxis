import React from 'react';

import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scoreNiftyPE, generateAiInsightNiftyPE } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function NiftyPECard({ data, manualOverride, lastUpdated }) {
    // 1. Live Data Extraction (Upstox / NSE)
    const peObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => ['p/e', 'pe', 'pe ratio'].includes(r.name?.toLowerCase()));
    let extractedValue = peObj?.company_value ? cleanNum(peObj.company_value) : null;

    let isManual = extractedValue === null || isNaN(extractedValue);
    
    const currentValue = isManual ? (manualOverride !== undefined && manualOverride !== null && manualOverride !== '' ? cleanNum(manualOverride) : null) : extractedValue;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.nifty_pe.id);

    // 3. Praxis Engine
    // Note: Most macro indicators just take a single value for scoring
    const scoreObj = scoreNiftyPE(currentValue);
    const { score, bias, trendDesc } = scoreObj;
    
    const cCard = computeCardConfidence({
        hasLiveData: !isManual,
        isManual: !!manualOverride && isManual,
        sourcePipeline: isManual ? 'manual' : 'upstox',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
    }, 'fundamentals');
    
    const aiInsightText = generateAiInsightNiftyPE(scoreObj, currentValue);

    return (
        <IndicatorCard
            cardId="nifty_pe"
            config={{
                title: 'Nifty P/E',

                category: 'Valuation',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Nifty P/E', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + 'x' : currentValue + 'x') : '--' },
                details: [],
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Nifty P/E (x)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: ["Evaluates broad market valuation.","Compares current price to earnings."]
            }}
        />
    );
}
