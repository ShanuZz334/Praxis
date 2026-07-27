import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { formatPercentage } from '@/shared/utils/formatters';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scoreGDPGrowth, generateAiInsightGDPGrowthCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function GDPGrowthCard({ cardId, data = null, manualOverride, lastUpdated }) {
    // 1. Core State
    const liveGrowthData = data?.gdp_growth;
    const isLive = liveGrowthData !== undefined && liveGrowthData !== null;
    const isManual = !isLive && manualOverride !== undefined && manualOverride !== null && manualOverride !== '';

    const currentGrowth = isLive 
        ? cleanNum(liveGrowthData)
        : isManual 
            ? cleanNum(manualOverride) 
            : null;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.gdp_growth.id);

    // 3. Praxis Engine
    const { score, bias, trendDesc } = scoreGDPGrowth(currentGrowth);
    
    const cCard = computeCardConfidence({
        hasLiveData: isLive,
        isManual: isManual,
        sourcePipeline: isLive ? 'FRED API' : 'Manual',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(isLive) : (lastUpdated || '--:--')
    }, 'fundamentals');
    const aiInsightText = generateAiInsightGDPGrowthCard(currentGrowth, trendDesc);

        return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'GDP Growth',
                category: 'Growth',
                mode: isLive ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLive) : (lastUpdated || '--:--'),
                source: isLive ? 'FRED API' : 'Manual',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'GDP Growth', value: currentGrowth !== null && !isNaN(currentGrowth) ? formatPercentage(currentGrowth) : '--' },
                details: [
                    currentGrowth !== null && !isNaN(currentGrowth) && { label: 'GDP Regime', value: trendDesc, isManual: false }
                ].filter(Boolean),
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Growth (%)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Measures overall macroeconomic health.',
                    'Drives top-line revenue for most sectors.',
                    'Influences monetary policy decisions.'
                ]
            }}
        />
    );
}
