import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

function scoreROE(currentROE, sectorROE) {
    if (currentROE === null || isNaN(currentROE)) {
        return { score: 50, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
    }

    let score = 50;
    let bias = 'Neutral';
    let trendDesc = "Average";

    if (sectorROE !== null && !isNaN(sectorROE)) {
        // Comparative Scoring
        const spread = currentROE - sectorROE;
        if (currentROE > 20 && spread > 5) {
            score = 95; bias = 'Strong Bullish'; trendDesc = "Exceptional Compounder";
        } else if (currentROE > 15 && spread > 0) {
            score = 85; bias = 'Bullish'; trendDesc = "Outperforming Sector";
        } else if (currentROE >= 10 && spread >= -2) {
            score = 60; bias = 'Neutral'; trendDesc = "In-line with Sector";
        } else if (currentROE > 0) {
            score = 30; bias = 'Bearish'; trendDesc = "Underperforming";
        } else {
            score = 10; bias = 'Strong Bearish'; trendDesc = "Value Destroyer";
        }
    } else {
        // Absolute Scoring
        if (currentROE > 20) {
            score = 90; bias = 'Strong Bullish'; trendDesc = "High Return on Capital";
        } else if (currentROE > 15) {
            score = 75; bias = 'Bullish'; trendDesc = "Solid Returns";
        } else if (currentROE >= 10) {
            score = 50; bias = 'Neutral'; trendDesc = "Cost of Capital";
        } else if (currentROE > 0) {
            score = 30; bias = 'Bearish'; trendDesc = "Sub-par Returns";
        } else {
            score = 10; bias = 'Strong Bearish'; trendDesc = "Value Destroyer";
        }
    }

    return { score, bias, confidence: '85%', trendDesc };
}

function generateAiInsight(currentROE, sectorROE, trendDesc) {
    if (currentROE === null || isNaN(currentROE)) {
        return 'Waiting for ROE data to generate insight.';
    }

    let text = `The company generates a Return on Equity (ROE) of ${currentROE.toFixed(2)}%`;
    if (sectorROE !== null && !isNaN(sectorROE)) {
        text += ` compared to the sector average of ${sectorROE.toFixed(2)}%.`;
    } else {
        text += `.`;
    }

    if (trendDesc === "Exceptional Compounder") {
        text += " This indicates a powerful economic moat, highly efficient capital allocation, and strong pricing power.";
    } else if (trendDesc === "Outperforming Sector") {
        text += " Management is effectively utilizing shareholder equity to generate above-average profits.";
    } else if (trendDesc === "Value Destroyer") {
        text += " Negative returns actively destroy shareholder equity. Requires immediate fundamental turnaround.";
    }

    return text;
}

export default function ROECard({ data, manualOverride, lastUpdated }) {
    // 1. Core State & Extraction
    const roeItem = (Array.isArray(data?.ratios) ? data.ratios : []).find(item => 
        item.name?.toLowerCase().includes('return on equity') || 
        item.name?.toLowerCase() === 'roe'
    );
    
    let isManual = true;
    let extractedValue = null;
    let extractedSector = null;

    if (roeItem && roeItem.company_value) {
        const parsed = parseFloat(roeItem.company_value);
        if (!isNaN(parsed)) {
            extractedValue = parsed;
            isManual = false;
        }
        if (roeItem.sector_value) {
            const parsedSector = parseFloat(roeItem.sector_value);
            if (!isNaN(parsedSector)) {
                extractedSector = parsedSector;
            }
        }
    }
    
    const currentROE = isManual ? (manualOverride !== undefined && manualOverride !== null ? parseFloat(manualOverride) : null) : extractedValue;
    const sectorROE = isManual ? null : extractedSector; // Fallback sector not supported if manual

    // 2. Load Central Config
    const configData = getIndicatorConfig('roe');

    // 3. Praxis Engine
    const { score, bias, confidence, trendDesc } = scoreROE(currentROE, sectorROE);
    const aiInsightText = generateAiInsight(currentROE, sectorROE, trendDesc);

        return (
        <IndicatorCard
            config={{
                title: 'ROE',
                category: 'Profitability',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'ROE (%)', value: currentROE !== null ? currentROE.toFixed(2) : '--' },
                details: [
                    { label: 'Sector ROE', value: sectorROE !== null ? sectorROE.toFixed(2) : '--', isManual: false }
                ],
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'ROE (%)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Measures management efficiency.',
                    'Evaluates capital utilization.',
                    'Supports valuation analysis.',
                    'Helps compare companies within the same sector.'
                ]
            }}
        />
    );
}
