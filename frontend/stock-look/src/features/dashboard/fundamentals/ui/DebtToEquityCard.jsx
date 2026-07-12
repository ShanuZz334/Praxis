/**
 * @file DebtToEquityCard.jsx
 * @purpose Displays the Debt-to-Equity Ratio fundamental indicator.
 *
 * DATA SOURCES:
 *  - currentDE → LIVE: Upstox key-ratios API (debt to equity)
 *  - currentDE → CALCULATED: Upstox Balance Sheet (Total Liability / Equity)
 *  - currentDE → MANUAL fallback
 *
 * SCORING ENGINE: Multi-factor blended approach
 *   Factor 1 (50%): Absolute D/E level (industry-standard thresholds)
 *   Factor 2 (30%): Relative vs sector (when available)
 *   Factor 3 (20%): Risk regime (low/moderate/high leverage classification)
 */
import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

// ─── Industry-Grade Scoring Engine ──────────────────────────────────────────
function scoreDebtToEquity(currentDE, sectorDE) {
    if (currentDE === null || isNaN(currentDE)) {
        return { score: 0, bias: 'Neutral', confidence: 0, leverageZone: 'Unknown' };
    }

    // ── Factor 1: Absolute D/E Thresholds (0–100) ─────────────────────────
    // Lower D/E = healthier financial structure = higher score
    let f1Score;
    let leverageZone;
    if (currentDE < 0.1) {
        f1Score = 98; leverageZone = 'Debt Free';
    } else if (currentDE < 0.3) {
        f1Score = 90; leverageZone = 'Very Low Leverage';
    } else if (currentDE < 0.6) {
        f1Score = 78; leverageZone = 'Conservative';
    } else if (currentDE < 1.0) {
        f1Score = 60; leverageZone = 'Moderate Leverage';
    } else if (currentDE < 1.5) {
        f1Score = 42; leverageZone = 'Elevated Leverage';
    } else if (currentDE < 2.5) {
        f1Score = 22; leverageZone = 'High Leverage';
    } else {
        f1Score = 5; leverageZone = 'Dangerously Leveraged';
    }

    // ── Factor 2: Relative vs Sector D/E ─────────────────────────────────
    let f2Score = f1Score; // default if no sector data
    let hasSector = false;
    if (sectorDE !== null && !isNaN(sectorDE) && sectorDE > 0) {
        hasSector = true;
        const ratio = currentDE / sectorDE;
        if (ratio < 0.5)        f2Score = 95; // Far below sector — very disciplined
        else if (ratio < 0.8)   f2Score = 80; // Below sector — responsible
        else if (ratio < 1.0)   f2Score = 65; // Slightly below
        else if (ratio < 1.2)   f2Score = 50; // Near sector average
        else if (ratio < 1.5)   f2Score = 32; // Above sector
        else                    f2Score = 12; // Far above sector — concerning
    }

    // ── Factor 3: Risk Regime Classification ─────────────────────────────
    let f3Score;
    if (currentDE < 0.3)      f3Score = 95; // Very safe
    else if (currentDE < 0.7) f3Score = 75; // Safe
    else if (currentDE < 1.2) f3Score = 50; // Watch zone
    else if (currentDE < 2.0) f3Score = 25; // Risk zone
    else                      f3Score = 5;  // Danger zone

    // ── Blend ─────────────────────────────────────────────────────────────
    const blended = hasSector
        ? (f1Score * 0.50) + (f2Score * 0.30) + (f3Score * 0.20)
        : (f1Score * 0.65) + (f3Score * 0.35);
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    // ── Bias ──────────────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Dynamic Confidence ────────────────────────────────────────────────
    const confidence = hasSector ? 90 : (currentDE < 0.5 || currentDE > 2.0 ? 82 : 72);

    return { score: finalScore, bias, confidence, leverageZone };
}

