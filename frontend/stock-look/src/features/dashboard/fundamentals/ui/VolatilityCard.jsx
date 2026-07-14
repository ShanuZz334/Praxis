import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { generateAiInsightVolatilityCard, scoreVIX } from '@/features/dashboard/fundamentals/engine/scoringEngine';
// ─── Main Component ─────────────────────────────────────────────────────────
export default function VolatilityCard({ data, manualOverride, lastUpdated }) {
    const vixValue = (manualOverride !== undefined && manualOverride !== null && manualOverride !== '')
        ? cleanNum(manualOverride)
        : null;

    const configData = getIndicatorConfig('india_vix');
    const { score, bias, confidence, vixRegime, marketCondition } = scoreVIX(vixValue);
    const aiInsight = generateAiInsightVolatilityCard(vixValue, vixRegime, marketCondition);

    return (
        <IndicatorCard
            config={{
                title: 'India VIX',
                category: 'Market Health',
                mode: 'MANUAL',
                creditScore: configData?.creditScore ?? 9,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(false) : (lastUpdated || '--:--'),
                source: 'Manual',
                aiModel: configData?.aiModel ?? 'Engine v3'
            }}
            data={{
                currentValueObj: {
                    label: 'VIX Level',
                    value: vixValue !== null ? vixValue.toFixed(2) : '--'
                },
                details: [
                    vixValue !== null && {
                        label: 'VIX Regime',
                        value: vixRegime,
                        isManual: true
                    },
                    vixValue !== null && {
                        label: 'Market Condition',
                        value: marketCondition,
                        isManual: true
                    }
                ].filter(Boolean),
                score: score ?? 0,
                bias: bias ?? 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 9.0
            }}
            chartData={{ valueName: 'VIX Level' }}
            insights={{
                aiInsight,
                whyItMatters: [
                    'India VIX measures expected near-term market volatility derived from Nifty 50 option prices.',
                    'A rising VIX signals fear and uncertainty — institutional players paying more for portfolio insurance.',
                    'VIX below 14 historically provides the best risk-reward environment for long positions.',
                    'VIX spikes above 25 have historically coincided with significant Nifty corrections of 5–15%.',
                    'Extreme VIX above 35 often marks panic-driven capitulation bottoms — contrarian buy signals for long-term investors.'
                ]
            }}
        />
    );
}
