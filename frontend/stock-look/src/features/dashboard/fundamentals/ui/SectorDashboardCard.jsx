import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { cleanNum } from '@/lib/utils';
import { generateAiInsightSectorDashboard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function SectorDashboardCard({ data, manualOverrides = {}, lastUpdated }) {
    // 1. Data extraction & fallback to manual overrides
    const getVal = (key) => manualOverrides[key] !== undefined && manualOverrides[key] !== null && manualOverrides[key] !== '' 
        ? cleanNum(manualOverrides[key]) 
        : null;

    const advanceDecline = getVal('advance_decline');
    const sectorValuation = getVal('sector_valuation');
    const sectorGrowth = getVal('sector_growth');
    const sectorConcentration = getVal('sector_concentration');
    const cycDef = getVal('cyc_def');

    const isManual = true; // Mostly manual for now, assuming index metrics aren't fully live

    const configData = getIndicatorConfig('sector_dashboard') || { creditScore: 6, impactWeight: 5.0, aiModel: 'Engine v3' };

    // 2. Score Calculation
    let validCount = 0;
    let totalScore = 0;
    
    if (advanceDecline !== null) { totalScore += advanceDecline; validCount++; } // Assuming 0-100 or already scored
    if (sectorValuation !== null) { totalScore += sectorValuation; validCount++; }
    if (sectorGrowth !== null) { totalScore += sectorGrowth; validCount++; }
    
    const compositeScore = validCount > 0 ? (totalScore / validCount) : null;
    let bias = 'Neutral';
    if (compositeScore !== null) {
        if (compositeScore > 60) bias = 'Bullish';
        else if (compositeScore < 40) bias = 'Bearish';
    }

    const aiInsightText = generateAiInsightSectorDashboard(compositeScore, advanceDecline, sectorValuation, sectorGrowth, cycDef);

    return (
        <IndicatorCard
            config={{
                title: 'Sector Dashboard',
                category: 'Sector',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData.creditScore,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(!isManual) : (lastUpdated || '--:--'),
                source: isManual ? 'Manual' : 'Upstox',
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { 
                    label: 'Sector Health', 
                    value: compositeScore !== null ? compositeScore.toFixed(1) : '--' 
                },
                details: [
                    advanceDecline !== null && { label: 'Adv/Dec', value: advanceDecline.toString(), isManual: false },
                    sectorValuation !== null && { label: 'Valuation', value: sectorValuation.toString(), isManual: false },
                    sectorGrowth !== null && { label: 'Growth', value: sectorGrowth.toString(), isManual: false },
                    cycDef !== null && { label: 'Cyc/Def', value: cycDef.toString(), isManual: false },
                ].filter(Boolean),
                score: compositeScore,
                bias: bias,
                confidence: `${validCount > 0 ? 80 : 0}%`,
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: [], valueKey: 'value', valueName: 'Health' }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'Broad sector participation is key for sustainable bull markets.',
                    'Defensive outperformance often precedes broader market corrections.',
                    'High concentration risk means the index is heavily dependent on a few heavyweights.'
                ]
            }}
        />
    );
}
