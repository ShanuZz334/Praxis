import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scoreEarningsTrend, generateAiInsightEarningsTrendCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function EarningsTrendCard({ cardId, data = null, manualOverride, lastUpdated }) {
    // 1. Find EPS history from Income Statement
    const incomeArray = Array.isArray(data?.income) 
        ? data.income 
        : (Array.isArray(data?.income?.full_statement) ? data.income.full_statement : []);
    const epsObj = incomeArray.find(r => r.particular === 'EPS - Basic' || r.particular === 'EPS - Diluted');
    
    let epsHistory = null;
    if (epsObj && Array.isArray(epsObj.history) && epsObj.history.length > 0) {
        epsHistory = epsObj.history;
    }

    const isManual = !epsHistory || epsHistory.length < 2;
    const manualCAGR = isManual && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? cleanNum(manualOverride) 
        : null;

    // Centralized Config
    const configData = getIndicatorConfig(CARD_REGISTRY.earnings_trend.id);

    // --- Scoring Engine ---
    const { score, bias, trendLabel, cagr } = scoreEarningsTrend(epsHistory, manualCAGR);
    
    const cCard = computeCardConfidence({
        hasLiveData: !isManual,
        isManual: !!manualOverride && isManual,
        sourcePipeline: isManual ? 'Manual' : 'Upstox Income Stmt',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
    }, 'fundamentals');
    const aiInsightText = generateAiInsightEarningsTrendCard(epsHistory, cagr, trendLabel);

        return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Earnings Trend',
                category: 'Market Health',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox Income Stmt',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Overall Trend', value: trendLabel },
                details: [
                    cagr !== null && !isNaN(cagr) && { label: 'Calculated CAGR', value: cagr.toFixed(2) + '%', isManual: isManual },
                    { label: 'Periods Analyzed', value: epsHistory ? `${epsHistory.length} Years` : (isManual ? 'Manual Input' : '--'), isManual: isManual }
                ].filter(Boolean),
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: epsHistory ? [...epsHistory].reverse().map(h => ({ name: h.period, value: h.value })) : [],
                valueKey: 'value',
                valueName: 'EPS'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Shows trajectory of corporate profitability.',
                    'Leading indicator for stock price movement.',
                    'Helps identify business cycle phases.'
                ]
            }}
        />
    );
}
