/**
 * @file InterestCoverageCard.jsx
 * @purpose Displays Interest Coverage Ratio (EBIT / Interest Expense).
 *
 * DATA SOURCES:
 *  - Attempt 1: Upstox key-ratios API (interest_coverage ratio)
 *  - Attempt 2: Calculated from Income Statement (EBIT / Finance Costs)
 *  - Attempt 3: Manual override
 *
 * SCORING ENGINE: Multi-factor blended approach
 *   Factor 1 (50%): Absolute coverage ratio (safety threshold)
 *   Factor 2 (30%): Margin of safety above minimum viable threshold (>1.5x)
 *   Factor 3 (20%): Sector comparison when available
 */
import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { scoreInterestCoverage, generateAiInsightInterestCoverageCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

// ─── Main Component ─────────────────────────────────────────────────────────
export default function InterestCoverageCard({ data, manualOverride, lastUpdated }) {
    let isManual = true;
    let extractedValue = null;
    let extractedSector = null;
    let sourceLabel = 'Manual';

    // Attempt 1: From Ratios (Upstox)
    const ratioObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r =>
        r.name?.toLowerCase().includes('interest coverage')
    );

    if (ratioObj?.company_value) {
        const parsed = parseFloat(ratioObj.company_value);
        if (!isNaN(parsed)) { extractedValue = parsed; isManual = false; sourceLabel = 'Upstox Ratios'; }
        if (ratioObj.sector_value) {
            const parsedSector = parseFloat(ratioObj.sector_value);
            if (!isNaN(parsedSector)) extractedSector = parsedSector;
        }
    }

    // Attempt 2: Calculate from Income Statement (EBIT / Finance Costs)
    if (isManual) {
        const incomeArray = Array.isArray(data?.income)
            ? data.income
            : (Array.isArray(data?.income?.full_statement) ? data.income.full_statement : []);

        const ebitObj = incomeArray.find(m => {
            const p = m.particular?.toLowerCase() || '';
            return Array.isArray(m.history) && m.history.length >= 1 &&
                (p.includes('ebit') || p.includes('operating profit') || p.includes('profit before interest'));
        });
        const financeObj = incomeArray.find(m => {
            const p = m.particular?.toLowerCase() || '';
            return Array.isArray(m.history) && m.history.length >= 1 &&
                (p.includes('finance cost') || p.includes('interest expense') || p.includes('interest paid'));
        });

        if (ebitObj && financeObj) {
            const ebit = ebitObj.history[0].value;
            const interest = financeObj.history[0].value;
            if (interest > 0) {
                extractedValue = ebit / interest;
                isManual = false;
                sourceLabel = 'Upstox Income Stmt (Calc)';
            }
        }
    }

    const currentCoverage = isManual
        ? (manualOverride !== undefined && manualOverride !== null ? parseFloat(manualOverride) : null)
        : extractedValue;
    const sectorCoverage = isManual ? null : extractedSector;

    const configData = getIndicatorConfig('interest_coverage');
    const { score, bias, confidence, safetyZone } = scoreInterestCoverage(currentCoverage, sectorCoverage);
    const aiInsightText = generateAiInsightInterestCoverageCard(currentCoverage, sectorCoverage, safetyZone);

    return (
        <IndicatorCard
            config={{
                title: 'Interest Coverage',
                category: 'Financial Health',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore ?? 5,
                updateTime: lastUpdated ?? '--:--',
                source: sourceLabel,
                aiModel: configData?.aiModel ?? 'Engine v3'
            }}
            data={{
                currentValueObj: { label: 'Coverage Ratio', value: currentCoverage !== null ? currentCoverage.toFixed(2) + 'x' : '--' },
                details: [
                    { label: 'Safety Zone', value: safetyZone, isManual: false },
                    sectorCoverage !== null && !isNaN(sectorCoverage) && { label: 'Sector Avg', value: sectorCoverage.toFixed(2) + 'x', isManual: false }
                ].filter(Boolean),
                score: score ?? 0,
                bias: bias ?? 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 7.0
            }}
            chartData={{ points: [], valueKey: 'value', valueName: 'Coverage Ratio' }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'Measures how many times EBIT can cover the annual interest expense.',
                    'The minimum viable threshold is 1.5x — below this, solvency risk is elevated.',
                    'Highly leveraged companies (Infra, Utilities) tolerate 3–5x; asset-light companies should target >10x.',
                    'Watch for declining coverage trend even when the absolute number is still acceptable.',
                    'A coverage ratio below 1.0x means the company cannot fund interest from operations alone.'
                ]
            }}
        />
    );
}
