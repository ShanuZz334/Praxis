import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function CurrentRatioCard({ data, manualOverride, lastUpdated }) {
    let isManual = true;
    let extractedValue = null;
    let extractedSector = null;

    // Attempt 1: From Ratios (Upstox)
    const ratioObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => 
        r.name?.toLowerCase().includes('current ratio')
    );
    
    if (ratioObj && ratioObj.company_value) {
        const parsed = cleanNum(ratioObj.company_value);
        if (!isNaN(parsed)) {
            extractedValue = parsed;
            isManual = false;
        }
        if (ratioObj.sector_value) {
            const parsedSector = cleanNum(ratioObj.sector_value);
            if (!isNaN(parsedSector)) { extractedSector = parsedSector; }
        }
    }

    // Attempt 2: Calculate from Balance Sheet (if ratios missed it)
    if (isManual && data?.balanceSheet) {
        const fullStmt = Array.isArray(data.balanceSheet.full_statement) ? data.balanceSheet.full_statement : [];
        const caObj = fullStmt.find(m => m.particular?.toLowerCase() === 'current assets');
        const clObj = fullStmt.find(m => m.particular?.toLowerCase() === 'current liabilities');
        
        if (caObj && Array.isArray(caObj.history) && caObj.history.length > 0 &&
            clObj && Array.isArray(clObj.history) && clObj.history.length > 0) {
            const latestCA = caObj.history[0].value;
            const latestCL = clObj.history[0].value;
            if (latestCL > 0) {
                extractedValue = latestCA / latestCL;
                isManual = false;
            }
        }
    }

    const currentRatio = isManual ? (manualOverride !== undefined && manualOverride !== null ? cleanNum(manualOverride) : null) : extractedValue;
    const sectorRatio = isManual ? null : extractedSector;

    // 2. Load Central Config
    const configData = getIndicatorConfig('current_ratio');

    let score = 0;
    let bias = 'Neutral';
    let confidence = '72%';
    let aiInsightText = 'Waiting for insight...';

    // 4. Custom Scoring Logic
    if (currentRatio !== null) {
        if (currentRatio > 2.0) {
            score = 92; bias = 'Strong Bullish';
        } else if (currentRatio >= 1.5) {
            score = 75; bias = 'Bullish';
        } else if (currentRatio >= 1.0) {
            score = 55; bias = 'Neutral';
        } else if (currentRatio >= 0.8) {
            score = 30; bias = 'Bearish';
        } else {
            score = 10; bias = 'Strong Bearish';
        }

        // 5. Dynamic AI Insight
        if (currentRatio > 1.5) {
            aiInsightText = 'The company has strong short-term liquidity and is well-positioned to meet current obligations.';
        } else if (currentRatio >= 1.0) {
            aiInsightText = 'Liquidity is adequate but should continue to be monitored.';
        } else if (currentRatio >= 0.8) {
            aiInsightText = 'Current liabilities exceed readily available current assets, increasing liquidity risk.';
        } else {
            aiInsightText = 'The company may face difficulty meeting short-term obligations without additional financing.';
        }
        confidence = sectorRatio !== null && !isNaN(sectorRatio)
            ? '90%'
            : (currentRatio > 2.5 || currentRatio < 0.8 ? '82%' : '72%');
    }

    const updateTime = lastUpdated || '--:--';

        return (
        <IndicatorCard
            config={{
                title: 'Current Ratio',
                category: 'Financial Health',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: updateTime,
                source: isManual ? 'Manual' : (extractedSector ? 'Upstox Ratios' : 'Upstox Balance Stmt (Calc)'),
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Current Ratio', value: currentRatio !== null ? currentRatio.toFixed(2) : '--' },
                details: [
                    sectorRatio !== null && !isNaN(sectorRatio) && { label: 'Sector Avg', value: sectorRatio.toFixed(2), isManual: false }
                ].filter(Boolean),
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Current Ratio'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Measures short-term liquidity.',
                    'Shows ability to pay off short-term obligations.',
                    'Indicator of working capital health.'
                ]
            }}
        />
    );
}
