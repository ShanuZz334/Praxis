import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { scoreProfitGrowth, generateAiInsightProfitGrowthCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function ProfitGrowthCard({ data = null, manualOverride, lastUpdated }) {
    // 1. Extract Profit History
    const incomeArray = Array.isArray(data?.income) 
        ? data.income 
        : (Array.isArray(data?.income?.full_statement) ? data.income.full_statement : []);
    const profitObj = incomeArray.find(m => {
        const p = m.particular?.toLowerCase() || '';
        const hasHistory = Array.isArray(m.history) && m.history.length >= 2;
        return hasHistory && (p === 'profit after tax' || p === 'profit before tax' || p.includes('net profit') || p.includes('net income'));
    });

    let profitHistory = null;
    if (profitObj && Array.isArray(profitObj.history) && profitObj.history.length > 0) {
        profitHistory = profitObj.history;
    }

    const isManual = !profitHistory || profitHistory.length < 2;
    const manualCAGR = isManual && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? parseFloat(manualOverride) 
        : null;

    // 2. Load Central Config
    const configData = getIndicatorConfig('profit_growth');

    // 3. Praxis Engine
    const { score, bias, confidence, calculatedCAGR, latestProfit, previousProfit, trendDesc } = scoreProfitGrowth(profitHistory, manualCAGR);
    const aiInsightText = generateAiInsightProfitGrowthCard(profitHistory, calculatedCAGR, trendDesc);

        return (
        <IndicatorCard
            config={{
                title: 'Profit Growth',
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
                    { label: 'Latest Profit', value: latestProfit !== null ? latestProfit : '--', isManual: isManual },
                    { label: 'Previous Profit', value: previousProfit !== null ? previousProfit : '--', isManual: isManual }
                ],
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: profitHistory ? [...profitHistory].reverse().map(h => ({ name: h.period, value: h.value })) : [],
                valueKey: 'value',
                valueName: 'Profit'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Measures bottom-line growth.',
                    'Important for long-term sustainability.',
                    'Shows efficiency of scaling.'
                ]
            }}
        />
    );
}
