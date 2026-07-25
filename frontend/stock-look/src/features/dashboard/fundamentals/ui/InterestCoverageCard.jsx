/**
 * @file InterestCoverageCard.jsx
 * @purpose Displays Interest Coverage Ratio (EBIT / Interest Expense).
 *
 * DATA SOURCES (Waterfall Priority):
 *  - Attempt 1: Upstox key-ratios API (pre-calculated interest_coverage)
 *               → Available for some stocks; not universally provided by Upstox.
 *  - Attempt 2: Manual override
 *
 * ⚠️  WHY AUTO CALCULATION IS NOT POSSIBLE FROM INCOME STATEMENT:
 *     Upstox's income_statement API compresses the P&L into 3 summary categories:
 *     [revenue], [operating_profit], [net_profit].
 *     The [operating_profit] category is actually PBT (Profit Before Tax) — i.e.,
 *     finance costs are ALREADY deducted. The API does NOT expose Finance Costs
 *     as a separate line item. Without Finance Costs, EBIT cannot be derived,
 *     and therefore Interest Coverage = EBIT / Finance Costs cannot be auto-computed.
 *
 *     Verified live on Tata Steel (consolidated FY26):
 *       operating_profit = 15,968.69 Cr  ← matches Profit Before Tax exactly
 *       Actual Finance Costs ≈ 7,000-8,000 Cr (buried inside Total Expenses)
 *       True EBIT ≈ 22,000 Cr, True ICR ≈ 2.8x
 *       Our formula would have shown: Infinity (100% wrong)
 *
 * SCORING ENGINE: Multi-factor blended approach
 *   Factor 1 (50%): Absolute coverage ratio (safety threshold)
 *   Factor 2 (30%): Margin of safety above minimum viable threshold (>1.5x)
 *   Factor 3 (20%): Sector comparison when available
 */
import React from 'react';
import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scoreInterestCoverage, generateAiInsightInterestCoverageCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

// ─── Main Component ─────────────────────────────────────────────────────────
export default function InterestCoverageCard({ cardId, data, manualOverride, lastUpdated }) {
    let isManual = true;
    let extractedValue = null;
    let extractedSector = null;
    let sourceLabel = 'Manual';

    // ── Attempt 1: Upstox key-ratios (pre-calculated) ────────────────────────
    // Upstox doesn't universally provide this ratio, but check anyway.
    const ratioObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r =>
        r.name?.toLowerCase().includes('interest coverage')
    );
    if (ratioObj?.company_value) {
        const parsed = cleanNum(ratioObj.company_value);
        if (!isNaN(parsed)) {
            extractedValue = parsed;
            isManual = false;
            sourceLabel = 'Upstox Key Ratios';
        }
        if (ratioObj.sector_value) {
            const parsedSector = cleanNum(ratioObj.sector_value);
            if (!isNaN(parsedSector)) extractedSector = parsedSector;
        }
    }

    // ── Attempt 2: Manual override ────────────────────────────────────────────
    const currentCoverage = isManual
        ? (manualOverride !== undefined && manualOverride !== null ? cleanNum(manualOverride) : null)
        : extractedValue;
    const sectorCoverage = isManual ? null : extractedSector;

    const configData = getIndicatorConfig(CARD_REGISTRY.interest_coverage.id);
    const { score, bias, safetyZone } = scoreInterestCoverage(currentCoverage, sectorCoverage);
    
    const cCard = computeCardConfidence({
        hasLiveData: !isManual,
        isManual: !!manualOverride && isManual,
        sourcePipeline: sourceLabel === 'Upstox Key Ratios' ? 'upstox' : 'manual',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
    }, 'fundamentals');
    
    const aiInsightText = generateAiInsightInterestCoverageCard(currentCoverage, sectorCoverage, safetyZone);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Interest Coverage',
                category: 'Financial Health',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore ?? 5,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--'),
                source: sourceLabel,
                aiModel: configData?.aiModel ?? 'Engine v3'
            }}
            data={{
                currentValueObj: {
                    label: 'Coverage Ratio',
                    value: currentCoverage !== null && !isNaN(currentCoverage) ? `${currentCoverage.toFixed(2)}x` : '--',
                    isManual: isManual
                },
                details: [
                    { label: 'Safety Zone', value: safetyZone, isManual: false },
                    sectorCoverage !== null && !isNaN(sectorCoverage) && { label: 'Sector Avg', value: `${sectorCoverage.toFixed(2)}x`, isManual: false },
                ].filter(Boolean),
                score: score,
                bias: bias ?? 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight ?? 7.0
            }}
            chartData={{ points: [], valueKey: 'value', valueName: 'Coverage Ratio' }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'Measures how many times EBIT can cover the annual interest expense.',
                    'The minimum viable threshold is 1.5x — below this, solvency risk is elevated.',
                    'Highly leveraged companies (Infra, Utilities) tolerate 3–5x; asset-light companies should target >10x.',
                    'Watch for a declining trend even when the absolute number is still acceptable.',
                    'A coverage ratio below 1.0x means the company cannot fund interest from operations alone.',
                    'Note: Upstox does not separately expose Finance Costs — enter this metric manually from the company annual report.'
                ]
            }}
        />
    );
}
