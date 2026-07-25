import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scorePromoterHolding, generateAiInsightPromoterCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function PromoterHoldingCard({ cardId, data = null, lastUpdated }) {
    const holdingsArr = Array.isArray(data?.holdings) ? data.holdings : [];
    
    const promoterObj = holdingsArr.find(h => h.category === 'promoters');
    
    let currentPct = null;
    let prevPct = null;
    let isLiveData = false;
    let historyForChart = [];

    if (promoterObj && Array.isArray(promoterObj.history) && promoterObj.history.length > 0) {
        currentPct = promoterObj.history[0].value;
        prevPct = promoterObj.history.length > 1 ? promoterObj.history[1].value : null;
        isLiveData = true;
        historyForChart = [...promoterObj.history].reverse().map(h => ({ name: h.period, value: h.value }));
    }

    const configData = getIndicatorConfig(CARD_REGISTRY.promoter_holding.id) || { creditScore: 7, impactWeight: 5.0, aiModel: 'Engine v3' };
    const { score, bias, holdingZone, trend } = scorePromoterHolding(currentPct, prevPct);
    
    const cCard = computeCardConfidence({
        hasLiveData: isLiveData,
        isManual: false, // Since this doesn't have manual fallback
        sourcePipeline: isLiveData ? 'upstox' : 'none',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--')
    }, 'fundamentals');
    
    const aiInsightText = generateAiInsightPromoterCard(currentPct, prevPct, holdingZone, trend);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Promoter Holding',
                category: 'Ownership & Flow',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore || 7,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'),
                source: isLiveData ? 'Upstox Shareholding' : 'No Data',
                aiModel: configData?.aiModel || 'Engine v3'
            }}
            data={{
                currentValueObj: { label: 'Promoter %', value: currentPct !== null ? `${currentPct.toFixed(2)}%` : '--' },
                details: [
                    { label: 'Holding Zone', value: holdingZone, isManual: false },
                    { label: 'QoQ Trend', value: trend, isManual: false },
                    prevPct !== null && { label: 'Previous Qtr', value: `${prevPct.toFixed(2)}%`, isManual: false }
                ].filter(Boolean),
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: historyForChart,
                valueKey: 'value',
                valueName: 'Promoter %'
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'High promoter holding (>50%) aligns management incentives with shareholders.',
                    'Promoter buying signals insider conviction in the company\'s future.',
                    'Pledged shares by promoters are a major risk factor — high pledge = distress risk.',
                    'Consistent promoter dilution over multiple quarters is a red flag.',
                    'Founder-led companies with high ownership historically outperform significantly.'
                ]
            }}
        />
    );
}
