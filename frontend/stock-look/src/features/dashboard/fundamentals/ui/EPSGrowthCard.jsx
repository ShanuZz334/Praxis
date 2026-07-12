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
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { formatPercentage } from '@/shared/utils/formatters';

// ─── Industry-Grade Scoring Engine ──────────────────────────────────────────
function scoreEPSGrowth(cagr, latestYoY, positiveYears, totalPeriods) {
    if (cagr === null || isNaN(cagr)) {
        return { score: 0, bias: 'Neutral', confidence: 0, growthTier: 'Unknown', momentumLabel: 'Unknown' };
    }

    // ── Factor 1: CAGR Level (0–100) ─────────────────────────────────────
    let f1Score;
    let growthTier;
    if (cagr > 25) {
        f1Score = 95; growthTier = 'Exceptional Compounder';
    } else if (cagr > 15) {
        f1Score = 82; growthTier = 'Strong Growth';
    } else if (cagr > 8) {
        f1Score = 65; growthTier = 'Healthy Growth';
    } else if (cagr > 0) {
        f1Score = 48; growthTier = 'Modest Growth';
    } else if (cagr > -10) {
        f1Score = 25; growthTier = 'Earnings Contraction';
    } else {
        f1Score = 8;  growthTier = 'Severe EPS Decline';
    }

    // ── Factor 2: Latest YoY Momentum (acceleration vs deceleration) ──────
    let f2Score = f1Score;
    let momentumLabel = 'Stable';
    if (latestYoY !== null && !isNaN(latestYoY) && cagr !== 0) {
        const accelerating = latestYoY > cagr + 5;
        const decelerating = latestYoY < cagr - 5;
        if (accelerating) {
            f2Score = Math.min(100, f1Score + 12); momentumLabel = 'Accelerating ↑';
        } else if (decelerating && latestYoY < 0) {
            f2Score = Math.max(0, f1Score - 20); momentumLabel = 'Sharply Decelerating ↓';
        } else if (decelerating) {
            f2Score = Math.max(0, f1Score - 8); momentumLabel = 'Decelerating ↓';
        } else {
            momentumLabel = 'Steady';
        }
    }

    // ── Factor 3: Earnings Consistency ────────────────────────────────────
    let f3Score = 50;
    if (totalPeriods > 0 && positiveYears !== null) {
        const consistencyRatio = positiveYears / totalPeriods;
        if (consistencyRatio >= 1.0)       f3Score = 92;
        else if (consistencyRatio >= 0.75) f3Score = 72;
        else if (consistencyRatio >= 0.5)  f3Score = 50;
        else if (consistencyRatio >= 0.25) f3Score = 28;
        else                               f3Score = 10;
    }

    // ── Blend ─────────────────────────────────────────────────────────────
    const hasHistory = totalPeriods > 0;
    const blended = hasHistory
        ? (f1Score * 0.45) + (f2Score * 0.35) + (f3Score * 0.20)
        : f1Score;
    const finalScore = Math.round(Math.max(0, Math.min(100, blended)));

    // ── Bias ──────────────────────────────────────────────────────────────
    let bias;
    if (finalScore >= 80)      bias = 'Strong Bullish';
    else if (finalScore >= 62) bias = 'Bullish';
    else if (finalScore >= 42) bias = 'Neutral';
    else if (finalScore >= 25) bias = 'Bearish';
    else                       bias = 'Strong Bearish';

    // ── Confidence scales with data richness ──────────────────────────────
    let confidence;
    if (totalPeriods >= 5)      confidence = 90;
    else if (totalPeriods >= 3) confidence = 80;
    else if (totalPeriods >= 2) confidence = 70;
    else                        confidence = 55; // Manual only

    return { score: finalScore, bias, confidence, growthTier, momentumLabel };
}

// ─── Dynamic AI Insight Generator ─────────────────────────────────────────
function generateAiInsight(cagr, latestYoY, growthTier, momentumLabel, totalPeriods) {
    if (cagr === null || isNaN(cagr)) {
        return 'EPS Growth will be auto-computed from Upstox income statement history when available. Alternatively, enter the YoY or CAGR EPS growth manually.';
    }

    const cagrStr = cagr.toFixed(2);
    const source = totalPeriods >= 2 ? `over ${totalPeriods} periods of EPS history` : 'based on manual input';

    let base = `EPS has compounded at ${cagrStr}% annually ${source}, classified as "${growthTier}".`;

    if (latestYoY !== null && !isNaN(latestYoY)) {
        base += ` Latest YoY EPS growth: ${latestYoY.toFixed(2)}% (${momentumLabel}).`;
    }

    if (growthTier === 'Exceptional Compounder') {
        return base + ' Compounding EPS at >25% consistently is exceedingly rare and is the signature of a dominant franchise with strong pricing power and reinvestment capacity.';
    } else if (growthTier === 'Strong Growth' && momentumLabel.includes('Accelerating')) {
        return base + ' Accelerating earnings growth — the business is gaining operational leverage as revenue scales faster than costs, a highly coveted quality.';
    } else if (growthTier === 'Earnings Contraction') {
        return base + ' Declining EPS over multiple years signals a structural deterioration in profitability. The market typically de-rates such companies with a valuation multiple compression.';
    } else if (growthTier === 'Severe EPS Decline') {
        return base + ' Severe earnings contraction indicates significant distress. Either cost inflation is overwhelming revenues, or core demand is collapsing.';
    }
    return base + ' Monitoring the trend of EPS acceleration or deceleration matters as much as the absolute growth rate itself.';
}

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
        const parsed = parseFloat(ratioEPS.company_value);
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
            ? parseFloat(manualOverride) : null;
        if (parsed !== null && !isNaN(parsed)) {
            cagr = parsed;
            totalPeriods = 0;
        }
    }

    const configData = getIndicatorConfig('eps_growth');
    const { score, bias, confidence, growthTier, momentumLabel } = scoreEPSGrowth(cagr, latestYoY, positiveYears, totalPeriods);
    const aiInsightText = generateAiInsight(cagr, latestYoY, growthTier, momentumLabel, totalPeriods);

    return (
        <IndicatorCard
            config={{
                title: 'EPS Growth',
                category: 'Growth',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore ?? 5,
                updateTime: lastUpdated ?? '--:--',
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
