import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

function scoreOperatingMargin(currentMargin, sectorMargin) {
    if (currentMargin === null || isNaN(currentMargin)) {
        return { score: 50, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
    }

    // Factor 1: Absolute operating margin level
    let f1Score;
    let trendDesc;
    if (currentMargin > 25) {
        f1Score = 95; trendDesc = "Exceptional Operations";
    } else if (currentMargin > 18) {
        f1Score = 82; trendDesc = "High Operating Leverage";
    } else if (currentMargin >= 10) {
        f1Score = 60; trendDesc = "Healthy Operations";
    } else if (currentMargin > 0) {
        f1Score = 30; trendDesc = "Weak Operations";
    } else {
        f1Score = 5; trendDesc = "Operating Loss";
    }

    // Factor 2: Sector comparison (35% weight when available)
    let hasSector = false;
    let f2Score = f1Score;
    if (sectorMargin !== null && !isNaN(sectorMargin)) {
        hasSector = true;
        const spread = currentMargin - sectorMargin;
        if (spread > 8)       f2Score = 95;
        else if (spread > 3)  f2Score = 80;
        else if (spread > -2) f2Score = 60;
        else if (spread > -7) f2Score = 35;
        else                  f2Score = 10;
    }

    const blended = hasSector ? (f1Score * 0.65) + (f2Score * 0.35) : f1Score;
    const score = Math.round(Math.max(0, Math.min(100, blended)));

    let bias;
    if (score >= 80)      bias = 'Strong Bullish';
    else if (score >= 60) bias = 'Bullish';
    else if (score >= 40) bias = 'Neutral';
    else if (score >= 20) bias = 'Bearish';
    else                  bias = 'Strong Bearish';

    const confidence = hasSector ? '90%' : (currentMargin > 25 || currentMargin < 0 ? '82%' : '72%');
    return { score, bias, confidence, trendDesc };
}

function generateAiInsight(currentMargin, trendDesc) {
    if (currentMargin === null || isNaN(currentMargin)) {
        return 'Waiting for Operating Margin data to generate insight.';
    }

    let text = `The core business operations yield a margin of ${currentMargin.toFixed(2)}%.`;

    if (trendDesc === "Exceptional Operations") {
        text += " This highly lucrative margin suggests a wide economic moat, dominant market share, and low core operating costs.";
    } else if (trendDesc === "High Operating Leverage") {
        text += " The company efficiently manages its cost of goods sold and operating expenses relative to revenue.";
    } else if (trendDesc === "Weak Operations") {
        text += " Core profitability is dangerously thin, leaving little room for error if inflation or competition increases.";
    } else if (trendDesc === "Operating Loss") {
        text += " The core business is structurally unprofitable before even accounting for debt and taxes. Extreme risk.";
    }

    return text;
}

export default function OperatingMarginCard({ data, manualOverride, lastUpdated }) {
    let isManual = true;
    let extractedValue = null;
    let extractedSector = null;

    // Attempt 1: From Ratios (Upstox)
    const opMarginItem = (Array.isArray(data?.ratios) ? data.ratios : []).find(item => 
        item.name?.toLowerCase().includes('operating margin') || 
        item.name?.toLowerCase().includes('operating profit margin') ||
        item.name?.toLowerCase() === 'ebit margin'
    );
    
    if (opMarginItem && opMarginItem.company_value) {
        const parsed = parseFloat(opMarginItem.company_value);
        if (!isNaN(parsed)) {
            extractedValue = parsed;
            isManual = false;
        }
        if (opMarginItem.sector_value) {
            const parsedSector = parseFloat(opMarginItem.sector_value);
            if (!isNaN(parsedSector)) { extractedSector = parsedSector; }
        }
    }

    // Attempt 2: Auto-calculate from Income Statement Summary (if ratios missed it)
    if (isManual) {
        const summaryArray = Array.isArray(data?.income?.summary) ? data.income.summary : [];
            
        const opProfitObj = summaryArray.find(m => m.category === 'operating_profit' && Array.isArray(m.history) && m.history.length >= 1);
        const revObj = summaryArray.find(m => m.category === 'revenue' && Array.isArray(m.history) && m.history.length >= 1);

        if (opProfitObj && revObj) {
            const latestOpProfit = opProfitObj.history[0].value;
            const latestRev = revObj.history[0].value;
            if (latestRev > 0) {
                extractedValue = (latestOpProfit / latestRev) * 100;
                isManual = false; // Successfully calculated!
            }
        }
    }
    
    const currentMargin = isManual ? (manualOverride !== undefined && manualOverride !== null ? parseFloat(manualOverride) : null) : extractedValue;
    const sectorMargin = isManual ? null : extractedSector;

    // 2. Load Central Config
    const configData = getIndicatorConfig('operating_margin');

    // 3. Praxis Engine
    const { score, bias, confidence, trendDesc } = scoreOperatingMargin(currentMargin, sectorMargin);
    const aiInsightText = generateAiInsight(currentMargin, trendDesc);

        return (
        <IndicatorCard
            config={{
                title: 'Operating Margin',
                category: 'Profitability',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : (extractedSector ? 'Upstox Ratios' : 'Upstox Income Stmt (Calc)'),
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Operating Margin (%)', value: currentMargin !== null ? currentMargin.toFixed(2) : '--' },
                details: [
                    sectorMargin !== null && { label: 'Sector Margin', value: sectorMargin.toFixed(2), isManual: false }
                ].filter(Boolean),
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Operating Margin (%)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Measures core business profitability.',
                    'Excludes tax and interest impacts.',
                    'Highlights operational efficiency.'
                ]
            }}
        />
    );
}
