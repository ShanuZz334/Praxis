/**
 * @file FreeCashFlowCard.jsx
 * @purpose Displays Free Cash Flow and FCF-to-Revenue Yield.
 *
 * DATA SOURCES:
 *  - Attempt 1: Upstox key-ratios API (free_cash_flow)
 *  - Attempt 2: Calculated from Cash Flow Statement (Operating CF − CapEx proxy)
 *  - Attempt 3: Manual override
 *
 * SCORING ENGINE: Multi-factor blended approach
 *   Factor 1 (50%): FCF sign (positive = healthy, negative = burning cash)
 *   Factor 2 (30%): FCF-to-Revenue % (size-normalized quality measure)
 *   Factor 3 (20%): FCF trend & absolute magnitude context
 *
 * NOTE: FCF yield = FCF / Total Revenue (when available). This normalizes
 * the raw ₹ Cr figure across different company sizes — more meaningful than
 * raw absolute FCF which favors large caps by definition.
 */
import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { scoreFreeCashFlow, generateAiInsightFreeCashFlowCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

// ─── Main Component ─────────────────────────────────────────────────────────
export default function FreeCashFlowCard({ data, manualOverride, lastUpdated }) {
    let isManual = true;
    let extractedFCF = null;
    let extractedSector = null;
    let sourceLabel = 'Manual';

    // Attempt 1: From Ratios (Upstox)
    const ratioObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r =>
        r.name?.toLowerCase().includes('free cash flow') || r.name?.toLowerCase() === 'fcf'
    );

    if (ratioObj?.company_value) {
        const parsed = parseFloat(ratioObj.company_value);
        if (!isNaN(parsed)) { extractedFCF = parsed; isManual = false; sourceLabel = 'Upstox Ratios'; }
        if (ratioObj.sector_value) {
            const ps = parseFloat(ratioObj.sector_value);
            if (!isNaN(ps)) extractedSector = ps;
        }
    }

    // Attempt 2: Calculate from Cash Flow Statement (Operating CF + Investing CF as CapEx proxy)
    if (isManual && data?.cashFlow) {
        const fullStmt = Array.isArray(data.cashFlow.full_statement) ? data.cashFlow.full_statement : [];
        const opCashObj = fullStmt.find(m => m.particular?.toLowerCase().includes('operations'));
        const invCashObj = fullStmt.find(m => m.particular?.toLowerCase().includes('investing'));

        if (opCashObj?.history?.length > 0 && invCashObj?.history?.length > 0) {
            extractedFCF = opCashObj.history[0].value + invCashObj.history[0].value;
            isManual = false;
            sourceLabel = 'Upstox Cash Flow (Calc)';
        }
    }

    // Extract revenue for yield normalization
    let revenue = null;
    const incomeArray = Array.isArray(data?.income)
        ? data.income
        : (Array.isArray(data?.income?.full_statement) ? data.income.full_statement : []);
    const revObj = incomeArray.find(m => {
        const p = m.particular?.toLowerCase() || '';
        return Array.isArray(m.history) && m.history.length >= 1 &&
            (p === 'total revenue' || p === 'revenue' || p.includes('revenue') || p.includes('sales'));
    });
    if (revObj?.history?.length > 0) revenue = revObj.history[0].value;

    const currentFCF = isManual
        ? (manualOverride !== undefined && manualOverride !== null ? parseFloat(manualOverride) : null)
        : extractedFCF;

    const configData = getIndicatorConfig('free_cash_flow');
    const { score, bias, confidence, fcfCategory, fcfYield } = scoreFreeCashFlow(currentFCF, revenue);
    const aiInsightText = generateAiInsightFreeCashFlowCard(currentFCF, fcfYield, fcfCategory);

    return (
        <IndicatorCard
            config={{
                title: 'Free Cash Flow',
                category: 'Financial Health',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore ?? 5,
                updateTime: lastUpdated ?? '--:--',
                source: sourceLabel,
                aiModel: configData?.aiModel ?? 'Engine v3'
            }}
            data={{
                currentValueObj: {
                    label: 'FCF (₹ Cr)',
                    value: currentFCF !== null ? (currentFCF >= 0 ? `+${currentFCF.toFixed(0)}` : `${currentFCF.toFixed(0)}`) : '--'
                },
                details: [
                    { label: 'FCF Category', value: fcfCategory, isManual: false },
                    fcfYield !== null && { label: 'FCF Yield', value: `${fcfYield.toFixed(1)}%`, isManual: false }
                ].filter(Boolean),
                score: score ?? 0,
                bias: bias ?? 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 7.0
            }}
            chartData={{ points: [], valueKey: 'value', valueName: 'FCF (₹ Cr)' }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'FCF = Operating Cash Flow − CapEx. It is the actual cash left after maintaining/growing the business.',
                    'Unlike earnings, FCF cannot be manipulated through accounting choices — it is the ground truth of profitability.',
                    'FCF-to-Revenue yield >8% indicates a capital-efficient business with strong reinvestment options.',
                    'Negative FCF during high-growth phases can be acceptable — context (growth stage vs decline) is critical.',
                    'Sustained FCF generation funds dividends, buybacks, and debt reduction without diluting shareholders.'
                ]
            }}
        />
    );
}
