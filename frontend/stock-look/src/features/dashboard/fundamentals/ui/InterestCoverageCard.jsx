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

// ─── Industry-Grade Scoring Engine ──────────────────────────────────────────
function scoreInterestCoverage(currentCoverage, sectorCoverage) {
    if (currentCoverage === null || isNaN(currentCoverage)) {
        return { score: 0, bias: 'Neutral', confidence: 0, safetyZone: 'Unknown' };
    }

    // ── Factor 1: Absolute Safety Threshold ───────────────────────────────
    let f1Score;
    let safetyZone;
    if (currentCoverage > 15) {
        f1Score = 98; safetyZone = 'Fortress Balance Sheet';
    } else if (currentCoverage > 8) {
        f1Score = 90; safetyZone = 'Very Safe';
    } else if (currentCoverage > 5) {
        f1Score = 78; safetyZone = 'Comfortable';
    } else if (currentCoverage >= 3) {
        f1Score = 60; safetyZone = 'Adequate';
    } else if (currentCoverage >= 1.5) {
        f1Score = 35; safetyZone = 'Thin — Watch Closely';
    } else if (currentCoverage >= 1.0) {
        f1Score = 15; safetyZone = 'At Risk';
    } else {
        f1Score = 3;  safetyZone = 'Distress — Cannot Cover Interest';
    }

    // ── Factor 2: Margin of Safety Above Break-Even (1.0x) ────────────────
    // Every x above 1.0 represents one full layer of earnings buffer
    const marginAboveBreakeven = Math.max(0, currentCoverage - 1.0);
    let f2Score;
    if (marginAboveBreakeven > 10) f2Score = 95;
    else if (marginAboveBreakeven > 5) f2Score = 82;
    else if (marginAboveBreakeven > 3) f2Score = 65;
    else if (marginAboveBreakeven > 1) f2Score = 42;
    else if (marginAboveBreakeven > 0) f2Score = 20;
    else f2Score = 5; // Below break-even

    // ── Factor 3: Sector Comparison ──────────────────────────────────────
    let f3Score = f1Score; // fallback
    let hasSector = false;
    if (sectorCoverage !== null && !isNaN(sectorCoverage) && sectorCoverage > 0) {
        hasSector = true;
        const ratio = currentCoverage / sectorCoverage;
        if (ratio > 2.0)      f3Score = 95;
        else if (ratio > 1.3) f3Score = 80;
        else if (ratio > 0.8) f3Score = 55;
        else if (ratio > 0.5) f3Score = 30;
        else                  f3Score = 10;
    }

    // ── Blend ─────────────────────────────────────────────────────────────
    const blended = hasSector
        ? (f1Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20)
        : (f1Score * 0.60) + (f2Score * 0.40);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    // ── Bias ──────────────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Confidence ────────────────────────────────────────────────────────
    const confidence = hasSector ? 90 : (currentCoverage > 10 || currentCoverage < 1.5 ? 82 : 74);

    return { score: finalScore, bias, confidence, safetyZone };
}

function generateAiInsight(currentCoverage, sectorCoverage, safetyZone) {
    if (currentCoverage === null || isNaN(currentCoverage)) {
        return 'Waiting for Interest Coverage data. This is EBIT divided by Finance Costs from the income statement.';
    }

    const rounded = currentCoverage.toFixed(2);
    let base = `Interest coverage of ${rounded}x (${safetyZone}).`;

    if (sectorCoverage !== null && !isNaN(sectorCoverage)) {
        base += ` Sector average: ${sectorCoverage.toFixed(2)}x.`;
    }

    if (currentCoverage > 10) {
        return base + ` The company earns ${rounded}x its annual interest obligations — an extremely strong safety cushion. Even a severe earnings collapse would not immediately threaten debt servicing.`;
    } else if (currentCoverage > 5) {
        return base + ` Healthy debt servicing capacity. The company comfortably covers interest from operating earnings with a ${rounded}x buffer, leaving substantial room for earnings volatility.`;
    } else if (currentCoverage >= 3) {
        return base + ` Adequate coverage, but the buffer is thinning. A 60%+ earnings decline would threaten interest payment ability. Monitor debt maturity profile and EBIT trends closely.`;
    } else if (currentCoverage >= 1.5) {
        return base + ` Dangerously thin coverage. Any meaningful revenue shortfall or margin compression could prevent full interest payment. This level warrants elevated risk scrutiny.`;
    } else if (currentCoverage >= 1.0) {
        return base + ` At the edge of insolvency risk. The company barely covers its interest obligations and has no operating earnings buffer for unexpected shocks.`;
    }
    return base + ` Critical — the company cannot cover its interest payments from operating earnings. This is a strong leading indicator of potential default or distress financing.`;
}

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
    const aiInsightText = generateAiInsight(currentCoverage, sectorCoverage, safetyZone);

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
