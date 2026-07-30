import React from 'react';

import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';
import { generateAiInsightEVEbitdaCard, scoreEVEbitda } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function EVEbitdaCard({ cardId, data = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    // 1. Live Data Extraction (Upstox)
    const upstoxEVObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => 
        r.name === "EV/EBITDA" || 
        r.name?.toLowerCase().includes("ev/ebitda") ||
        r.name?.toLowerCase().includes("ev / ebitda")
    );
    const parsedUpstoxEV = upstoxEVObj?.company_value ? cleanNum(upstoxEVObj.company_value) : null;
    
    // 2. Data Resolution
    const isLiveData = parsedUpstoxEV !== null && !isNaN(parsedUpstoxEV);
    const currentEV = isLiveData ? parsedUpstoxEV : (manualOverride !== undefined && manualOverride !== null ? cleanNum(manualOverride) : null);
    
    const sectorEV = upstoxEVObj?.sector_value ? cleanNum(upstoxEVObj.sector_value) : null;

    // 3. Calculation Engine
    const { score, bias, valuationZone } = applyModeAdjustment(scoreEVEbitda(currentEV, sectorEV), 'ev_ebitda', tradingMode);
    const cCard = computeCardConfidence({
        hasLiveData: isLiveData,
        isManual: !!manualOverride && !isLiveData,
        sourcePipeline: isLiveData ? 'Upstox API' : 'Manual',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--')
    }, 'fundamentals');
    const aiInsightText = generateAiInsightEVEbitdaCard(currentEV, sectorEV, valuationZone);

    // 4. Configuration
    const configData = getIndicatorConfig(CARD_REGISTRY.ev_ebitda.id);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'EV/EBITDA',
                category: 'Valuation',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'),
                source: isLiveData ? 'Upstox API' : 'Manual',
                aiModel: configData?.aiModel || 'Engine v2'
            }}
            data={{
                currentValueObj: { 
                    label: 'EV/EBITDA', 
                    value: currentEV !== null ? `${cleanNum(currentEV).toFixed(2)}x` : '--' 
                },
                details: [
                    sectorEV !== null && {
                        label: 'Sector EV/EBITDA',
                        value: `${cleanNum(sectorEV).toFixed(2)}x`,
                        isManual: false,
                    }
                ].filter(Boolean),
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'EV/EBITDA'
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'Compares Enterprise Value (EV) to Earnings Before Interest, Taxes, Depreciation, and Amortization (EBITDA).',
                    'A capital-structure-neutral valuation metric.',
                    'Especially useful for comparing companies with different debt levels.',
                    'Lower values generally indicate a cheaper valuation relative to operating cash flows.'
                ]
            }}
        />
    );
}
