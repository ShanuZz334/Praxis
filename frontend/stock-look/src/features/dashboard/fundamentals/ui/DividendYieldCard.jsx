import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { formatPercentage } from '@/shared/utils/formatters';
import { scoreDividendYield, generateAiInsightDividendYieldCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function DividendYieldCard({ data = null, manualOverride, lastUpdated }) {
    // Upstox API v2 does not provide Dividend Yield in its Key Ratios endpoint.
    // It must be manually provided.
    const isManual = true;

    // 1. Core State
    const currentYield = manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? cleanNum(manualOverride) : null;
    

        
    const bondYield = data?.manualBondYield !== undefined && data?.manualBondYield !== null && data?.manualBondYield !== '' 
        ? cleanNum(data.manualBondYield) : null;

    // 2. Load Central Config
    const configData = getIndicatorConfig('dividend_yield');

    // 3. Praxis Engine Variables
    const { score, bias, confidence } = scoreDividendYield(currentYield, bondYield);
    const aiInsightText = generateAiInsightDividendYieldCard(currentYield, bondYield);

        return (
        <IndicatorCard
            config={{
                title: 'Dividend Yield',
                category: 'Market Health',
                mode: 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: 'Manual Override',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Dividend Yield', value: currentYield !== null && !isNaN(currentYield) ? formatPercentage(currentYield) : '--' },
                details: [
                    bondYield !== null && !isNaN(bondYield) && { label: '10Y Bond Yield', value: formatPercentage(bondYield), isManual: true }
                ].filter(Boolean),
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Yield (%)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Measures income generated relative to stock price.',
                    'Provides downside protection in bear markets.',
                    'Indicator of mature, stable companies.'
                ]
            }}
        />
    );
}
