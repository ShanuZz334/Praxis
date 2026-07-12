import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

function scoreRevenueGrowth(revenueHistory, manualCAGR) {
    if ((!revenueHistory || revenueHistory.length < 2) && (manualCAGR === null || isNaN(manualCAGR))) {
        return { score: 50, bias: 'Neutral', confidence: '0%', calculatedCAGR: null, latestRevenue: null, previousRevenue: null };
    }

    let score = 50;
    let confidencePoints = 0;
    let calculatedCAGR = null;
    let latestRevenue = null;
    let previousRevenue = null;
    let trendDesc = "Mixed";

    if (revenueHistory && revenueHistory.length >= 2) {
        // revenueHistory is usually sorted latest first
        const chronological = [...revenueHistory].reverse();
        const totalPeriods = chronological.length - 1;
        
        latestRevenue = chronological[totalPeriods].value;
        previousRevenue = chronological[totalPeriods - 1].value;
        const firstRevenue = chronological[0].value;

        if (firstRevenue > 0 && latestRevenue > 0) {
            calculatedCAGR = (Math.pow(latestRevenue / firstRevenue, 1 / totalPeriods) - 1) * 100;
        }
        
        const recentGrowth = previousRevenue > 0 ? ((latestRevenue - previousRevenue) / previousRevenue) * 100 : 0;

        confidencePoints = Math.min(95, 40 + (totalPeriods * 15));

        if (calculatedCAGR > 20) {
            score = 90; trendDesc = "Hyper Growth";
        } else if (calculatedCAGR > 10) {
            if (recentGrowth > calculatedCAGR) { score = 85; trendDesc = "Accelerating Growth"; }
            else { score = 75; trendDesc = "Healthy Growth"; }
        } else if (calculatedCAGR > 0) {
            if (recentGrowth < 0) { score = 40; trendDesc = "Stalling"; }
            else { score = 60; trendDesc = "Moderate Growth"; }
        } else {
            score = 15; trendDesc = "Contraction";
        }
    } else {
        calculatedCAGR = manualCAGR;
        confidencePoints = 60;
        
        if (manualCAGR > 20) { score = 90; trendDesc = "Hyper Growth"; }
        else if (manualCAGR > 10) { score = 75; trendDesc = "Healthy Growth"; }
        else if (manualCAGR > 0) { score = 60; trendDesc = "Moderate Growth"; }
        else if (manualCAGR > -5) { score = 40; trendDesc = "Stalling"; }
        else { score = 15; trendDesc = "Contraction"; }
    }

    let bias = "Neutral";
    if (score >= 80) bias = "Strong Bullish";
    else if (score >= 60) bias = "Bullish";
    else if (score <= 20) bias = "Strong Bearish";
    else if (score <= 40) bias = "Bearish";

    return { score, bias, confidence: `${confidencePoints}%`, calculatedCAGR, latestRevenue, previousRevenue, trendDesc };
}

function generateAiInsight(revenueHistory, cagr, trendDesc) {
    if (!revenueHistory || revenueHistory.length < 2) {
        if (cagr !== null && !isNaN(cagr)) {
            return `Based on manual input, the revenue is growing at a ${cagr}% CAGR, categorized as ${trendDesc}.`;
        }
        return "Waiting for Revenue history to generate insight.";
    }

    let text = `The company has demonstrated ${trendDesc} with a ${cagr !== null ? cagr.toFixed(2) : '--'}% Compound Annual Growth Rate over the analyzed period.`;

    if (trendDesc === "Accelerating Growth") {
        text += " Recent YoY growth exceeds the multi-year average, indicating increasing market penetration or successful new product cycles.";
    } else if (trendDesc === "Contraction") {
        text += " The top-line is shrinking, which is a severe structural red flag. Without revenue growth, profitability can only be maintained through finite cost-cutting.";
    } else if (trendDesc === "Hyper Growth") {
        text += " Sustaining >20% top-line growth at scale is rare and typically commands a significant premium in the market.";
    }

    return text;
}

export default function RevenueGrowthCard({ data = null, manualOverride, lastUpdated }) {
    // 1. Extract Revenue History
    const incomeArray = Array.isArray(data?.income) 
        ? data.income 
        : (Array.isArray(data?.income?.full_statement) ? data.income.full_statement : []);
    const revObj = incomeArray.find(m => {
        const p = m.particular?.toLowerCase() || '';
        const hasHistory = Array.isArray(m.history) && m.history.length >= 2;
        return hasHistory && (p === 'total revenue' || p === 'revenue' || p.includes('revenue') || p.includes('sales'));
    });

    let revenueHistory = null;
    if (revObj && Array.isArray(revObj.history) && revObj.history.length > 0) {
        revenueHistory = revObj.history;
    }

    const isManual = !revenueHistory || revenueHistory.length < 2;
    const manualCAGR = isManual && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? parseFloat(manualOverride) 
        : null;

    // 2. Load Central Config
    const configData = getIndicatorConfig('revenue_growth');

    // 3. Praxis Engine
    const { score, bias, confidence, calculatedCAGR, latestRevenue, previousRevenue, trendDesc } = scoreRevenueGrowth(revenueHistory, manualCAGR);
    const aiInsightText = generateAiInsight(revenueHistory, calculatedCAGR, trendDesc);

        return (
        <IndicatorCard
            config={{
                title: 'Revenue Growth',
                category: 'Growth',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox Income Stmt',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'CAGR (%)', value: calculatedCAGR !== null ? calculatedCAGR.toFixed(2) : '--' },
                details: [
                    { label: 'Latest Revenue', value: latestRevenue !== null ? latestRevenue : '--', isManual: isManual },
                    { label: 'Previous Revenue', value: previousRevenue !== null ? previousRevenue : '--', isManual: isManual }
                ],
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: revenueHistory ? [...revenueHistory].reverse().map(h => ({ name: h.period, value: h.value })) : [],
                valueKey: 'value',
                valueName: 'Revenue'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Measures top-line growth.',
                    'Indicates market demand and expansion.',
                    'First step to achieving profitability.'
                ]
            }}
        />
    );
}
