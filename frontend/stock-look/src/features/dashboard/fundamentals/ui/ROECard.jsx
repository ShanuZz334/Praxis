import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { scoreROE, generateAiInsightROECard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function ROECard({ data, manualOverride, lastUpdated }) {
    // 1. Core State & Extraction
    const roeItem = (Array.isArray(data?.ratios) ? data.ratios : []).find(item => 
        item.name?.toLowerCase().includes('return on equity') || 
        item.name?.toLowerCase() === 'roe'
    );
    
    let isManual = true;
    let extractedValue = null;
    let extractedSector = null;

    if (roeItem && roeItem.company_value) {
        const parsed = parseFloat(roeItem.company_value);
        if (!isNaN(parsed)) {
            extractedValue = parsed;
            isManual = false;
        }
        if (roeItem.sector_value) {
            const parsedSector = parseFloat(roeItem.sector_value);
            if (!isNaN(parsedSector)) {
                extractedSector = parsedSector;
            }
        }
    }
    
    const currentROE = isManual ? (manualOverride !== undefined && manualOverride !== null ? parseFloat(manualOverride) : null) : extractedValue;
    const sectorROE = isManual ? null : extractedSector; // Fallback sector not supported if manual

    // 2. Load Central Config
    const configData = getIndicatorConfig('roe');

    // 3. Praxis Engine
    const { score, bias, confidence, trendDesc } = scoreROE(currentROE, sectorROE);
    const aiInsightText = generateAiInsightROECard(currentROE, sectorROE, trendDesc);

        return (
        <IndicatorCard
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
                currentValueObj: { label: 'ROE (%)', value: currentROE !== null ? currentROE.toFixed(2) + '%' : '--' },
                details: [
                    sectorROE !== null && !isNaN(sectorROE) && { label: 'Sector ROE', value: sectorROE.toFixed(2) + '%', isManual: false }
                ].filter(Boolean),
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: `${confidence}%`,
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
