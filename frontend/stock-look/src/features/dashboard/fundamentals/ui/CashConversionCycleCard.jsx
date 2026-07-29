import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { cleanNum } from '@/lib/utils';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';

export default function CashConversionCycleCard({ cardId, data, manualOverrides = {}, lastUpdated }) {
    const ratiosArray = Array.isArray(data?.ratios) ? data.ratios : [];

    // Attempt to extract live data if Upstox provides them
    const getRatio = (keywords) => {
        const item = ratiosArray.find(r => keywords.some(kw => r.name?.toLowerCase().includes(kw)));
        return (item?.company_value !== undefined && item?.company_value !== null) ? cleanNum(item.company_value) : null;
    };

    // First try direct days
    let liveInvDays = getRatio(['inventory days', 'inventory turnover days']);
    let liveRecDays = getRatio(['receivable days', 'debtor days']);
    let livePayDays = getRatio(['payable days', 'creditor days']);

    // If direct days not found, try turnover ratios (Days = 365 / Turnover)
    if (liveInvDays === null) {
        const invTurnover = getRatio(['inventory turnover']);
        if (invTurnover && invTurnover > 0) liveInvDays = 365 / invTurnover;
    }
    if (liveRecDays === null) {
        const recTurnover = getRatio(['debtors turnover', 'receivables turnover', 'debtor turnover']);
        if (recTurnover && recTurnover > 0) liveRecDays = 365 / recTurnover;
    }
    if (livePayDays === null) {
        const payTurnover = getRatio(['creditors turnover', 'payables turnover', 'creditor turnover']);
        if (payTurnover && payTurnover > 0) livePayDays = 365 / payTurnover;
    }
    
    // Check if Upstox provides CCC directly
    const liveCCC = getRatio(['cash conversion cycle']);

    const invDays = liveInvDays ?? (manualOverrides.inventory_days ? cleanNum(manualOverrides.inventory_days) : null);
    const recDays = liveRecDays ?? (manualOverrides.receivable_days ? cleanNum(manualOverrides.receivable_days) : null);
    const payDays = livePayDays ?? (manualOverrides.payable_days ? cleanNum(manualOverrides.payable_days) : null);

    const isLiveData = liveInvDays !== null || liveRecDays !== null || livePayDays !== null || liveCCC !== null;

    let ccc = null;
    if (liveCCC !== null) {
        ccc = liveCCC;
    } else if (invDays !== null && recDays !== null && payDays !== null) {
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

    const cCard = computeCardConfidence({
        hasLiveData: isLiveData,
        isManual: !!(!isLiveData && (manualOverrides.inventory_days || manualOverrides.receivable_days || manualOverrides.payable_days)),
        sourcePipeline: isLiveData ? 'upstox' : 'manual',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--')
    }, 'fundamentals');

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
                currentValueObj: { label: 'CCC', value: ccc !== null ? Math.round(ccc).toString() + ' Days' : '--', isManual: !isLiveData },
                details: [
                    { label: 'Inventory', value: invDays !== null && !isNaN(invDays) ? `${Math.round(invDays)}d` : '--', isManual: !isLiveData },
                    { label: 'Receivables', value: recDays !== null && !isNaN(recDays) ? `${Math.round(recDays)}d` : '--', isManual: !isLiveData },
                    { label: 'Payables', value: payDays !== null && !isNaN(payDays) ? `${Math.round(payDays)}d` : '--', isManual: !isLiveData },
                ],
                score: score,
                bias: bias,
                confidence: `${cCard}%`,
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
