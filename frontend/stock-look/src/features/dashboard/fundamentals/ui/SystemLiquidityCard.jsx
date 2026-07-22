import React from 'react';

import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { scoreSystemLiquidity, generateAiInsightSystemLiquidity } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function SystemLiquidityCard({ cardId, data, manualOverride, lastUpdated }) {
    // 1. Core State & Extraction
    let isManual = true;
    let extractedValue = null;

    // TODO: Extract live data from 'data' object if Upstox ever supports these metrics.
    
    const currentValue = isManual ? (manualOverride !== undefined && manualOverride !== null && manualOverride !== '' ? cleanNum(manualOverride) : null) : extractedValue;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.system_liquidity.id);

    // 3. Praxis Engine
    // Note: Most macro indicators just take a single value for scoring
    const scoreObj = scoreSystemLiquidity(currentValue);
    const { score, bias, confidence, trendDesc } = scoreObj;
    const aiInsightText = generateAiInsightSystemLiquidity(scoreObj, currentValue);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'System Liquidity',
                category: 'Liquidity',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Surplus (LCr)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--' },
                details: [],
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Surplus (LCr)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: ["Measures banking system cash.","Surplus liquidity drives asset prices."]
            }}
        />
    );
}
