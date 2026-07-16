import React from 'react';

import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { generateAiInsightROACard, scoreROA } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function ROACard({ data = null, manualOverride, lastUpdated }) {
    // 1. Live Data Extraction (Upstox)
    const upstoxROAObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => 
        r.name === "ROA" || 
        r.name?.toLowerCase().includes("roa") ||
        r.name?.toLowerCase().includes("return on asset")
    );
    const parsedUpstoxROA = upstoxROAObj?.company_value ? cleanNum(upstoxROAObj.company_value) : null;
    
    // 2. Data Resolution
    const isLiveData = parsedUpstoxROA !== null && !isNaN(parsedUpstoxROA);
    const currentROA = isLiveData ? parsedUpstoxROA : (manualOverride !== undefined && manualOverride !== null ? cleanNum(manualOverride) : null);
    
    const sectorROA = upstoxROAObj?.sector_value ? cleanNum(upstoxROAObj.sector_value) : null;

    // 3. Calculation Engine
    const { score, bias, confidence, efficiencyZone } = scoreROA(currentROA, sectorROA);
    const aiInsightText = generateAiInsightROACard(currentROA, sectorROA, efficiencyZone);

    // 4. Configuration
    const configData = getIndicatorConfig('roa');

    return (
        <IndicatorCard
            config={{
                title: 'ROA',
                category: 'Profitability',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'),
                source: isLiveData ? 'Upstox API' : 'Manual',
                aiModel: configData?.aiModel || 'Engine v2'
            }}
            data={{
                currentValueObj: { 
                    label: 'ROA (%)', 
                    value: currentROA !== null ? `${cleanNum(currentROA).toFixed(2)}%` : '--' 
                },
                details: [
                    sectorROA !== null && {
                        label: 'Sector ROA',
                        value: `${cleanNum(sectorROA).toFixed(2)}%`,
                        isManual: false,
                    }
                ].filter(Boolean),
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'ROA (%)'
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'Return on Assets (ROA) measures how efficiently a company uses its assets to generate profit.',
                    'A higher ROA indicates better management performance and efficiency.',
                    'Very useful for comparing companies within the same sector, especially asset-heavy industries.'
                ]
            }}
        />
    );
}
