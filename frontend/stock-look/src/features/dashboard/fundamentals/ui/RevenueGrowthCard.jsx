import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { scoreRevenueGrowth, generateAiInsightRevenueGrowthCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function RevenueGrowthCard({ data = null, manualOverride, lastUpdated }) {
    // 1. Extract Revenue History
    const incomeArray = Array.isArray(data?.income) 
        ? data.income 
        : (Array.isArray(data?.income?.full_statement) ? data.income.full_statement : []);
    const revObj = incomeArray.find(m => {
        const p = m.particular?.toLowerCase() || '';
        const hasHistory = Array.isArray(m.history) && m.history.length >= 2;
        return hasHistory && (p === 'total revenue' || p === 'revenue' || p.includes('revenue') || p.includes('sales'));
    });

    let revenueHistory = null;
    if (revObj && Array.isArray(revObj.history) && revObj.history.length > 0) {
        revenueHistory = revObj.history;
    }

    const isManual = !revenueHistory || revenueHistory.length < 2;
    const manualCAGR = isManual && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? parseFloat(manualOverride) 
        : null;

    // 2. Load Central Config
    const configData = getIndicatorConfig('revenue_growth');

    // 3. Praxis Engine
    const { score, bias, confidence, calculatedCAGR, latestRevenue, previousRevenue, trendDesc } = scoreRevenueGrowth(revenueHistory, manualCAGR);
    const aiInsightText = generateAiInsightRevenueGrowthCard(revenueHistory, calculatedCAGR, trendDesc);

        return (
        <IndicatorCard
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
                currentValueObj: { label: 'CAGR (%)', value: calculatedCAGR !== null ? calculatedCAGR.toFixed(2) : '--' },
                details: [
                    { label: 'Latest Revenue', value: latestRevenue !== null ? latestRevenue : '--', isManual: isManual },
                    { label: 'Previous Revenue', value: previousRevenue !== null ? previousRevenue : '--', isManual: isManual }
                ],
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
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
