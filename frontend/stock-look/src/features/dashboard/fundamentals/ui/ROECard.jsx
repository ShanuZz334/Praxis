import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';
import { scoreROE, generateAiInsightROECard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function ROECard({ cardId, data, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    // 1. Core State & Extraction
    const roeItem = (Array.isArray(data?.ratios) ? data.ratios : []).find(item => 
        item.name?.toLowerCase().includes('return on equity') || 
        item.name?.toLowerCase() === 'roe'
    );
    
    let isManual = true;
    let extractedValue = null;
    let extractedSector = null;

    if (roeItem && roeItem.company_value) {
        const parsed = cleanNum(roeItem.company_value);
        if (!isNaN(parsed)) {
            extractedValue = parsed;
            isManual = false;
        }
        if (roeItem.sector_value) {
            const parsedSector = cleanNum(roeItem.sector_value);
            if (!isNaN(parsedSector)) {
                extractedSector = parsedSector;
            }
        }
    }
    
    const currentROE = isManual ? (manualOverride !== undefined && manualOverride !== null ? cleanNum(manualOverride) : null) : extractedValue;
    const sectorROE = isManual ? null : extractedSector; // Fallback sector not supported if manual

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.roe.id);

    // 3. Praxis Engine
    const { score, bias, trendDesc } = applyModeAdjustment(scoreROE(currentROE, sectorROE), 'roe', tradingMode);
    
    const cCard = computeCardConfidence({
        hasLiveData: !isManual,
        isManual: !!manualOverride && isManual,
        sourcePipeline: isManual ? 'manual' : 'upstox',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
    }, 'fundamentals');
    const aiInsightText = generateAiInsightROECard(currentROE, sectorROE, trendDesc);

        return (
        <IndicatorCard
            cardId={cardId}
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
                currentValueObj: { label: 'ROE', value: currentROE !== null ? currentROE.toFixed(2) + '%' : '--' },
                details: [
                    sectorROE !== null && !isNaN(sectorROE) && { label: 'Sector ROE', value: sectorROE.toFixed(2) + '%', isManual: false }
                ].filter(Boolean),
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
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
