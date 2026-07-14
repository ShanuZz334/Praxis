import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { generateAiInsightMACDTrendCard, scoreMACDHistogram } from '@/features/dashboard/fundamentals/engine/scoringEngine';
// ─── Main Component ─────────────────────────────────────────────────────────
export default function MACDTrendCard({ data, manualOverride, lastUpdated }) {
    const macdValue = (manualOverride !== undefined && manualOverride !== null && manualOverride !== '')
        ? cleanNum(manualOverride)
        : null;

    const configData = getIndicatorConfig('index_macd');
    const { score, bias, confidence, momentumDir, signalZone } = scoreMACDHistogram(macdValue);
    const aiInsight = generateAiInsightMACDTrendCard(macdValue, momentumDir, signalZone);

    return (
        <IndicatorCard
            config={{
                title: 'MACD Momentum',
                category: 'Market Health',
                mode: 'MANUAL',
                creditScore: configData?.creditScore ?? 7,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(false) : (lastUpdated || '--:--'),
                source: 'Manual',
                aiModel: configData?.aiModel ?? 'Engine v3'
            }}
            data={{
                currentValueObj: {
                    label: 'MACD Histogram',
                    value: macdValue !== null ? macdValue.toFixed(1) : '--'
                },
                details: [
                    macdValue !== null && {
                        label: 'Momentum',
                        value: momentumDir,
                        isManual: true
                    },
                    macdValue !== null && {
                        label: 'Signal Zone',
                        value: signalZone,
                        isManual: true
                    }
                ].filter(Boolean),
                score: score ?? 0,
                bias: bias ?? 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 7.0
            }}
            chartData={{ valueName: 'MACD Histogram' }}
            insights={{
                aiInsight,
                whyItMatters: [
                    'MACD Histogram = MACD Line − Signal Line; measures momentum acceleration, not just direction.',
                    'Zero-line crossovers are the most significant events — they signal major trend changes.',
                    'A rising histogram above zero = bulls are accelerating; falling = momentum is weakening.',
                    'For Nifty/BankNifty, use daily MACD(12,26,9); histogram range typically ±50–500.',
                    'Histogram divergence with price (price rising but histogram falling) is a powerful warning signal.'
                ]
            }}
        />
    );
}
