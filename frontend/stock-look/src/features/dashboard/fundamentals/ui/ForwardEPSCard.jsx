import React from 'react';

import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { scoreNiftyForwardEPS, generateAiInsightNiftyForwardEPS } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function ForwardEPSCard({ cardId, data, manualOverride, lastUpdated }) {
    // 1. Core State & Extraction
    let isManual = true;
    let extractedValue = null;

    // Attempt to extract live data
    const fwdEpsItem = (Array.isArray(data?.ratios) ? data.ratios : []).find(item => 
        item.name?.toLowerCase().includes('forward eps') || 
        item.name?.toLowerCase().includes('fwd eps')
    );
    
    if (fwdEpsItem && fwdEpsItem.company_value) {
        const parsed = cleanNum(fwdEpsItem.company_value);
        if (!isNaN(parsed)) {
            extractedValue = parsed;
            isManual = false;
        }
    }
    
    const currentValue = isManual ? (manualOverride !== undefined && manualOverride !== null && manualOverride !== '' ? cleanNum(manualOverride) : null) : extractedValue;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.forward_eps.id);

    // 3. Praxis Engine
    // Note: Most macro indicators just take a single value for scoring
    const scoreObj = scoreNiftyForwardEPS(currentValue);
    const { score, bias, confidence, trendDesc } = scoreObj;
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
                currentValueObj: { label: 'Growth (%)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--' },
                details: [],
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${confidence}%`,
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
