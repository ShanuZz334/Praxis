import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function MarketCapGDPCard({ data = null, manualOverride, lastUpdated }) {
    // Market Cap to GDP (Buffett Indicator) is a macro-economic indicator.
    // Upstox API v2 provides stock-specific ratios, so this must be 100% manual.
    const currentRatio = manualOverride ? parseFloat(manualOverride) : null;
    const isManual = true;

    // Centralized Config
    const configData = getIndicatorConfig('market_cap_gdp');

    // --- Scoring Logic ---
    let score          = 0;
    let bias           = 'Neutral';
    const confidence   = '90%';
    let aiInsightText  = 'Awaiting manual entry of the current Market Cap to GDP ratio.';

    if (currentRatio !== null && !isNaN(currentRatio)) {
        if (currentRatio < 80) {
            score = 95; bias = 'Strong Bullish';
            aiInsightText = `At ${currentRatio}%, the overall market appears attractively valued relative to the economy (Undervalued).`;
        } else if (currentRatio < 100) {
            score = 82; bias = 'Bullish';
            aiInsightText = `At ${currentRatio}%, market valuation remains broadly aligned with economic output (Fairly Valued).`;
        } else if (currentRatio <= 120) {
            score = 60; bias = 'Neutral';
            aiInsightText = `At ${currentRatio}%, the market is fully valued compared to historical norms.`;
        } else if (currentRatio <= 150) {
            score = 30; bias = 'Bearish';
            aiInsightText = `At ${currentRatio}%, market valuations are elevated compared to the size of the economy (Overvalued).`;
        } else {
            score = 10; bias = 'Strong Bearish';
            aiInsightText = `At ${currentRatio}%, the market appears historically expensive and carries elevated valuation risk (Significantly Overvalued).`;
        }
    }

    return (
        <IndicatorCard
            config={{
                title: 'Market Cap to GDP',
                category: 'Market Health',
                mode: 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: 'Manual Override',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Market Cap / GDP (%)', value: currentRatio !== null ? currentRatio : '--' },
                details: [],
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Ratio (%)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Buffett indicator for overall market valuation.',
                    'Shows if the stock market is overvalued or undervalued relative to the economy.',
                    'Long-term mean reversion indicator.'
                ]
            }}
        />
    );
}
