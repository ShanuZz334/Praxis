import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function BetaCorrelationCard({ data, lastUpdated }) {
    // Expecting data: { beta: 1.2, correlation: 0.85 }
    const beta = data?.beta ?? null;
    const correlation = data?.correlation ?? null;

    let score = null;
    let bias = 'Neutral';

    if (beta !== null) {
        if (beta > 1.2) { score = 80; bias = 'Bullish'; } // High beta (risk on)
        else if (beta < 0.8) { score = 40; bias = 'Bearish'; } // Low beta (defensive)
        else { score = 50; }
    }

    const configData = getIndicatorConfig('beta_correlation') || { creditScore: 5, impactWeight: 3.0, aiModel: 'Engine v2' };

    return (
        <IndicatorCard
            config={{
                title: 'Beta (vs Nifty)',
                category: 'Trend',
                mode: 'AUTO', // Assuming calculated from price history
                creditScore: configData.creditScore,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(beta !== null) : (lastUpdated || '--:--'),
                source: 'System',
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: 'Beta', value: beta !== null ? beta.toFixed(2) : '--' },
                details: [
                    correlation !== null && { label: 'Correlation', value: correlation.toFixed(2), isManual: false },
                ].filter(Boolean),
                score: score,
                bias: bias,
                confidence: '95%',
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: [], valueKey: 'value', valueName: 'Beta' }}
            insights={{
                aiInsight: 'Beta measures the volatility of the asset compared to the Nifty 50.',
                whyItMatters: [
                    'Beta > 1 means the stock is more volatile than the index (outperforms in bull markets).',
                    'Beta < 1 means it is less volatile (defensive in bear markets).',
                    'Correlation shows how closely the stock moves with the index (1.0 = perfect lockstep).'
                ]
            }}
        />
    );
}
