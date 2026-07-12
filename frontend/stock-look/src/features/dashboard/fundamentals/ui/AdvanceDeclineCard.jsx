import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { generateAiInsightAdvanceDeclineCard, scoreADRatio } from '@/features/dashboard/fundamentals/engine/scoringEngine';
// ─── Main Component ─────────────────────────────────────────────────────────
export default function AdvanceDeclineCard({ data, manualOverride, lastUpdated }) {
    const adRatio = (manualOverride !== undefined && manualOverride !== null && manualOverride !== '')
        ? parseFloat(manualOverride)
        : null;

    const configData = getIndicatorConfig('advance_decline');
    const { score, bias, confidence, breadthZone, signalType } = scoreADRatio(adRatio);
    const aiInsight = generateAiInsightAdvanceDeclineCard(adRatio, bias, breadthZone, signalType);

    return (
        <IndicatorCard
            config={{
                title: 'Advance / Decline',
                category: 'Market Health',
                mode: 'MANUAL',
                creditScore: configData?.creditScore ?? 8,
                updateTime: lastUpdated ?? '--:--',
                source: 'Manual',
                aiModel: configData?.aiModel ?? 'Engine v3'
            }}
            data={{
                currentValueObj: {
                    label: 'A/D Ratio',
                    value: adRatio !== null ? adRatio.toFixed(2) : '--'
                },
                details: [
                    adRatio !== null && {
                        label: 'Breadth Zone',
                        value: breadthZone,
                        isManual: true
                    },
                    adRatio !== null && {
                        label: 'Signal Type',
                        value: signalType,
                        isManual: true
                    }
                ].filter(Boolean),
                score: score ?? 0,
                bias: bias ?? 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 7.0
            }}
            chartData={{ valueName: 'A/D Ratio' }}
            insights={{
                aiInsight,
                whyItMatters: [
                    'Breadth analysis reveals whether the full index or just a few large caps are driving moves.',
                    'A rising index with falling A/D ratio signals hidden internal weakness — a classic divergence warning.',
                    'Extreme A/D readings (>2.0 or <0.5) are contrarian indicators for short-term reversals.',
                    'Strong breadth (A/D > 1.2) on breakouts confirms institutional participation across the market.',
                    'Breadth deterioration often precedes a major index correction by several weeks.'
                ]
            }}
        />
    );
}
