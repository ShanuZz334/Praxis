import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { scoreSmartMoneyFlow, generateAiInsightSmartMoneyCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function SmartMoneyFlowCard({ cardId, data = null, lastUpdated }) {
    const holdingsArr = Array.isArray(data?.holdings) ? data.holdings : [];
    
    const fiiObj   = holdingsArr.find(h => h.category === 'fii');
    const diiObj   = holdingsArr.find(h => h.category === 'other_dii');
    const mfObj    = holdingsArr.find(h => h.category === 'mutual_funds');

    let latestInstitutional = null;
    let prevInstitutional = null;
    let isLiveData = false;

    const getLatest = (obj, idx = 0) => obj?.history?.[idx]?.value ?? null;

    const fii0 = getLatest(fiiObj, 0), fii1 = getLatest(fiiObj, 1);
    const dii0 = getLatest(diiObj, 0), dii1 = getLatest(diiObj, 1);
    const mf0  = getLatest(mfObj,  0), mf1  = getLatest(mfObj,  1);

    if (fii0 !== null || dii0 !== null || mf0 !== null) {
        latestInstitutional = (fii0 || 0) + (dii0 || 0) + (mf0 || 0);
        isLiveData = true;
    }
    if (fii1 !== null || dii1 !== null || mf1 !== null) {
        prevInstitutional = (fii1 || 0) + (dii1 || 0) + (mf1 || 0);
    }

    // Build chart from FII history as representative trend
    const historyForChart = fiiObj?.history
        ? [...fiiObj.history].reverse().map(h => ({ name: h.period, value: h.value }))
        : [];

    const configData = getIndicatorConfig('smart_money_flow') || { creditScore: 7, impactWeight: 6.0, aiModel: 'Engine v3' };
    const { score, bias, confidence, flowZone, trend } = scoreSmartMoneyFlow(latestInstitutional, prevInstitutional);
    const aiInsightText = generateAiInsightSmartMoneyCard(latestInstitutional, prevInstitutional, flowZone, trend);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Smart Money Flow',
                category: 'Ownership & Flow',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore || 7,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'),
                source: isLiveData ? 'Upstox Shareholding' : 'No Data',
                aiModel: configData?.aiModel || 'Engine v3'
            }}
            data={{
                currentValueObj: { label: 'Institutional %', value: latestInstitutional !== null ? `${latestInstitutional.toFixed(2)}%` : '--' },
                details: [
                    { label: 'Flow Zone', value: flowZone, isManual: false },
                    { label: 'QoQ Flow', value: trend, isManual: false },
                    fii0 !== null && { label: 'FII', value: `${fii0.toFixed(2)}%`, isManual: false },
                    dii0 !== null && { label: 'DII', value: `${dii0.toFixed(2)}%`, isManual: false },
                    mf0  !== null && { label: 'MF', value: `${mf0.toFixed(2)}%`, isManual: false },
                ].filter(Boolean),
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight || 6.0
            }}
            chartData={{
                points: historyForChart,
                valueKey: 'value',
                valueName: 'FII %'
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'Institutional accumulation is the strongest leading indicator of sustained price moves.',
                    'FII + DII + MF combined holding above 35% shows strong institutional conviction.',
                    'Sustained quarterly accumulation by institutions often precedes index re-ratings.',
                    'Distribution (selling) by institutions can accelerate downward price action.',
                    'Smart money typically does deep due diligence — their collective positioning is meaningful.'
                ]
            }}
        />
    );
}
