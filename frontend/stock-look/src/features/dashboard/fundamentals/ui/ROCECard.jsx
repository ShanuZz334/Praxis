import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

function scoreROCE(currentROCE, sectorROCE) {
    if (currentROCE === null || isNaN(currentROCE)) {
        return { score: 50, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
    }

    let score = 50;
    let bias = 'Neutral';
    let trendDesc = "Average";

    if (sectorROCE !== null && !isNaN(sectorROCE)) {
        // Comparative Scoring
        const spread = currentROCE - sectorROCE;
        if (currentROCE > 25 && spread > 5) {
            score = 95; bias = 'Strong Bullish'; trendDesc = "Elite Capital Allocator";
        } else if (currentROCE > 15 && spread > 0) {
            score = 85; bias = 'Bullish'; trendDesc = "Outperforming Sector";
        } else if (currentROCE >= 10 && spread >= -2) {
            score = 60; bias = 'Neutral'; trendDesc = "In-line with Sector";
        } else if (currentROCE > 0) {
            score = 30; bias = 'Bearish'; trendDesc = "Underperforming";
        } else {
            score = 10; bias = 'Strong Bearish'; trendDesc = "Capital Destroyer";
        }
    } else {
        // Absolute Scoring
        if (currentROCE > 25) {
            score = 90; bias = 'Strong Bullish'; trendDesc = "High Capital Efficiency";
        } else if (currentROCE > 15) {
            score = 75; bias = 'Bullish'; trendDesc = "Solid Efficiency";
        } else if (currentROCE >= 10) {
            score = 50; bias = 'Neutral'; trendDesc = "Acceptable Efficiency";
        } else if (currentROCE > 0) {
            score = 30; bias = 'Bearish'; trendDesc = "Sub-par Efficiency";
        } else {
            score = 10; bias = 'Strong Bearish'; trendDesc = "Capital Destroyer";
        }
    }

    const confidence = sectorROCE !== null && !isNaN(sectorROCE) ? 90 : (currentROCE > 25 || currentROCE < 0 ? 80 : 72);
    return { score, bias, confidence, trendDesc };
}

function generateAiInsight(currentROCE, sectorROCE, trendDesc) {
    if (currentROCE === null || isNaN(currentROCE)) {
        return 'Waiting for ROCE data to generate insight.';
    }

    let text = `The company generates a Return on Capital Employed (ROCE) of ${currentROCE.toFixed(2)}%`;
    if (sectorROCE !== null && !isNaN(sectorROCE)) {
        text += ` compared to the sector average of ${sectorROCE.toFixed(2)}%.`;
    } else {
        text += `.`;
    }

    if (trendDesc === "Elite Capital Allocator") {
        text += " This indicates phenomenal capital allocation skills, compounding both equity and debt capital at exceptionally high rates.";
    } else if (trendDesc === "Outperforming Sector") {
        text += " Management is utilizing total capital more efficiently than industry peers.";
    } else if (trendDesc === "Capital Destroyer") {
        text += " The core business is failing to cover the blended cost of debt and equity capital, leading to structural value destruction.";
    }

    return text;
}

export default function ROCECard({ data, manualOverride, lastUpdated }) {
    // 1. Core State & Extraction
    const roceItem = (Array.isArray(data?.ratios) ? data.ratios : []).find(item => 
        item.name?.toLowerCase().includes('return on capital employed') || 
        item.name?.toLowerCase() === 'roce'
    );
    
    let isManual = true;
    let extractedValue = null;
    let extractedSector = null;

    if (roceItem && roceItem.company_value) {
        const parsed = parseFloat(roceItem.company_value);
        if (!isNaN(parsed)) {
            extractedValue = parsed;
            isManual = false;
        }
        if (roceItem.sector_value) {
            const parsedSector = parseFloat(roceItem.sector_value);
            if (!isNaN(parsedSector)) {
                extractedSector = parsedSector;
            }
        }
    }
    
    const currentROCE = isManual ? (manualOverride !== undefined && manualOverride !== null ? parseFloat(manualOverride) : null) : extractedValue;
    const sectorROCE = isManual ? null : extractedSector;

    // 2. Load Central Config
    const configData = getIndicatorConfig('roce');

    // 3. Praxis Engine
    const { score, bias, confidence, trendDesc } = scoreROCE(currentROCE, sectorROCE);
    const aiInsightText = generateAiInsight(currentROCE, sectorROCE, trendDesc);

        return (
        <IndicatorCard
            config={{
                title: 'ROCE',
                category: 'Profitability',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'ROCE (%)', value: currentROCE !== null ? currentROCE.toFixed(2) : '--' },
                details: [
                    sectorROCE !== null && !isNaN(sectorROCE) && { label: 'Sector ROCE', value: sectorROCE.toFixed(2) + '%', isManual: false }
                ].filter(Boolean),
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'ROCE (%)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Shows how well a company uses both debt and equity.',
                    'Crucial for capital-intensive industries.',
                    'Long-term value creation indicator.'
                ]
            }}
        />
    );
}
