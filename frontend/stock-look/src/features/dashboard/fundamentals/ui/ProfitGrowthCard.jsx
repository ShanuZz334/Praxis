import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

function scoreProfitGrowth(profitHistory, manualCAGR) {
    if ((!profitHistory || profitHistory.length < 2) && (manualCAGR === null || isNaN(manualCAGR))) {
        return { score: 50, bias: 'Neutral', confidence: '0%', calculatedCAGR: null, latestProfit: null, previousProfit: null };
    }

    let score = 50;
    let confidencePoints = 0;
    let calculatedCAGR = null;
    let latestProfit = null;
    let previousProfit = null;
    let trendDesc = "Mixed";

    if (profitHistory && profitHistory.length >= 2) {
        // profitHistory is usually sorted latest first
        const chronological = [...profitHistory].reverse();
        const totalPeriods = chronological.length - 1;
        
        latestProfit = chronological[totalPeriods].value;
        previousProfit = chronological[totalPeriods - 1].value;
        const firstProfit = chronological[0].value;

        if (firstProfit > 0 && latestProfit > 0) {
            calculatedCAGR = (Math.pow(latestProfit / firstProfit, 1 / totalPeriods) - 1) * 100;
        }
        
        const recentGrowth = previousProfit > 0 ? ((latestProfit - previousProfit) / previousProfit) * 100 : 0;

        confidencePoints = Math.min(95, 40 + (totalPeriods * 15));

        if (calculatedCAGR > 25) {
            score = 95; trendDesc = "Explosive Growth";
        } else if (calculatedCAGR > 12) {
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
        
        if (manualCAGR > 25) { score = 95; trendDesc = "Explosive Growth"; }
        else if (manualCAGR > 12) { score = 75; trendDesc = "Healthy Growth"; }
        else if (manualCAGR > 0) { score = 60; trendDesc = "Moderate Growth"; }
        else if (manualCAGR > -5) { score = 40; trendDesc = "Stalling"; }
        else { score = 15; trendDesc = "Contraction"; }
    }

    let bias = "Neutral";
    if (score >= 80) bias = "Strong Bullish";
    else if (score >= 60) bias = "Bullish";
    else if (score <= 20) bias = "Strong Bearish";
    else if (score <= 40) bias = "Bearish";

    return { score, bias, confidence: `${confidencePoints}%`, calculatedCAGR, latestProfit, previousProfit, trendDesc };
}

function generateAiInsight(profitHistory, cagr, trendDesc) {
    if (!profitHistory || profitHistory.length < 2) {
        if (cagr !== null && !isNaN(cagr)) {
            return `Based on manual input, net profit is growing at a ${cagr}% CAGR, categorized as ${trendDesc}.`;
        }
        return "Waiting for Profit history to generate insight.";
    }

    let text = `The company's bottom-line has demonstrated ${trendDesc} with a ${cagr !== null ? cagr.toFixed(2) : '--'}% Compound Annual Growth Rate.`;

    if (trendDesc === "Accelerating Growth") {
        text += " Recent YoY profit growth is outpacing the historical CAGR, highlighting powerful operating leverage.";
    } else if (trendDesc === "Contraction") {
        text += " Net income is actively shrinking. Prolonged profit contraction destroys shareholder equity and dividend sustainability.";
    } else if (trendDesc === "Explosive Growth") {
        text += " Compounding net income at >25% annually indicates phenomenal execution and pricing power.";
    }

    return text;
}

export default function ProfitGrowthCard({ data = null, manualOverride, lastUpdated }) {
    // 1. Extract Profit History
    const incomeArray = Array.isArray(data?.income) 
        ? data.income 
        : (Array.isArray(data?.income?.full_statement) ? data.income.full_statement : []);
    const profitObj = incomeArray.find(m => {
        const p = m.particular?.toLowerCase() || '';
        const hasHistory = Array.isArray(m.history) && m.history.length >= 2;
        return hasHistory && (p === 'profit after tax' || p === 'profit before tax' || p.includes('net profit') || p.includes('net income'));
    });

    let profitHistory = null;
    if (profitObj && Array.isArray(profitObj.history) && profitObj.history.length > 0) {
        profitHistory = profitObj.history;
    }

    const isManual = !profitHistory || profitHistory.length < 2;
    const manualCAGR = isManual && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? parseFloat(manualOverride) 
        : null;

    // 2. Load Central Config
    const configData = getIndicatorConfig('profit_growth');

    // 3. Praxis Engine
    const { score, bias, confidence, calculatedCAGR, latestProfit, previousProfit, trendDesc } = scoreProfitGrowth(profitHistory, manualCAGR);
    const aiInsightText = generateAiInsight(profitHistory, calculatedCAGR, trendDesc);

        return (
        <IndicatorCard
            config={{
                title: 'Profit Growth',
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
                    { label: 'Latest Profit', value: latestProfit !== null ? latestProfit : '--', isManual: isManual },
                    { label: 'Previous Profit', value: previousProfit !== null ? previousProfit : '--', isManual: isManual }
                ],
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: profitHistory ? [...profitHistory].reverse().map(h => ({ name: h.period, value: h.value })) : [],
                valueKey: 'value',
                valueName: 'Profit'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Measures bottom-line growth.',
                    'Important for long-term sustainability.',
                    'Shows efficiency of scaling.'
                ]
            }}
        />
    );
}
