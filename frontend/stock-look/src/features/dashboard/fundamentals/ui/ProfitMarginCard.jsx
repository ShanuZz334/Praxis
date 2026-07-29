import React from 'react';

import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scoreAggregateProfitMargin, generateAiInsightAggregateProfitMargin } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function ProfitMarginCard({ cardId, data, manualOverride, lastUpdated }) {
    // 1. Core State & Extraction
    let isManual = true;
    let extractedValue = null;

    // Attempt to extract live data from Upstox
    if (data?.income?.income_statement) {
        const statements = data.income.income_statement;
        const netProfitObj = statements.find(s => s.category === 'net_profit');
        const revenueObj = statements.find(s => s.category === 'revenue');
        
        if (netProfitObj && revenueObj && netProfitObj.history?.[0] && revenueObj.history?.[0]) {
            const netProfit = netProfitObj.history[0].value;
            const revenue = revenueObj.history[0].value;
            if (revenue !== 0) {
                extractedValue = (netProfit / revenue) * 100;
                isManual = false;
            }
        }
    }
    
    const currentValue = isManual ? (manualOverride !== undefined && manualOverride !== null && manualOverride !== '' ? cleanNum(manualOverride) : null) : extractedValue;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.profit_margin.id);

    // 3. Praxis Engine
    // Note: Most macro indicators just take a single value for scoring
    const scoreObj = scoreAggregateProfitMargin(currentValue);
    const { score, bias, trendDesc } = scoreObj;
    
    const cCard = computeCardConfidence({
        hasLiveData: !isManual,
        isManual: !!manualOverride && isManual,
        sourcePipeline: isManual ? 'manual' : 'upstox',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
    }, 'fundamentals');
    
    const aiInsightText = generateAiInsightAggregateProfitMargin(scoreObj, currentValue);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Profit Margin',
                category: 'Earnings',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Margin', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) + '%' : currentValue + '%') : '--' },
                details: [],
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Margin (%)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: ["Measures corporate efficiency.","Higher margins buffer against inflation."]
            }}
        />
    );
}
