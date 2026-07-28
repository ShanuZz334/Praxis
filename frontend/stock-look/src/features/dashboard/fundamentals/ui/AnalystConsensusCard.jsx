import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';

export default function AnalystConsensusCard({ cardId, data = {}, manualOverrides = {}, lastUpdated }) {
    const liveConsensus = data.analyst_consensus || null;
    const isLiveVal = liveConsensus !== null;

    // Use live data if available, fallback to manual overrides
    const rating = isLiveVal ? liveConsensus.consensus : (manualOverrides.analyst_consensus_rating || null);
    const targetPriceRaw = isLiveVal ? liveConsensus.targetPrice : manualOverrides.analyst_target_price;
    const targetPrice = targetPriceRaw ? parseFloat(targetPriceRaw) : null;
    const currentPrice = data.current_price ? parseFloat(data.current_price) : (manualOverrides.current_price ? parseFloat(manualOverrides.current_price) : null);
    const analystCount = isLiveVal ? liveConsensus.analysts : (manualOverrides.analyst_count || null);

    let upside = null;
    if (targetPrice && currentPrice) {
        upside = ((targetPrice - currentPrice) / currentPrice) * 100;
    }

    let score = null;
    let bias = 'Neutral';
    if (rating?.toLowerCase().includes('buy')) { score = 80; bias = 'Bullish'; }
    else if (rating?.toLowerCase().includes('sell')) { score = 20; bias = 'Bearish'; }
    else if (rating) { score = 50; }

    const baseConfig = getIndicatorConfig(CARD_REGISTRY.analyst_consensus.id);
    const configData = (baseConfig && baseConfig.impactWeight !== "0.0%") 
        ? baseConfig 
        : { creditScore: 6, impactWeight: "4.0%", aiModel: 'Engine v2' };

    const cCard = computeCardConfidence({
        hasLiveData: isLiveVal,
        isManual: !isLiveVal && !!rating,
        sourcePipeline: isLiveVal ? 'API/AI' : 'Manual',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(isLiveVal) : (lastUpdated || '--:--')
    }, 'fundamentals');

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Analyst Consensus',
                category: 'Valuation',
                mode: isLiveVal ? 'AUTO' : 'MANUAL',
                creditScore: configData.creditScore,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveVal) : (lastUpdated || '--:--'),
                source: isLiveVal ? 'Yahoo/Backend' : 'Manual',
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: 'Consensus', value: rating ? rating.replace('_', ' ').toUpperCase() : '--', isManual: !isLiveVal },
                details: [
                    { label: 'Target Price', value: targetPrice !== null && !isNaN(targetPrice) ? `₹${targetPrice.toFixed(2)}` : '--', isManual: !isLiveVal },
                    { label: 'Upside', value: upside !== null && !isNaN(upside) ? `${upside > 0 ? '+' : ''}${upside.toFixed(2)}%` : '--', isManual: false },
                    { label: 'Analysts', value: analystCount !== null && !isNaN(analystCount) ? analystCount : '--', isManual: !isLiveVal },
                ],
                score: score,
                bias: bias,
                confidence: `${cCard}%`,
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: [], valueKey: 'value', valueName: 'Consensus' }}
            insights={{
                aiInsight: 'Analyst consensus aggregates the rating and target price from major brokerages.',
                whyItMatters: [
                    'Analyst upgrades/downgrades often act as immediate catalysts for price action.',
                    'A large divergence between current price and target price can signal mispricing.',
                    'High analyst coverage increases the reliability of the consensus.',
                ]
            }}
        />
    );
}
