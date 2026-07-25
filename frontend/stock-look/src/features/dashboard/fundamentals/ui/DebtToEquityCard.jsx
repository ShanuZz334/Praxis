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

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scoreDebtToEquity, generateAiInsightDebtToEquityCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

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
        const parsed = cleanNum(ratioObj.company_value);
        if (!isNaN(parsed)) { extractedValue = parsed; isManual = false; }
        if (ratioObj.sector_value) {
            const parsedSector = cleanNum(ratioObj.sector_value);
            if (!isNaN(parsedSector)) extractedSector = parsedSector;
        }
    }

    // Attempt 2: Calculate from Balance Sheet (if ratios missed it)
    if (isManual && data?.balanceSheet) {
        const fullStmt = Array.isArray(data.balanceSheet.full_statement) ? data.balanceSheet.full_statement : [];
        const equityObj = fullStmt.find(m => m.particular === 'Equity Capital');
        const nonCurrLiabObj = fullStmt.find(m => m.particular === 'Non-Current Liabilities');
        const currLiabObj = fullStmt.find(m => m.particular === 'Current Liabilities');

        if (equityObj?.history?.length > 0 && (nonCurrLiabObj || currLiabObj)) {
            const latestEquity = equityObj.history[0].value;
            const ncl = nonCurrLiabObj?.history?.[0]?.value || 0;
            const cl = currLiabObj?.history?.[0]?.value || 0;
            const totalDebt = ncl + cl;
            if (latestEquity > 0) {
                extractedValue = totalDebt / latestEquity;
                isManual = false;
            }
        }
    }

    const currentDE = isManual
        ? (manualOverride !== undefined && manualOverride !== null ? cleanNum(manualOverride) : null)
        : extractedValue;
    const sectorDE = isManual ? null : extractedSector;

    const configData = getIndicatorConfig(CARD_REGISTRY.debt_to_equity.id);
    const { score, bias, leverageZone } = scoreDebtToEquity(currentDE, sectorDE);
    
    const cCard = computeCardConfidence({
        hasLiveData: !isManual,
        isManual: !!manualOverride && isManual,
        sourcePipeline: isManual ? 'manual' : (extractedSector ? 'upstox' : 'upstox'),
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
    }, 'fundamentals');
    const aiInsightText = generateAiInsightDebtToEquityCard(currentDE, sectorDE, leverageZone);

    return (
        <IndicatorCard
            config={{
                title: 'Debt to Equity',
                category: 'Financial Health',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore ?? 5,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--'),
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
                confidence: `${cCard}%`,
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
