import React from 'react';

import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scoreDIIFlow, generateAiInsightDIIFlow } from '@/features/dashboard/fundamentals/engine/scoringEngine';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

export default function DIICard({ cardId, data, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    // 1. Core State & Extraction
    let isManual = true;
    let extractedValue = null;

    // 1. Live Data Extraction (NSE)
    if (data?.liquidity?.dii_net !== undefined && data?.liquidity?.dii_net !== null) {
        extractedValue = data.liquidity.dii_net;
        isManual = false;
    }
    const currentValue = isManual ? (manualOverride !== undefined && manualOverride !== null && manualOverride !== '' ? cleanNum(manualOverride) : null) : extractedValue;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.dii.id);

    // 3. Praxis Engine
    const scoreObj = applyModeAdjustment(scoreDIIFlow(currentValue), 'dii_flow', tradingMode);
    const { score, bias, trendDesc } = scoreObj;
    
    const cCard = computeCardConfidence({
        hasLiveData: !isManual,
        isManual: !!manualOverride && isManual,
        sourcePipeline: isManual ? 'manual' : 'upstox',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
    }, 'fundamentals');
    
    const aiInsightText = generateAiInsightDIIFlow(scoreObj, currentValue);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'DII Flow',
                category: 'Liquidity',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Flow', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + ' Cr' : currentValue + ' Cr') : '--' },
                details: [],
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Flow (Cr)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: ["Measures domestic institutional buying.","Provides strong support during FII selloffs."]
            }}
        />
    );
}
