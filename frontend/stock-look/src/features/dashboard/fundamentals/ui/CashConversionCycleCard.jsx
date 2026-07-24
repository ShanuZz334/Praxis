import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { cleanNum } from '@/lib/utils';

export default function CashConversionCycleCard({ cardId, data, manualOverrides = {}, lastUpdated }) {
    const ratiosArray = Array.isArray(data?.ratios) ? data.ratios : [];

    // Attempt to extract live data if Upstox provides them
    const getRatio = (keywords) => {
        const item = ratiosArray.find(r => keywords.some(kw => r.name?.toLowerCase().includes(kw)));
        return item?.company_value ? cleanNum(item.company_value) : null;
    };

    const liveInvDays = getRatio(['inventory days', 'inventory turnover days']);
    const liveRecDays = getRatio(['receivable days', 'debtor days']);
    const livePayDays = getRatio(['payable days', 'creditor days']);

    const invDays = liveInvDays ?? (manualOverrides.inventory_days ? cleanNum(manualOverrides.inventory_days) : null);
    const recDays = liveRecDays ?? (manualOverrides.receivable_days ? cleanNum(manualOverrides.receivable_days) : null);
    const payDays = livePayDays ?? (manualOverrides.payable_days ? cleanNum(manualOverrides.payable_days) : null);

    const isLiveData = liveInvDays !== null || liveRecDays !== null || livePayDays !== null;

    let ccc = null;
    if (invDays !== null && recDays !== null && payDays !== null) {
        ccc = invDays + recDays - payDays;
    }

    let score = null;
    let bias = 'Neutral';
    if (ccc !== null) {
        if (ccc < 0) { score = 90; bias = 'Bullish'; } // Negative CCC is excellent
        else if (ccc < 30) { score = 75; bias = 'Bullish'; }
        else if (ccc < 90) { score = 50; bias = 'Neutral'; }
        else { score = 20; bias = 'Bearish'; }
    }

    const baseConfig = getIndicatorConfig(CARD_REGISTRY.cash_conversion.id);
    const configData = (baseConfig && baseConfig.impactWeight !== "0.0%") 
        ? baseConfig 
        : { creditScore: 6, impactWeight: "5.0%", aiModel: 'Engine v2' };

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Cash Conv. Cycle',
                category: 'Corporate',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData.creditScore,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'),
                source: isLiveData ? 'Upstox' : 'Manual',
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: 'CCC (Days)', value: ccc !== null ? Math.round(ccc).toString() : '--', isManual: !isLiveData },
                details: [
                    { label: 'Inventory', value: invDays !== null && !isNaN(invDays) ? `${Math.round(invDays)}d` : '--', isManual: !isLiveData },
                    { label: 'Receivables', value: recDays !== null && !isNaN(recDays) ? `${Math.round(recDays)}d` : '--', isManual: !isLiveData },
                    { label: 'Payables', value: payDays !== null && !isNaN(payDays) ? `${Math.round(payDays)}d` : '--', isManual: !isLiveData },
                ],
                score: score,
                bias: bias,
                confidence: '70%',
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: [], valueKey: 'value', valueName: 'CCC' }}
            insights={{
                aiInsight: 'Cash Conversion Cycle measures how fast a company converts its cash investments in inventory back into cash.',
                whyItMatters: [
                    'A lower CCC means the company needs less capital to run its daily operations.',
                    'Negative CCC (like Amazon or FMCG companies) means suppliers are effectively financing the business.',
                    'Rising CCC over time can indicate inventory buildup or trouble collecting receivables.'
                ]
            }}
        />
    );
}
