import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function InterestCoverageCard({ data, manualOverride, lastUpdated }) {
    let isManual = true;
    let extractedValue = null;
    let extractedSector = null;

    // Attempt 1: From Ratios (Upstox)
    const ratioObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => 
        r.name?.toLowerCase().includes('interest coverage')
    );
    
    if (ratioObj && ratioObj.company_value) {
        const parsed = parseFloat(ratioObj.company_value);
        if (!isNaN(parsed)) {
            extractedValue = parsed;
            isManual = false;
        }
        if (ratioObj.sector_value) {
            const parsedSector = parseFloat(ratioObj.sector_value);
            if (!isNaN(parsedSector)) { extractedSector = parsedSector; }
        }
    }

    const currentCoverage = isManual ? (manualOverride !== undefined && manualOverride !== null ? parseFloat(manualOverride) : null) : extractedValue;
    const sectorCoverage = isManual ? null : extractedSector;

    // 2. Load Central Config
    const configData = getIndicatorConfig('interest_coverage');

    // 3. Praxis Engine Variables
    let score = 0;
    let bias = 'Neutral';
    let confidence = '85%';
    let aiInsightText = 'Waiting for insight...';

    // 4. Custom Scoring Logic
    if (currentCoverage !== null) {
        if (currentCoverage > 8) {
            score = 95; bias = 'Strong Bullish';
        } else if (currentCoverage > 5) {
            score = 82; bias = 'Bullish';
        } else if (currentCoverage >= 3) {
            score = 60; bias = 'Neutral';
        } else if (currentCoverage >= 1.5) {
            score = 30; bias = 'Bearish';
        } else {
            score = 5; bias = 'Strong Bearish';
        }

        // 5. Dynamic AI Insight
        if (currentCoverage > 8) {
            aiInsightText = 'The company comfortably meets its interest obligations with strong operating earnings.';
        } else if (currentCoverage > 5) {
            aiInsightText = 'Debt servicing capacity remains healthy.';
        } else if (currentCoverage >= 3) {
            aiInsightText = 'Interest obligations are manageable but should be monitored.';
        } else if (currentCoverage >= 1.5) {
            aiInsightText = 'Debt servicing capacity is weakening.';
        } else {
            aiInsightText = 'The company may struggle to meet interest obligations if earnings decline further.';
        }
    }

    const updateTime = lastUpdated || '--:--';

        return (
        <IndicatorCard
            config={{
                title: 'Interest Coverage',
                category: 'Financial Health',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: updateTime,
                source: isManual ? 'Manual' : 'Upstox',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Interest Coverage', value: currentCoverage !== null ? currentCoverage.toFixed(2) : '--' },
                details: [
                    { label: 'Sector Avg', value: sectorCoverage !== null ? sectorCoverage.toFixed(2) : '--', isManual: false }
                ],
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Coverage Ratio'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Measures ability to service debt.',
                    'Critical for highly leveraged companies.',
                    'Leading indicator of default risk.'
                ]
            }}
        />
    );
}