function generateAiInsight(currentDE, sectorDE, leverageZone) {
    if (currentDE === null || isNaN(currentDE)) {
        return 'Waiting for Debt-to-Equity data to generate insight.';
    }

    let base = `D/E ratio of ${currentDE.toFixed(2)}x places the company in the "${leverageZone}" zone.`;

    if (sectorDE !== null && !isNaN(sectorDE)) {
        const vsStr = currentDE < sectorDE
            ? `${((1 - currentDE / sectorDE) * 100).toFixed(1)}% below the sector average of ${sectorDE.toFixed(2)}x`
            : `${((currentDE / sectorDE - 1) * 100).toFixed(1)}% above the sector average of ${sectorDE.toFixed(2)}x`;
        base += ` This is ${vsStr}.`;
    }

    if (currentDE < 0.3) {
        return base + ' An extremely clean balance sheet with negligible debt. The company has the financial firepower to self-fund growth or absorb acquisitions without distress.';
    } else if (currentDE < 0.7) {
        return base + ' A conservative capital structure that balances growth investment with financial stability. Low risk of solvency issues even in economic downturns.';
    } else if (currentDE < 1.2) {
        return base + ' Leverage is moderate and within manageable bounds. Monitor interest coverage to ensure EBIT comfortably services debt obligations.';
    } else if (currentDE < 2.0) {
        return base + ' Elevated leverage is a concern. A significant economic slowdown or margin compression could create debt servicing difficulties. Scrutinize the debt maturity profile.';
    } else {
        return base + ' Dangerously high leverage exposes the company to severe financial stress. Any earnings deterioration risks covenant breaches and potential equity dilution.';
    }
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function DebtToEquityCard({ data, manualOverride, lastUpdated }) {
    let isManual = true;
    let extractedValue = null;
    let extractedSector = null;

    // Attempt 1: From Ratios (Upstox)
    const ratioObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r =>
        r.name?.toLowerCase().includes('debt to equity') ||
        r.name?.toLowerCase() === 'd/e'
    );

    if (ratioObj?.company_value) {
        const parsed = parseFloat(ratioObj.company_value);
        if (!isNaN(parsed)) { extractedValue = parsed; isManual = false; }
        if (ratioObj.sector_value) {
            const parsedSector = parseFloat(ratioObj.sector_value);
            if (!isNaN(parsedSector)) extractedSector = parsedSector;
        }
    }

    // Attempt 2: Calculate from Balance Sheet (if ratios missed it)
    if (isManual && data?.balanceSheet) {
        const bsHistory = Array.isArray(data.balanceSheet.history) ? data.balanceSheet.history : [];
        const fullStmt = Array.isArray(data.balanceSheet.full_statement) ? data.balanceSheet.full_statement : [];
        const latestSummary = bsHistory[0];
        const equityObj = fullStmt.find(m => m.particular?.toLowerCase().includes('equity capital'));

        if (latestSummary?.total_liability !== undefined && equityObj?.history?.length > 0) {
            const latestEquity = equityObj.history[0].value;
            if (latestEquity > 0) {
                extractedValue = latestSummary.total_liability / latestEquity;
                isManual = false;
            }
        }
    }

    const currentDE = isManual
        ? (manualOverride !== undefined && manualOverride !== null ? parseFloat(manualOverride) : null)
        : extractedValue;
    const sectorDE = isManual ? null : extractedSector;

    const configData = getIndicatorConfig('debt_to_equity');
    const { score, bias, confidence, leverageZone } = scoreDebtToEquity(currentDE, sectorDE);
    const aiInsightText = generateAiInsight(currentDE, sectorDE, leverageZone);

    return (
        <IndicatorCard
            config={{
                title: 'Debt to Equity',
                category: 'Financial Health',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore ?? 5,
                updateTime: lastUpdated ?? '--:--',
                source: isManual ? 'Manual' : (extractedSector ? 'Upstox Ratios' : 'Upstox Balance Stmt'),
                aiModel: configData?.aiModel ?? 'Engine v3'
            }}
            data={{
                currentValueObj: { label: 'D/E Ratio', value: currentDE !== null ? currentDE.toFixed(2) : '--' },
                details: [
                    { label: 'Leverage Zone', value: leverageZone, isManual: false },
                    sectorDE !== null && !isNaN(sectorDE) && { label: 'Sector D/E', value: sectorDE.toFixed(2), isManual: false }
                ].filter(Boolean),
                score: score ?? 0,
                bias: bias ?? 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 6.0
            }}
            chartData={{ points: [], valueKey: 'value', valueName: 'D/E Ratio' }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'Measures the proportion of debt vs shareholder equity financing the business.',
                    'Higher D/E amplifies returns in good times but accelerates losses in bad times.',
                    'Capital-intensive industries (Infra, Metals) can sustain higher D/E vs asset-light sectors.',
                    'Track in conjunction with Interest Coverage — high D/E + low coverage = red flag.',
                    'Sector-relative D/E reveals whether leverage is a strategic choice or a necessity.'
                ]
            }}
        />
    );
}
