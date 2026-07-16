import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { scoreOperatingMargin, generateAiInsightOperatingMarginCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

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
        const parsed = cleanNum(opMarginItem.company_value);
        if (!isNaN(parsed)) {
            extractedValue = parsed;
            isManual = false;
        }
        if (opMarginItem.sector_value) {
            const parsedSector = cleanNum(opMarginItem.sector_value);
            if (!isNaN(parsedSector)) { extractedSector = parsedSector; }
        }
    }

    // Attempt 2: Auto-calculate from Income Statement Summary (if ratios missed it)
    if (isManual) {
        const incomeStmt = Array.isArray(data?.income?.income_statement) ? data.income.income_statement : [];
            
        const opProfitObj = incomeStmt.find(m => m.category === 'operating_profit' && Array.isArray(m.history) && m.history.length >= 1);
        const revObj = incomeStmt.find(m => m.category === 'revenue' && Array.isArray(m.history) && m.history.length >= 1);

        if (opProfitObj && revObj) {
            const latestOpProfit = opProfitObj.history[0].value;
            const latestRev = revObj.history[0].value;
            if (latestRev > 0) {
                extractedValue = (latestOpProfit / latestRev) * 100;
                isManual = false; // Successfully calculated!
            }
        }
    }
    
    const currentMargin = isManual ? (manualOverride !== undefined && manualOverride !== null ? cleanNum(manualOverride) : null) : extractedValue;
    const sectorMargin = isManual ? null : extractedSector;

    // 2. Load Central Config
    const configData = getIndicatorConfig('operating_margin');

    // 3. Praxis Engine
    const { score, bias, confidence, trendDesc } = scoreOperatingMargin(currentMargin, sectorMargin);
    const aiInsightText = generateAiInsightOperatingMarginCard(currentMargin, trendDesc);

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
                currentValueObj: { label: 'Operating Margin (%)', value: currentMargin !== null ? currentMargin.toFixed(2) + '%' : '--' },
                details: [
                    sectorMargin !== null && { label: 'Sector Margin', value: sectorMargin.toFixed(2) + '%', isManual: false }
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
