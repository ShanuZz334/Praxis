import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { generateAiInsightIndexPCRCard, scorePCR } from '@/features/dashboard/fundamentals/engine/scoringEngine';
// ─── Main Component ─────────────────────────────────────────────────────────
export default function IndexPCRCard({ data, manualOverride, lastUpdated }) {
    const livePcr = data?.index_pcr;
    const isLive = livePcr !== undefined && livePcr !== null && livePcr !== '';

    const pcrValue = isLive
        ? cleanNum(livePcr)
        : (manualOverride !== undefined && manualOverride !== null && manualOverride !== '')
            ? cleanNum(manualOverride)
            : null;

    const configData = getIndicatorConfig('index_pcr');
    const { score, bias, confidence, optionsBias, signalStrength } = scorePCR(pcrValue);
    const aiInsight = generateAiInsightIndexPCRCard(pcrValue, optionsBias, signalStrength);

    return (
        <IndicatorCard
            config={{
                title: 'Put-Call Ratio',
                category: 'Market Health',
                mode: isLive ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore ?? 8,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLive) : (lastUpdated || '--:--'),
                source: isLive ? 'Upstox API' : 'Manual',
                aiModel: configData?.aiModel ?? 'Engine v3'
            }}
            data={{
                currentValueObj: {
                    label: 'PCR',
                    value: pcrValue !== null ? pcrValue.toFixed(2) : '--'
                },
                details: [
                    pcrValue !== null && {
                        label: 'Options Bias',
                        value: optionsBias,
                        isManual: !isLive
                    },
                    pcrValue !== null && {
                        label: 'Signal Strength',
                        value: signalStrength,
                        isManual: !isLive
                    }
                ].filter(Boolean),
                score: score ?? 0,
                bias: bias ?? 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 7.0
            }}
            chartData={{ valueName: 'PCR' }}
            insights={{
                aiInsight,
                whyItMatters: [
                    'PCR is a contrarian indicator — extreme fear (high PCR) often signals a bottom, extreme greed (low PCR) often signals a top.',
                    'Measures the ratio of Put Open Interest to Call Open Interest on NSE index options.',
                    'PCR above 1.5 has historically been one of the most reliable bottom signals for Nifty.',
                    'PCR below 0.6 signals excessive bullish complacency — a setup for potential sharp corrections.',
                    'Best used in conjunction with VIX and price action to confirm reversal setups.'
                ]
            }}
        />
    );
}
