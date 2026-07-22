import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { scoreProfitGrowth, generateAiInsightProfitGrowthCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function ProfitGrowthCard({ cardId, data = null, manualOverride, lastUpdated }) {
    // 1. Extract Profit History
    const incomeStmt = Array.isArray(data?.income?.income_statement) ? data.income.income_statement : [];
    const fullStmt = Array.isArray(data?.income?.full_statement) ? data.income.full_statement : [];
    
    let profitObj = incomeStmt.find(m => m.category === 'net_profit' && Array.isArray(m.history) && m.history.length >= 2);
    if (!profitObj) {
        profitObj = fullStmt.find(m => (m.particular === 'Profit After Tax' || m.particular === 'Profit Before Tax') && Array.isArray(m.history) && m.history.length >= 2);
    }

    let profitHistory = null;
    if (profitObj && Array.isArray(profitObj.history) && profitObj.history.length > 0) {
        profitHistory = profitObj.history;
    }

    const isManual = !profitHistory || profitHistory.length < 2;
    const manualCAGR = isManual && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? cleanNum(manualOverride) 
        : null;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.profit_growth.id);

    // 3. Praxis Engine
    const { score, bias, confidence, calculatedCAGR, latestProfit, previousProfit, trendDesc } = scoreProfitGrowth(profitHistory, manualCAGR);
    const aiInsightText = generateAiInsightProfitGrowthCard(profitHistory, calculatedCAGR, trendDesc);

        return (
        <IndicatorCard
            cardId={cardId}
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
                currentValueObj: { label: 'CAGR (%)', value: calculatedCAGR !== null ? calculatedCAGR.toFixed(2) + '%' : '--' },
                details: [
                    { label: 'Latest Profit', value: latestProfit !== null ? latestProfit : '--', isManual: isManual },
                    { label: 'Previous Profit', value: previousProfit !== null ? previousProfit : '--', isManual: isManual }
                ],
                score: score ?? null,
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
