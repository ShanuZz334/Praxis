import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';
import { scoreROCE, generateAiInsightROCECard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function ROCECard({ cardId, data, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    // 1. Core State & Extraction
    const roceItem = (Array.isArray(data?.ratios) ? data.ratios : []).find(item => 
        item.name?.toLowerCase().includes('return on capital employed') || 
        item.name?.toLowerCase() === 'roce'
    );
    
    let isManual = true;
    let extractedValue = null;
    let extractedSector = null;

    if (roceItem && roceItem.company_value) {
        const parsed = cleanNum(roceItem.company_value);
        if (!isNaN(parsed)) {
            extractedValue = parsed;
            isManual = false;
        }
        if (roceItem.sector_value) {
            const parsedSector = cleanNum(roceItem.sector_value);
            if (!isNaN(parsedSector)) {
                extractedSector = parsedSector;
            }
        }
    }
    
    const currentROCE = isManual ? (manualOverride !== undefined && manualOverride !== null ? cleanNum(manualOverride) : null) : extractedValue;
    const sectorROCE = isManual ? null : extractedSector;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.roce.id);

    // 3. Praxis Engine
    const { score, bias, trendDesc } = applyModeAdjustment(scoreROCE(currentROCE, sectorROCE), 'roce', tradingMode);
    
    const cCard = computeCardConfidence({
        hasLiveData: !isManual,
        isManual: !!manualOverride && isManual,
        sourcePipeline: isManual ? 'manual' : 'upstox',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
    }, 'fundamentals');
    const aiInsightText = generateAiInsightROCECard(currentROCE, sectorROCE, trendDesc);

        return (
        <IndicatorCard
            cardId={cardId}
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
                currentValueObj: { label: 'ROCE', value: currentROCE !== null ? currentROCE.toFixed(2) + '%' : '--' },
                details: [
                    sectorROCE !== null && !isNaN(sectorROCE) && { label: 'Sector ROCE', value: sectorROCE.toFixed(2) + '%', isManual: false }
                ].filter(Boolean),
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
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
