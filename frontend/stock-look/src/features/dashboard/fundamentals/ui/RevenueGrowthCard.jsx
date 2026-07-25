import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scoreRevenueGrowth, generateAiInsightRevenueGrowthCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function RevenueGrowthCard({ cardId, data = null, manualOverride, lastUpdated }) {
    // 1. Extract Revenue History
    const incomeStmt = Array.isArray(data?.income?.income_statement) ? data.income.income_statement : [];
    const fullStmt = Array.isArray(data?.income?.full_statement) ? data.income.full_statement : [];
    
    let revObj = incomeStmt.find(m => m.category === 'revenue' && Array.isArray(m.history) && m.history.length >= 2);
    if (!revObj) {
        revObj = fullStmt.find(m => m.particular === 'Total Revenue' && Array.isArray(m.history) && m.history.length >= 2);
    }

    let revenueHistory = null;
    if (revObj && Array.isArray(revObj.history) && revObj.history.length > 0) {
        revenueHistory = revObj.history;
    }

    const isManual = !revenueHistory || revenueHistory.length < 2;
    const manualCAGR = isManual && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? cleanNum(manualOverride) 
        : null;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.revenue_growth.id);

    // 3. Praxis Engine
    const { score, bias, calculatedCAGR, latestRevenue, previousRevenue, trendDesc } = scoreRevenueGrowth(revenueHistory, manualCAGR);
    const cCard = computeCardConfidence({
        hasLiveData: !isManual,
        isManual: !!manualOverride && isManual,
        sourcePipeline: isManual ? 'Manual' : 'Upstox Income Stmt',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
    }, 'fundamentals');
    const aiInsightText = generateAiInsightRevenueGrowthCard(revenueHistory, calculatedCAGR, trendDesc);

        return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Revenue Growth',
                category: 'Growth',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox Income Stmt',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'CAGR (%)', value: calculatedCAGR !== null ? calculatedCAGR.toFixed(2) + '%' : '--' },
                details: [
                    { label: 'Latest Revenue', value: latestRevenue !== null ? latestRevenue : '--', isManual: isManual },
                    { label: 'Previous Revenue', value: previousRevenue !== null ? previousRevenue : '--', isManual: isManual }
                ],
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: revenueHistory ? [...revenueHistory].reverse().map(h => ({ name: h.period, value: h.value })) : [],
                valueKey: 'value',
                valueName: 'Revenue'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Measures top-line growth.',
                    'Indicates market demand and expansion.',
                    'First step to achieving profitability.'
                ]
            }}
        />
    );
}
