/**
 * @file EPSGrowthCard.jsx
 * @purpose Displays EPS Growth Rate — computed from income statement history or manual override.
 *
 * DATA SOURCES (in priority order):
 *  1. AUTO: Calculate YoY EPS Growth from Upstox income statement history
 *     - Looks for 'EPS - Basic' or 'EPS - Diluted' in data.income / data.income.full_statement
 *     - Computes multi-year CAGR + latest YoY growth
 *  2. AUTO: From Upstox ratios array (eps_growth if served directly)
 *  3. MANUAL: manualOverride (user-entered % growth)
 *
 * SCORING ENGINE: Multi-factor blended approach
 *   Factor 1 (45%): CAGR level vs industry benchmarks
 *   Factor 2 (35%): Latest YoY momentum (acceleration vs deceleration)
 *   Factor 3 (20%): Earnings consistency (positive years count)
 *
 * Confidence scales with number of EPS periods available:
 *   - 5+ years: 90%
 *   - 3–4 years: 80%
 *   - 2 years: 70%
 *   - Manual only: 55%
 */
import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { formatPercentage } from '@/shared/utils/formatters';
import { scoreEPSGrowth, generateAiInsightEPSGrowthCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

// ─── Main Component ─────────────────────────────────────────────────────────
export default function EPSGrowthCard({ data = null, manualOverride, lastUpdated }) {
    let isManual = true;
    let cagr = null;
    let latestYoY = null;
    let positiveYears = null;
    let totalPeriods = 0;
    let sourceLabel = 'Manual';
    let epsHistory = null;

    // ── Attempt 1: From Upstox ratios (if served directly) ─────────────────
    const ratioEPS = (Array.isArray(data?.ratios) ? data.ratios : []).find(r =>
        r.name?.toLowerCase().includes('eps growth') || r.name?.toLowerCase() === 'eps growth'
    );
    if (ratioEPS?.company_value) {
        const parsed = cleanNum(ratioEPS.company_value);
        if (!isNaN(parsed)) {
            cagr = parsed;
            isManual = false;
            sourceLabel = 'Upstox Ratios';
        }
    }

    // ── Attempt 2: Calculate from EPS history in income statement ──────────
    if (isManual) {
        const incomeArray = Array.isArray(data?.income)
            ? data.income
            : (Array.isArray(data?.income?.full_statement) ? data.income.full_statement : []);

        const epsObj = incomeArray.find(r =>
            r.particular === 'EPS - Basic' || r.particular === 'EPS - Diluted' ||
            r.particular?.toLowerCase().includes('eps')
        );

        if (epsObj && Array.isArray(epsObj.history) && epsObj.history.length >= 2) {
            epsHistory = epsObj.history;
            // History is latest-first — reverse to chronological
            const chronological = [...epsHistory].reverse();
            totalPeriods = chronological.length - 1;
            const first = chronological[0].value;
            const last = chronological[chronological.length - 1].value;
            const prev = chronological[chronological.length - 2].value;

            // CAGR
            if (first > 0 && last > 0) {
                cagr = (Math.pow(last / first, 1 / totalPeriods) - 1) * 100;
            }

            // Latest YoY
            if (prev !== 0) {
                latestYoY = ((last - prev) / Math.abs(prev)) * 100;
            }

            // Positive year count
            positiveYears = 0;
            for (let i = 1; i < chronological.length; i++) {
                if (chronological[i].value > chronological[i - 1].value) positiveYears++;
            }

            isManual = false;
            sourceLabel = 'Upstox Income Stmt (Calc)';
        }
    }

    // ── Attempt 3: Manual override fallback ───────────────────────────────
    if (isManual) {
        const parsed = manualOverride !== undefined && manualOverride !== null && manualOverride !== ''
            ? cleanNum(manualOverride) : null;
        if (parsed !== null && !isNaN(parsed)) {
            cagr = parsed;
            totalPeriods = 0;
        }
    }

    const configData = getIndicatorConfig('eps_growth');
    const { score, bias, confidence, growthTier, momentumLabel } = scoreEPSGrowth(cagr, latestYoY, positiveYears, totalPeriods);
    const aiInsightText = generateAiInsightEPSGrowthCard(cagr, latestYoY, growthTier, momentumLabel, totalPeriods);

    return (
        <IndicatorCard
            config={{
                title: 'EPS Growth',
                category: 'Growth',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore ?? 5,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--'),
                source: sourceLabel,
                aiModel: configData?.aiModel ?? 'Engine v3'
            }}
            data={{
                currentValueObj: {
                    label: totalPeriods >= 2 ? 'EPS CAGR' : 'EPS Growth',
                    value: cagr !== null && !isNaN(cagr) ? formatPercentage(cagr) : '--'
                },
                details: [
                    { label: 'Growth Tier', value: growthTier, isManual: false },
                    latestYoY !== null && !isNaN(latestYoY) && {
                        label: 'Latest YoY',
                        value: formatPercentage(latestYoY),
                        isManual: false
                    },
                    latestYoY !== null && { label: 'Momentum', value: momentumLabel, isManual: false },
                    totalPeriods >= 2 && positiveYears !== null && {
                        label: 'Positive Yrs',
                        value: `${positiveYears} / ${totalPeriods}`,
                        isManual: false
                    }
                ].filter(Boolean),
                score: score ?? 0,
                bias: bias ?? 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 8.0
            }}
            chartData={{
                points: epsHistory
                    ? [...epsHistory].reverse().map(h => ({ name: h.period, value: h.value }))
                    : [],
                valueKey: 'value',
                valueName: 'EPS'
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'EPS growth is the single most important driver of long-term stock price appreciation.',
                    'Sustained EPS compounding above 15% qualifies a company as a potential long-term multi-bagger.',
                    'EPS growth acceleration (latest YoY > historical CAGR) signals operational leverage kicking in.',
                    'EPS growth without corresponding cash flow growth is a quality red flag — check FCF.',
                    'PEG ratio (P/E ÷ EPS Growth) < 1.0 is the classic value-growth sweet spot (Peter Lynch).'
                ]
            }}
        />
    );
}
