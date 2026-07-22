import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { scoreEarningsQuality, generateAiInsightEarningsQualityCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function EarningsQualityCard({ cardId, data = null, lastUpdated }) {
    let cfoToNetProfit = null;
    let cfo = null;
    let netProfit = null;
    let isLiveData = false;

    // Extract CFO from cash_flow array
    const cashFlowArr = Array.isArray(data?.cashFlow?.cash_flow) ? data.cashFlow.cash_flow : [];
    const opCfObj = cashFlowArr.find(c => c.category === 'operating');
    if (opCfObj?.history?.length > 0) {
        cfo = opCfObj.history[0].value;
    }

    // Extract Net Profit from income_statement
    const incomeStmt = Array.isArray(data?.income?.income_statement) ? data.income.income_statement : [];
    const netProfitObj = incomeStmt.find(i => i.category === 'net_profit');
    if (!netProfitObj) {
        const fullStmt = Array.isArray(data?.income?.full_statement) ? data.income.full_statement : [];
        const patObj = fullStmt.find(m => m.particular === 'Profit After Tax');
        if (patObj?.history?.length > 0) netProfit = patObj.history[0].value;
    } else if (netProfitObj?.history?.length > 0) {
        netProfit = netProfitObj.history[0].value;
    }

    if (cfo !== null && netProfit !== null && netProfit !== 0) {
        cfoToNetProfit = cfo / netProfit;
        isLiveData = true;
    }

    const configData = getIndicatorConfig(CARD_REGISTRY.earnings_quality.id) || { creditScore: 8, impactWeight: 7.0, aiModel: 'Engine v3' };
    const { score, bias, confidence, qualityLabel } = scoreEarningsQuality(cfoToNetProfit);
    const aiInsightText = generateAiInsightEarningsQualityCard(cfoToNetProfit, qualityLabel);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Earnings Quality',
                category: 'Ownership & Flow',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore || 8,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'),
                source: isLiveData ? 'Upstox Cash Flow + Income' : 'No Data',
                aiModel: configData?.aiModel || 'Engine v3'
            }}
            data={{
                currentValueObj: { label: 'CFO / Net Profit', value: cfoToNetProfit !== null ? `${cfoToNetProfit.toFixed(2)}x` : '--' },
                details: [
                    { label: 'Quality Label', value: qualityLabel, isManual: false },
                    cfo !== null && { label: 'Op. Cash Flow', value: `₹${(cfo / 100).toFixed(0)} Cr`, isManual: false },
                    netProfit !== null && { label: 'Net Profit', value: `₹${(netProfit / 100).toFixed(0)} Cr`, isManual: false },
                ].filter(Boolean),
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight || 7.0
            }}
            chartData={{ points: [], valueKey: 'value', valueName: 'CFO/PAT Ratio' }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'CFO / Net Profit > 1.0 means profits are fully backed by real operating cash.',
                    'Earnings that exceed cash flows often signal accounting manipulation or receivable build-up.',
                    'A consistently high earnings quality ratio is one of the hallmarks of a "forever hold" business.',
                    'Warren Buffett prioritizes businesses that convert profits to cash without massive reinvestment.',
                    'A ratio < 0.5 is a red flag for balance sheet stress or aggressive profit recognition.'
                ]
            }}
        />
    );
}
