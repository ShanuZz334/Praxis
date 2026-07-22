import React from 'react';

import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { scoreAggregateProfitMargin, generateAiInsightAggregateProfitMargin } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function ProfitMarginCard({ cardId, data, manualOverride, lastUpdated }) {
    // 1. Core State & Extraction
    let isManual = true;
    let extractedValue = null;

    // Attempt to extract live data
    const marginItem = (Array.isArray(data?.ratios) ? data.ratios : []).find(item => 
        item.name?.toLowerCase().includes('profit margin') || 
        item.name?.toLowerCase().includes('net profit margin')
    );
    
    if (marginItem && marginItem.company_value) {
        const parsed = cleanNum(marginItem.company_value);
        if (!isNaN(parsed)) {
            extractedValue = parsed;
            isManual = false;
        }
    }
    
    const currentValue = isManual ? (manualOverride !== undefined && manualOverride !== null && manualOverride !== '' ? cleanNum(manualOverride) : null) : extractedValue;

    // 2. Load Central Config
    const configData = getIndicatorConfig(CARD_REGISTRY.profit_margin.id);

    // 3. Praxis Engine
    // Note: Most macro indicators just take a single value for scoring
    const scoreObj = scoreAggregateProfitMargin(currentValue);
    const { score, bias, confidence, trendDesc } = scoreObj;
    const aiInsightText = generateAiInsightAggregateProfitMargin(scoreObj, currentValue);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Profit Margin',
                category: 'Earnings',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isManual ? 'Manual' : 'Upstox',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Margin (%)', value: currentValue !== null ? (typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue) : '--' },
                details: [],
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Margin (%)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: ["Measures corporate efficiency.","Higher margins buffer against inflation."]
            }}
        />
    );
}
