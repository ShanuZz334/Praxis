import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

function scoreEarningsTrend(epsHistory, manualCAGR) {
    if ((!epsHistory || epsHistory.length < 2) && (manualCAGR === null || isNaN(manualCAGR))) {
        return { score: 50, bias: 'Neutral', confidence: '0%', trendLabel: '--', cagr: null };
    }

    let score = 50;
    let confidencePoints = 0;
    let trendLabel = "Unknown";
    let calculatedCAGR = null;

    if (epsHistory && epsHistory.length >= 2) {
        // epsHistory is usually sorted latest first (e.g. Mar 2026, Mar 2025, Mar 2024)
        // Let's reverse it to chronological order
        const chronological = [...epsHistory].reverse();
        
        let positiveYears = 0;
        let negativeYears = 0;
        let totalPeriods = chronological.length - 1;
        
        for (let i = 1; i <= totalPeriods; i++) {
            const prev = chronological[i-1].value;
            const curr = chronological[i].value;
            if (prev > 0) {
                const growth = (curr - prev) / Math.abs(prev);
                if (growth > 0) positiveYears++;
                else negativeYears++;
            }
        }

        const first = chronological[0].value;
        const last = chronological[chronological.length - 1].value;
        
        if (first > 0 && last > 0) {
            calculatedCAGR = (Math.pow(last / first, 1 / totalPeriods) - 1) * 100;
        }

        confidencePoints = Math.min(95, 40 + (totalPeriods * 15));

        if (positiveYears === totalPeriods) {
            score = 90; trendLabel = "Consistent Growth";
        } else if (positiveYears > negativeYears && last > chronological[totalPeriods-1].value) {
            score = 75; trendLabel = "Improving";
        } else if (positiveYears === negativeYears) {
            score = 50; trendLabel = "Volatile / Flat";
        } else if (negativeYears > positiveYears && last < chronological[totalPeriods-1].value) {
            score = 30; trendLabel = "Weakening";
        } else if (negativeYears === totalPeriods) {
            score = 10; trendLabel = "Consistent Decline";
        } else {
            score = 50; trendLabel = "Mixed";
        }
    } else {
        // Manual CAGR fallback
        calculatedCAGR = manualCAGR;
        confidencePoints = 60;
        
        if (manualCAGR > 15) { score = 90; trendLabel = "Consistent Growth"; }
        else if (manualCAGR > 5) { score = 75; trendLabel = "Improving"; }
        else if (manualCAGR > -5) { score = 50; trendLabel = "Stable / Flat"; }
        else if (manualCAGR > -15) { score = 30; trendLabel = "Weakening"; }
        else { score = 10; trendLabel = "Consistent Decline"; }
    }

    let bias = "Neutral";
    if (score >= 80) bias = "Strong Bullish";
    else if (score >= 60) bias = "Bullish";
    else if (score <= 20) bias = "Strong Bearish";
    else if (score <= 40) bias = "Bearish";

    return { score, bias, confidence: `${confidencePoints}%`, trendLabel, cagr: calculatedCAGR };
}

function generateAiInsight(epsHistory, cagr, trendLabel) {
    if (!epsHistory || epsHistory.length < 2) {
        if (cagr !== null && !isNaN(cagr)) {
            return `Manual override indicates a ${cagr}% trend, classified as ${trendLabel}.`;
        }
        return "Insufficient EPS history to determine a reliable earnings trend.";
    }
    
    let text = `Earnings history shows ${trendLabel} over the last ${epsHistory.length} periods`;
    if (cagr !== null) {
        text += `, delivering a Compound Annual Growth Rate (CAGR) of ${cagr.toFixed(2)}%.`;
    } else {
        text += `.`;
    }

    if (trendLabel === "Consistent Growth") text += " This unbroken upward trajectory is highly sought after by institutional investors and commands a valuation premium.";
    else if (trendLabel === "Consistent Decline") text += " A multi-year contraction in earnings is a severe red flag indicating structural headwinds or loss of competitive advantage.";
    else if (trendLabel === "Volatile / Flat") text += " Earnings lack clear directionality, typical of highly cyclical businesses or companies struggling to scale.";

    return text;
}

export default function EarningsTrendCard({ data = null, manualOverride, lastUpdated }) {
    // 1. Find EPS history from Income Statement
    const incomeArray = Array.isArray(data?.income) 
        ? data.income 
        : (Array.isArray(data?.income?.full_statement) ? data.income.full_statement : []);
    const epsObj = incomeArray.find(r => r.particular === 'EPS - Basic' || r.particular === 'EPS - Diluted');
    
    let epsHistory = null;
    if (epsObj && Array.isArray(epsObj.history) && epsObj.history.length > 0) {
        epsHistory = epsObj.history;
    }

    const isManual = !epsHistory || epsHistory.length < 2;
    const manualCAGR = isManual && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? parseFloat(manualOverride) 
        : null;

    // Centralized Config
    const configData = getIndicatorConfig('earnings_trend');

    // --- Scoring Engine ---
    const { score, bias, confidence, trendLabel, cagr } = scoreEarningsTrend(epsHistory, manualCAGR);
    const aiInsightText = generateAiInsight(epsHistory, cagr, trendLabel);

        return (
        <IndicatorCard
            config={{
                title: 'Earnings Trend',
                category: 'Market Health',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox Income Stmt',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Overall Trend', value: trendLabel },
                details: [
                    cagr !== null && !isNaN(cagr) && { label: 'Calculated CAGR', value: cagr.toFixed(2) + '%', isManual: isManual },
                    { label: 'Periods Analyzed', value: epsHistory ? `${epsHistory.length} Years` : (isManual ? 'Manual Input' : '--'), isManual: isManual }
                ].filter(Boolean),
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: epsHistory ? [...epsHistory].reverse().map(h => ({ name: h.period, value: h.value })) : [],
                valueKey: 'value',
                valueName: 'EPS'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Shows trajectory of corporate profitability.',
                    'Leading indicator for stock price movement.',
                    'Helps identify business cycle phases.'
                ]
            }}
        />
    );
}
