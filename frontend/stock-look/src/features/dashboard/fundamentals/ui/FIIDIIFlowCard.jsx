import React from 'react';
import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { formatCompactCurrency } from '@/shared/utils/formatters';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';
import { scoreInstitutionalFlow, generateAiInsightFIIDIIFlowCard } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function FIIDIIFlowCard({ cardId, data = null, manualOverrides = {}, lastUpdated, tradingMode = 'swing' }) {
    // Live Automated Data
    const liveFlowData = data?.fii_dii_flow;
    const isLive = !!liveFlowData;

    // Core Value States
    const fiiFlow = isLive && liveFlowData.fii?.['NSE_EQ|CASH']?.net !== undefined
        ? liveFlowData.fii['NSE_EQ|CASH'].net
        : (manualOverrides.fii !== undefined && manualOverrides.fii !== null && manualOverrides.fii !== '') 
            ? cleanNum(manualOverrides.fii) : null;
            
    const diiFlow = isLive && liveFlowData.dii?.['NSE_EQ|CASH']?.net !== undefined
        ? liveFlowData.dii['NSE_EQ|CASH'].net
        : (manualOverrides.dii !== undefined && manualOverrides.dii !== null && manualOverrides.dii !== '')
            ? cleanNum(manualOverrides.dii) : null;

    // Centralized Config
    const configData = getIndicatorConfig(CARD_REGISTRY.fii_dii_flow.id);

    // --- Scoring Engine ---
    const { score, bias, netFlow } = applyModeAdjustment(scoreInstitutionalFlow(fiiFlow, diiFlow), 'fii_dii_flow', tradingMode);
    const isManual = !isLive && (manualOverrides.fii || manualOverrides.dii);
    
    const cCard = computeCardConfidence({
        hasLiveData: isLive,
        isManual: !!isManual,
        sourcePipeline: isLive ? 'Upstox API' : 'Manual Override',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(isLive) : (lastUpdated || '--:--')
    }, 'fundamentals');
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
                currentValueObj: { 
                    label: 'Net Flow', 
                    value: netFlow !== null && !isNaN(netFlow) ? formatCompactCurrency(netFlow * 10000000) : '--',
                    isManual: !isLive
                },
                details: [
                    { label: 'FII Flow', value: fiiFlow !== null && !isNaN(fiiFlow) ? formatCompactCurrency(fiiFlow * 10000000) : '--', isManual: !isLive },
                    { label: 'DII Flow', value: diiFlow !== null && !isNaN(diiFlow) ? formatCompactCurrency(diiFlow * 10000000) : '--', isManual: !isLive }
                ],
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Flow (? Cr)'
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

