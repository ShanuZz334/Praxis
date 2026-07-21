import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { formatCompactCurrency } from '@/shared/utils/formatters';
import { scoreInstitutionalFlow, generateAiInsightFIIDIIFlowCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function FIIDIIFlowCard({ cardId, data = null, manualOverride, lastUpdated }) {
    // Live Automated Data
    const liveFlowData = data?.fii_dii_flow;
    const isLive = !!liveFlowData;

    // Core Value States
    const fiiFlow = isLive
        ? liveFlowData.fii_cash
        : (manualOverride !== undefined && manualOverride !== null && manualOverride !== '') 
            ? cleanNum(manualOverride) : null;
            
    const diiFlow = isLive
        ? liveFlowData.dii_cash
        : (data?.manualDiiFlow !== undefined && data?.manualDiiFlow !== null && data?.manualDiiFlow !== '')
            ? cleanNum(data.manualDiiFlow) : null;

    // Centralized Config
    const configData = getIndicatorConfig('fii_dii_flow');

    // --- Scoring Engine ---
    const { score, bias, confidence, netFlow } = scoreInstitutionalFlow(fiiFlow, diiFlow);
    const aiInsightText = generateAiInsightFIIDIIFlowCard(fiiFlow, diiFlow, netFlow);

        return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'FII / DII Flow',
                category: 'Market Health',
                mode: isLive ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLive) : (lastUpdated || '--:--'),
                source: isLive ? 'Upstox API' : 'Manual Override',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Net Flow', value: netFlow !== null && !isNaN(netFlow) ? formatCompactCurrency(netFlow * 10000000) : '--' },
                details: [
                    fiiFlow !== null && !isNaN(fiiFlow) && { label: 'FII Flow', value: formatCompactCurrency(fiiFlow * 10000000), isManual: !isLive },
                    diiFlow !== null && !isNaN(diiFlow) && { label: 'DII Flow', value: formatCompactCurrency(diiFlow * 10000000), isManual: !isLive }
                ].filter(Boolean),
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Flow (₹ Cr)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Tracks institutional money movement.',
                    'Strong indicator of market sentiment.',
                    'Often drives short-term market trends.'
                ]
            }}
        />
    );
}
