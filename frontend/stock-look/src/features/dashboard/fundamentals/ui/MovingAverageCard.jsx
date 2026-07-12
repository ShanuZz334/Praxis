import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { generateAiInsightMovingAverageCard, scoreDMA200 } from '@/features/dashboard/fundamentals/engine/scoringEngine';
// ─── Main Component ─────────────────────────────────────────────────────────
export default function MovingAverageCard({ data, manualOverride, lastUpdated }) {
    const dmaDistance = (manualOverride !== undefined && manualOverride !== null && manualOverride !== '')
        ? parseFloat(manualOverride)
        : null;

    const configData = getIndicatorConfig('index_200dma');
    const { score, bias, confidence, dmaPosition, distanceCategory } = scoreDMA200(dmaDistance);
    const aiInsight = generateAiInsightMovingAverageCard(dmaDistance, dmaPosition, distanceCategory);

    return (
        <IndicatorCard
            config={{
                title: '200 DMA Stretch',
                category: 'Market Health',
                mode: 'MANUAL',
                creditScore: configData?.creditScore ?? 9,
                updateTime: lastUpdated ?? '--:--',
                source: 'Manual',
                aiModel: configData?.aiModel ?? 'Engine v3'
            }}
            data={{
                currentValueObj: {
                    label: '% from 200 DMA',
                    value: dmaDistance !== null ? `${dmaDistance > 0 ? '+' : ''}${dmaDistance.toFixed(2)}%` : '--'
                },
                details: [
                    dmaDistance !== null && {
                        label: 'DMA Position',
                        value: dmaPosition,
                        isManual: true
                    },
                    dmaDistance !== null && {
                        label: 'Distance Category',
                        value: distanceCategory,
                        isManual: true
                    }
                ].filter(Boolean),
                score: score ?? 0,
                bias: bias ?? 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 9.0
            }}
            chartData={{ valueName: '% Distance from 200 DMA' }}
            insights={{
                aiInsight,
                whyItMatters: [
                    'The 200 DMA is the definitive line separating long-term bull and bear markets for global indices.',
                    'Being above a rising 200 DMA is the single most reliable indicator of a structural bull market.',
                    'Nifty has shown strong mean-reversion tendency when >+18% above the 200 DMA.',
                    'A golden cross (50 DMA crossing above 200 DMA) combined with price >200 DMA is the strongest buy signal.',
                    'Institutional managers globally use the 200 DMA as the primary long-term portfolio positioning indicator.'
                ]
            }}
        />
    );
}
