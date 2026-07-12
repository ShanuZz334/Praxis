import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

function scoreNetMargin(currentMargin) {
    if (currentMargin === null || isNaN(currentMargin)) {
        return { score: 50, bias: 'Neutral', confidence: '0%', trendDesc: "Unknown" };
    }

    let score = 50;
    let bias = 'Neutral';
    let trendDesc = "Average";

    if (currentMargin > 20) {
        score = 95; bias = 'Strong Bullish'; trendDesc = "Exceptional Profitability";
    } else if (currentMargin > 15) {
        score = 82; bias = 'Bullish'; trendDesc = "High Margin";
    } else if (currentMargin >= 10) {
        score = 60; bias = 'Neutral'; trendDesc = "Healthy Margin";
    } else if (currentMargin > 0) {
        score = 30; bias = 'Bearish'; trendDesc = "Thin Margin";
    } else {
        score = 5; bias = 'Strong Bearish'; trendDesc = "Loss Making";
    }

    return { score, bias, confidence: '85%', trendDesc };
}

function generateAiInsight(currentMargin, trendDesc) {
    if (currentMargin === null || isNaN(currentMargin)) {
        return 'Waiting for Net Margin data to generate insight.';
    }

    let text = `The company converts ${currentMargin.toFixed(2)}% of its total revenue into pure bottom-line profit.`;

    if (trendDesc === "Exceptional Profitability") {
        text += " Margins above 20% are typically reserved for software, asset-light tech, or companies with highly dominant monopolies.";
    } else if (trendDesc === "High Margin") {
        text += " This demonstrates strong pricing power and excellent cost controls.";
    } else if (trendDesc === "Thin Margin") {
        text += " The business operates on razor-thin margins, making it highly sensitive to minor increases in operating costs or inflation.";
    } else if (trendDesc === "Loss Making") {
        text += " The business is structurally unprofitable at the bottom line, indicating cash burn.";
    }

    return text;
}

export default function NetMarginCard({ data, manualOverride, lastUpdated }) {
    let isManual = true;
    let extractedValue = null;
    let extractedSector = null;

    // Attempt 1: From Ratios (Upstox)
    const netMarginItem = (Array.isArray(data?.ratios) ? data.ratios : []).find(item => 
        item.name?.toLowerCase().includes('net profit margin') || 
        item.name?.toLowerCase().includes('net margin') ||
        item.name?.toLowerCase() === 'pat margin'
    );
    
    if (netMarginItem && netMarginItem.company_value) {
        const parsed = parseFloat(netMarginItem.company_value);
        if (!isNaN(parsed)) {
            extractedValue = parsed;
            isManual = false;
        }
        if (netMarginItem.sector_value) {
            const parsedSector = parseFloat(netMarginItem.sector_value);
            if (!isNaN(parsedSector)) { extractedSector = parsedSector; }
        }
    }

    // Attempt 2: Auto-calculate from Income Statement (if ratios missed it)
    if (isManual) {
        const incomeArray = Array.isArray(data?.income) 
            ? data.income 
            : (Array.isArray(data?.income?.full_statement) ? data.income.full_statement : []);
            
        const profitObj = incomeArray.find(m => {
            const p = m.particular?.toLowerCase() || '';
            return Array.isArray(m.history) && m.history.length >= 1 && (p === 'profit after tax' || p === 'profit before tax' || p.includes('net profit') || p.includes('net income'));
        });
        
        const revObj = incomeArray.find(m => {
            const p = m.particular?.toLowerCase() || '';
            return Array.isArray(m.history) && m.history.length >= 1 && (p === 'total revenue' || p === 'revenue' || p.includes('revenue') || p.includes('sales'));
        });

        if (profitObj && revObj) {
            const latestProfit = profitObj.history[0].value;
            const latestRev = revObj.history[0].value;
            if (latestRev > 0) {
                extractedValue = (latestProfit / latestRev) * 100;
                isManual = false; // Successfully calculated from live data!
            }
        }
    }
    
    const currentMargin = isManual ? (manualOverride !== undefined && manualOverride !== null ? parseFloat(manualOverride) : null) : extractedValue;
    const sectorMargin = isManual ? null : extractedSector;

    // 2. Load Central Config
    const configData = getIndicatorConfig('net_margin');

    // 3. Praxis Engine
    const { score, bias, confidence, trendDesc } = scoreNetMargin(currentMargin);
    const aiInsightText = generateAiInsight(currentMargin, trendDesc);

        return (
        <IndicatorCard
            config={{
                title: 'Net Margin',
                category: 'Profitability',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : (extractedSector ? 'Upstox Ratios' : 'Upstox Income Stmt (Calc)'),
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Net Margin (%)', value: currentMargin !== null ? currentMargin.toFixed(2) : '--' },
                details: [
                    sectorMargin !== null && { label: 'Sector Margin', value: sectorMargin.toFixed(2), isManual: false }
                ].filter(Boolean),
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Net Margin (%)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Indicates overall bottom-line profitability.',
                    'Shows efficiency of cost management.',
                    'Key driver of EPS growth.'
                ]
            }}
        />
    );
}
