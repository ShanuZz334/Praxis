import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';
import { scoreCurrentRatio, generateAiInsightCurrentRatioCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function CurrentRatioCard({ cardId, data, manualOverride, lastUpdated, tradingMode = 'swing' }) {
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
    const configData = getIndicatorConfig(CARD_REGISTRY.current_ratio.id);

    // 4. Centralized Scoring via scoringEngine.js
    const { score = 0, bias = 'Neutral' } = currentRatio !== null ? applyModeAdjustment(scoreCurrentRatio(currentRatio), 'current_ratio', tradingMode) : {};
    const aiInsightText = currentRatio !== null
        ? (generateAiInsightCurrentRatioCard ? generateAiInsightCurrentRatioCard(currentRatio, sectorRatio) : 'No insights available.')
        : 'Waiting for insight...';

    let confidence = '72%';
    if (currentRatio !== null) {
        const cCard = computeCardConfidence({
            hasLiveData: !isManual,
            isManual: !!manualOverride && isManual,
            sourcePipeline: isManual ? 'manual' : 'upstox',
            lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
        }, 'fundamentals');
        confidence = `${cCard}%`;
    }

    const updateTime = lastUpdated || '--:--';

        return (
        <IndicatorCard
            cardId={cardId}
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
                confidence: '90%',
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
