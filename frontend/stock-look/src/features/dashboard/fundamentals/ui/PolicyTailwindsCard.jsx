import React from 'react';

import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scorePolicyTailwinds, generateAiInsightPolicyTailwinds } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function PolicyTailwindsCard({ cardId, data, manualOverride, lastUpdated }) {
    // 1. Core State & Extraction
    // Policy Tailwinds is a purely qualitative metric. It will permanently remain in manual override mode.
    const isManual = true;
    
    const currentValue = manualOverride !== undefined && manualOverride !== null && manualOverride !== '' ? cleanNum(manualOverride) : null;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.policy_tailwinds.id);

    // 3. Praxis Engine
    // Note: Most macro indicators just take a single value for scoring
    const scoreObj = scorePolicyTailwinds(currentValue);
    const { score, bias, trendDesc } = scoreObj;
    
    const cCard = computeCardConfidence({
        hasLiveData: !isManual,
        isManual: !!manualOverride && isManual,
        sourcePipeline: isManual ? 'manual' : 'upstox',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
    }, 'fundamentals');
    
    const aiInsightText = generateAiInsightPolicyTailwinds(scoreObj, currentValue);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Policy Tailwinds',
                category: 'Corporate',
                mode: 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: 'Manual',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Score', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--' },
                details: [],
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Score'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: ["Measures government support.","Strong tailwinds boost sector growth."]
            }}
        />
    );
}
