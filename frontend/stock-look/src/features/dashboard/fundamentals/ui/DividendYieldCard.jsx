import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { formatPercentage } from '@/shared/utils/formatters';
import { scoreDividendYield, generateAiInsightDividendYieldCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function DividendYieldCard({ data = null, manualOverride, lastUpdated }) {
    let upstoxYield = null;
    let sourceStr = 'Manual Override';
    
    // Attempt 1: Extract directly from key-ratios
    const ratiosArray = Array.isArray(data?.ratios) ? data.ratios : [];
    const divRatioObj = ratiosArray.find(r => r.name?.toLowerCase().includes('dividend yield') || r.name?.toLowerCase() === 'div yield');
    if (divRatioObj?.company_value) {
        const val = cleanNum(divRatioObj.company_value);
        if (!isNaN(val) && val > 0) {
            upstoxYield = val;
            sourceStr = 'Upstox API';
        }
    }

    // Attempt 2: Calculate from corporate actions and live price
    if (upstoxYield === null && Array.isArray(data?.corporate_actions) && data?.quote?.last_price) {
        const lastPrice = cleanNum(data.quote.last_price);
        if (lastPrice > 0) {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            
            let totalDividend = 0;
            data.corporate_actions.forEach(action => {
                if (action.name?.toLowerCase() === 'dividend' && action.expiry_date) {
                    const exDate = new Date(action.expiry_date);
                    if (!isNaN(exDate.getTime()) && exDate >= oneYearAgo && exDate <= new Date()) {
                        const amount = cleanNum(action.amount);
                        if (!isNaN(amount)) totalDividend += amount;
                    }
                }
            });

            if (totalDividend > 0) {
                upstoxYield = (totalDividend / lastPrice) * 100;
                sourceStr = 'Upstox (Calc)';
            }
        }
    }

    const isLiveData = upstoxYield !== null;
    const currentYield = isLiveData ? upstoxYield : (manualOverride !== undefined && manualOverride !== null && manualOverride !== '' ? cleanNum(manualOverride) : null);
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
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'),
                source: sourceStr,
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Dividend Yield', value: currentYield !== null && !isNaN(currentYield) ? formatPercentage(currentYield) : '--' },
                details: [
                    bondYield !== null && !isNaN(bondYield) && { label: '10Y Bond Yield', value: formatPercentage(bondYield), isManual: true }
                ].filter(Boolean),
                score: score ?? null,
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
