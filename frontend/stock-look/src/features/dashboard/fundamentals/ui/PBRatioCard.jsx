import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { generateAiInsightPBRatioCard, scorePBRatio } from '@/features/dashboard/fundamentals/engine/scoringEngine';
export default function PBRatioCard({ data = null, manualOverride, lastUpdated }) {
    // 1. Live Data Extraction (Upstox)
    const upstoxPBObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => r.name === "P/B" || r.name === "PB" || r.name?.toLowerCase().includes("pb ratio"));
    const parsedUpstoxPB = upstoxPBObj?.company_value ? cleanNum(upstoxPBObj.company_value) : null;
    
    // 2. Data Resolution
    const isLiveData = parsedUpstoxPB !== null && !isNaN(parsedUpstoxPB);
    const currentPB = isLiveData ? parsedUpstoxPB : (manualOverride ? cleanNum(manualOverride) : null);
    
    const historicalPB = null; // Removed to comply with Zero Clutter Rule
    const sectorPB = upstoxPBObj?.sector_value ? cleanNum(upstoxPBObj.sector_value) : null;

    // 3. Calculation Engine
    const { score, bias, confidence } = scorePBRatio(currentPB, historicalPB, sectorPB);
    const aiInsightText = generateAiInsightPBRatioCard(currentPB, historicalPB, sectorPB);

    // 4. Configuration
    const configData = getIndicatorConfig('pb_ratio');

    return (
        <IndicatorCard
            config={{
                title: 'P/B Ratio',
                category: 'Valuation',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isLiveData ? 'Upstox API' : 'Manual Override',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { 
                    label: 'Current PB', 
                    value: currentPB !== null ? `${cleanNum(currentPB).toFixed(2)}x` : '--' 
                },
                details: [
                    sectorPB !== null && {
                        label: 'Sector P/B',
                        value: `${cleanNum(sectorPB).toFixed(2)}x`,
                        isManual: false,
                    }
                ].filter(Boolean),
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '0%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'P/B Ratio'
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'Compares market capitalization to accounting book value.',
                    'Crucial for evaluating financial stocks like banks and NBFCs.',
                    'A ratio under 1.0 may indicate deep undervaluation if assets are sound.'
                ]
            }}
        />
    );
}
