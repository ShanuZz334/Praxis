import React from 'react';

import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scoreNiftyForwardEPS, generateAiInsightNiftyForwardEPS } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function ForwardEPSCard({ cardId, data, manualOverride, lastUpdated }) {
    // 1. Core State & Extraction
    let isManual = true;
    let extractedValue = null;   // YoY growth % fed to scorer
    let extractedAbsEPS = null;  // Absolute EPS shown in UI

    // Attempt to extract live data from Upstox
    if (data?.income?.full_statement) {
        const fullStatement = data.income.full_statement;
        const epsObj = fullStatement.find(s => s.particular === 'EPS - Basic' || s.particular === 'EPS - Diluted');
        
        if (epsObj && epsObj.history?.length >= 2) {
            const currentEps = epsObj.history[0].value;
            const previousEps = epsObj.history[1].value;
            if (previousEps !== 0) {
                // scoreNiftyForwardEPS expects YoY growth as a %, e.g. 18.5 for 18.5%
                const epsYoY = ((currentEps - previousEps) / Math.abs(previousEps)) * 100;
                extractedValue = parseFloat(epsYoY.toFixed(2));
                extractedAbsEPS = currentEps; // keep absolute for display
                isManual = false;
            }
        }
    }
    
    // scorer receives YoY growth %; display shows absolute EPS
    const currentValue  = isManual ? (manualOverride !== undefined && manualOverride !== null && manualOverride !== '' ? cleanNum(manualOverride) : null) : extractedValue;
    const displayEPS   = extractedAbsEPS;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.forward_eps.id);

    // 3. Praxis Engine
    // Note: Most macro indicators just take a single value for scoring
    const scoreObj = scoreNiftyForwardEPS(currentValue);
    const { score, bias, trendDesc } = scoreObj;
    
    const cCard = computeCardConfidence({
        hasLiveData: !isManual,
        isManual: !!manualOverride && isManual,
        sourcePipeline: isManual ? 'manual' : 'upstox',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--')
    }, 'fundamentals');
    
    const aiInsightText = generateAiInsightNiftyForwardEPS(scoreObj, currentValue);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Forward EPS',
                category: 'Earnings',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'EPS', value: displayEPS !== null ? '₹' + displayEPS.toFixed(2) : (currentValue !== null ? currentValue + '% growth' : '--') },
                details: [],
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Growth (%)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: ["Measures expected future earnings.","Markets price in forward growth."]
            }}
        />
    );
}
