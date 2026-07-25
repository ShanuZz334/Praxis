import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { generateAiInsightEarningsYieldCard, scoreEarningsYield } from '@/features/dashboard/fundamentals/engine/scoringEngine';
export default function EarningsYieldCard({ cardId, data = null, manualOverride, lastUpdated }) {
    // 1. Live Data Extraction (Upstox)
    const upstoxYieldObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => r.name?.toLowerCase().includes("earning yield") || r.name?.toLowerCase().includes("earnings yield"));
    let parsedUpstoxYield = upstoxYieldObj?.company_value ? cleanNum(upstoxYieldObj.company_value) : null;
    let parsedSectorYield = upstoxYieldObj?.sector_value ? cleanNum(upstoxYieldObj.sector_value) : null;
    
    // If upstox doesn't provide Yield directly, derive it from P/E
    if (parsedUpstoxYield === null || isNaN(parsedUpstoxYield)) {
        const upstoxPEObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => r.name === "P/E" || r.name === "PE" || r.name?.toLowerCase().includes("pe ratio"));
        const parsedPE = upstoxPEObj?.company_value ? cleanNum(upstoxPEObj.company_value) : null;
        if (parsedPE !== null && !isNaN(parsedPE) && parsedPE > 0) {
            parsedUpstoxYield = cleanNum(((1 / parsedPE) * 100).toFixed(2));
        }
        
        const parsedSectorPE = upstoxPEObj?.sector_value ? cleanNum(upstoxPEObj.sector_value) : null;
        if (parsedSectorPE !== null && !isNaN(parsedSectorPE) && parsedSectorPE > 0) {
            parsedSectorYield = cleanNum(((1 / parsedSectorPE) * 100).toFixed(2));
        }
    }

    // 2. Data Resolution
    const isLiveData = parsedUpstoxYield !== null && !isNaN(parsedUpstoxYield);
    const currentYield = isLiveData ? parsedUpstoxYield : (manualOverride ? cleanNum(manualOverride) : null);
    
    const historicalYield = null; // Removed to comply with Zero Clutter Rule
    const sectorYield = isLiveData ? parsedSectorYield : null;
    const bondYield = data?.manualBondYield ? cleanNum(data.manualBondYield) : null;

    // 3. Calculation Engine
    const { score, bias } = scoreEarningsYield(currentYield, historicalYield, bondYield);
    const cCard = computeCardConfidence({
        hasLiveData: isLiveData,
        isManual: !!manualOverride && !isLiveData,
        sourcePipeline: isLiveData ? 'Upstox API' : 'Manual Override',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--')
    }, 'fundamentals');
    const aiInsightText = generateAiInsightEarningsYieldCard(currentYield, historicalYield, bondYield);

    // 4. Configuration
    const configData = getIndicatorConfig(CARD_REGISTRY.earnings_yield.id);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Earnings Yield',
                category: 'Valuation',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isLiveData ? 'Upstox API' : 'Manual Override',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { 
                    label: 'Current Yield', 
                    value: currentYield !== null ? `${currentYield}%` : '--' 
                },
                details: [
                    sectorYield !== null && {
                        label: 'Sector Yield',
                        value: `${cleanNum(sectorYield).toFixed(2)}%`,
                        isManual: false,
                    },
                    bondYield !== null && {
                        label: '10Y Bond Yield',
                        value: `${cleanNum(bondYield).toFixed(2)}%`,
                        isManual: true,
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
                valueName: 'Yield (%)'
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'Inverts the P/E ratio for easier comparison to bond yields.',
                    'Helps calculate the Equity Risk Premium (ERP).',
                    'A yield lower than the risk-free rate indicates severe overvaluation.'
                ]
            }}
        />
    );
}
