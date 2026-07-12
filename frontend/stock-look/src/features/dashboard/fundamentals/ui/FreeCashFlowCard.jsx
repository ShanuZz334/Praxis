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

// ─── Industry-Grade Scoring Engine ──────────────────────────────────────────
function scoreFreeCashFlow(currentFCF, revenue) {
    if (currentFCF === null || isNaN(currentFCF)) {
        return { score: 0, bias: 'Neutral', confidence: 0, fcfCategory: 'Unknown', fcfYield: null };
    }

    // ── Compute FCF Yield when revenue is available ───────────────────────
    let fcfYield = null;
    if (revenue !== null && !isNaN(revenue) && revenue > 0) {
        fcfYield = (currentFCF / revenue) * 100;
    }

    // ── Factor 1: FCF Sign + Magnitude Absolute Context (0–100) ──────────
    let f1Score;
    let fcfCategory;
    if (currentFCF > 0) {
        // Positive FCF — use yield if available, else use raw sign
        if (fcfYield !== null) {
            if (fcfYield > 15)       { f1Score = 95; fcfCategory = 'Exceptional FCF Generation'; }
            else if (fcfYield > 8)   { f1Score = 82; fcfCategory = 'Strong FCF Generation'; }
            else if (fcfYield > 4)   { f1Score = 68; fcfCategory = 'Healthy FCF Generation'; }
            else if (fcfYield > 1)   { f1Score = 55; fcfCategory = 'Positive — Thin Yield'; }
            else                     { f1Score = 48; fcfCategory = 'Barely Positive'; }
        } else {
            // No revenue data — use raw FCF sign as bullish signal only
            f1Score = 68; fcfCategory = 'Positive FCF';
        }
    } else if (currentFCF === 0) {
        f1Score = 45; fcfCategory = 'Break-Even';
    } else {
        // Negative FCF — use yield if available
        if (fcfYield !== null) {
            if (fcfYield > -5)       { f1Score = 35; fcfCategory = 'Mild Cash Burn'; }
            else if (fcfYield > -15) { f1Score = 20; fcfCategory = 'Significant Cash Burn'; }
            else                     { f1Score = 5;  fcfCategory = 'Heavy Cash Burn'; }
        } else {
            f1Score = 22; fcfCategory = 'Negative FCF';
        }
    }

    // ── Factor 2: FCF Yield Quality Band ─────────────────────────────────
    let f2Score = 50;
    if (fcfYield !== null) {
        if (fcfYield > 12)       f2Score = 95;
        else if (fcfYield > 6)   f2Score = 80;
        else if (fcfYield > 2)   f2Score = 62;
        else if (fcfYield > 0)   f2Score = 50;
        else if (fcfYield > -5)  f2Score = 32;
        else if (fcfYield > -15) f2Score = 15;
        else                     f2Score = 5;
    } else {
        // No yield — score based on raw FCF sign only
        f2Score = currentFCF > 0 ? 65 : (currentFCF === 0 ? 45 : 25);
    }

    // ── Factor 3: Absolute Context ────────────────────────────────────────
    // Provides a sanity-check band regardless of yield
    let f3Score;
    if (currentFCF > 0)      f3Score = 70; // Positive is always at least good structurally
    else if (currentFCF > -1000) f3Score = 35;
    else                     f3Score = 10;

    // ── Blend ─────────────────────────────────────────────────────────────
    const hasYield = fcfYield !== null;
    const blended = hasYield
        ? (f1Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20)
        : (f1Score * 0.70) + (f3Score * 0.30);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    // ── Bias ──────────────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Confidence: Higher when yield is available for normalization ───────
    const confidence = hasYield ? 88 : 68;

    return { score: finalScore, bias, confidence, fcfCategory, fcfYield };
}

function generateAiInsight(currentFCF, fcfYield, fcfCategory) {
    if (currentFCF === null || isNaN(currentFCF)) {
        return 'Waiting for Free Cash Flow data. FCF = Operating Cash Flow − Capital Expenditure.';
    }

    const fcfStr = currentFCF >= 0 ? `+₹${Math.abs(currentFCF).toFixed(0)} Cr` : `-₹${Math.abs(currentFCF).toFixed(0)} Cr`;
    const yieldStr = fcfYield !== null ? ` (${fcfYield.toFixed(1)}% of revenue)` : '';

    if (currentFCF > 0 && fcfYield !== null && fcfYield > 10) {
        return `The company generates exceptional free cash flow of ${fcfStr}${yieldStr}. Converting >10% of revenue into cash signals a highly efficient, capital-light business model. This FCF funds dividends, buybacks, debt repayment, and organic growth without external financing.`;
    } else if (currentFCF > 0 && fcfYield !== null && fcfYield > 4) {
        return `Healthy free cash flow of ${fcfStr}${yieldStr}. The business converts a meaningful share of revenue into cash, demonstrating solid working capital management and disciplined capex allocation.`;
    } else if (currentFCF > 0) {
        return `Positive free cash flow of ${fcfStr}${yieldStr}. The company is cash generative — a fundamental prerequisite for financial independence. Monitor the FCF-to-revenue yield trend to assess sustainability.`;
    } else if (currentFCF === 0) {
        return `Free cash flow is exactly break-even (${fcfStr}). The company is investing all operational cash back into the business. Not inherently negative if capex drives future growth.`;
    } else if (fcfYield !== null && fcfYield > -10) {
        return `Moderate cash burn of ${fcfStr}${yieldStr}. Negative FCF is common during aggressive expansion phases or capex-heavy investment cycles. The sustainability depends on whether the investment yields future returns.`;
    }
    return `Heavy cash burn of ${fcfStr}${yieldStr}. The company is spending significantly more cash than it generates. Without strong external financing or a path to positive FCF, this is structurally unsustainable.`;
}

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
    const aiInsightText = generateAiInsight(currentFCF, fcfYield, fcfCategory);

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
