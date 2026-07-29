import React from 'react';

import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scoreNiftyDividendYield, generateAiInsightNiftyDividendYield } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function IndexDividendYieldCard({ cardId, data, manualOverride, lastUpdated }) {
    // 1. Live Data Extraction (Upstox / NSE)
    const dyObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => ['dividend yield', 'div yield', 'dividend_yield', 'div_yield'].includes(r.name?.toLowerCase()));
    let extractedValue = dyObj?.company_value ? cleanNum(dyObj.company_value) : null;

    let isManual = extractedValue === null || isNaN(extractedValue);
    
    const currentValue = isManual ? (manualOverride !== undefined && manualOverride !== null && manualOverride !== '' ? cleanNum(manualOverride) : null) : extractedValue;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.dividend_yield.id);

    // 3. Praxis Engine
    // Note: Most macro indicators just take a single value for scoring
    const scoreObj = scoreNiftyDividendYield(currentValue);
    const { score, bias, trendDesc } = scoreObj;
    
    const cCard = computeCardConfidence({
        hasLiveData: !isManual,
        isManual: !!manualOverride && isManual,
        sourcePipeline: isManual ? 'manual' : 'upstox',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
    }, 'fundamentals');
    
    const aiInsightText = generateAiInsightNiftyDividendYield(scoreObj, currentValue);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Dividend Yield',
                category: 'Valuation',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Yield', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + '%' : currentValue + '%') : '--' },
                details: [],
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Yield (%)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: ["Measures cash returns from the index.","Higher yield provides downside protection."]
            }}
        />
    );
}
