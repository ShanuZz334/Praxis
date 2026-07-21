import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { formatPercentage } from '@/shared/utils/formatters';
import { scoreGDPGrowth, generateAiInsightGDPGrowthCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function GDPGrowthCard({ cardId, data = null, manualOverride, lastUpdated }) {
    // 1. Core State (100% Manual Macro Indicator)
    const isManual = true;
    const currentGrowth = manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? cleanNum(manualOverride) 
        : null;

    // 2. Load Central Config
    const configData = getIndicatorConfig('gdp_growth');

    // 3. Praxis Engine
    const { score, bias, confidence, trendDesc } = scoreGDPGrowth(currentGrowth);
    const aiInsightText = generateAiInsightGDPGrowthCard(currentGrowth, trendDesc);

        return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'GDP Growth',
                category: 'Growth',
                mode: 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: 'Manual (Macro)',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'GDP Growth', value: currentGrowth !== null && !isNaN(currentGrowth) ? formatPercentage(currentGrowth) : '--' },
                details: [
                    currentGrowth !== null && !isNaN(currentGrowth) && { label: 'GDP Regime', value: trendDesc, isManual: false }
                ].filter(Boolean),
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: confidence,
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
