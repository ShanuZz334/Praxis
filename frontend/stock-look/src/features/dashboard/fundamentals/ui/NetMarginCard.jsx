import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { scoreNetMargin, generateAiInsightNetMarginCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

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
        const parsed = cleanNum(netMarginItem.company_value);
        if (!isNaN(parsed)) {
            extractedValue = parsed;
            isManual = false;
        }
        if (netMarginItem.sector_value) {
            const parsedSector = cleanNum(netMarginItem.sector_value);
            if (!isNaN(parsedSector)) { extractedSector = parsedSector; }
        }
    }

    // Attempt 2: Auto-calculate from Income Statement (if ratios missed it)
    if (isManual) {
        const fullStmt = Array.isArray(data?.income?.full_statement) ? data.income.full_statement : [];
            
        const profitObj = fullStmt.find(m =>
            (m.particular === 'Profit After Tax' || m.particular === 'Profit Before Tax') &&
            Array.isArray(m.history) && m.history.length >= 1
        );
        
        const revObj = fullStmt.find(m =>
            (m.particular === 'Total Revenue' || m.particular === 'Revenue') &&
            Array.isArray(m.history) && m.history.length >= 1
        );

        if (profitObj && revObj) {
            const latestProfit = profitObj.history[0].value;
            const latestRev = revObj.history[0].value;
            if (latestRev > 0) {
                extractedValue = (latestProfit / latestRev) * 100;
                isManual = false; // Successfully calculated from live data!
            }
        }
    }
    
    const currentMargin = isManual ? (manualOverride !== undefined && manualOverride !== null ? cleanNum(manualOverride) : null) : extractedValue;
    const sectorMargin = isManual ? null : extractedSector;

    // 2. Load Central Config
    const configData = getIndicatorConfig('net_margin');

    // 3. Praxis Engine
    const { score, bias, confidence, trendDesc } = scoreNetMargin(currentMargin, sectorMargin);
    const aiInsightText = generateAiInsightNetMarginCard(currentMargin, trendDesc);

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
                currentValueObj: { label: 'Net Margin (%)', value: currentMargin !== null ? currentMargin.toFixed(2) + '%' : '--' },
                details: [
                    sectorMargin !== null && { label: 'Sector Margin', value: sectorMargin.toFixed(2) + '%', isManual: false }
                ].filter(Boolean),
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: confidence,
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
