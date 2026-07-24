import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

export default function AnalystConsensusCard({ cardId, manualOverrides = {}, lastUpdated }) {
    // Analyst Consensus is manual-only for now
    const rating = manualOverrides.analyst_consensus_rating || null;
    const targetPrice = manualOverrides.analyst_target_price ? parseFloat(manualOverrides.analyst_target_price) : null;
    const currentPrice = manualOverrides.current_price ? parseFloat(manualOverrides.current_price) : null; // or pass from context
    const analystCount = manualOverrides.analyst_count || null;

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

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Analyst Consensus',
                category: 'Valuation',
                mode: 'MANUAL',
                creditScore: configData.creditScore,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(false) : (lastUpdated || '--:--'),
                source: 'Manual',
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: 'Consensus', value: rating || '--', isManual: true },
                details: [
                    { label: 'Target Price', value: targetPrice !== null && !isNaN(targetPrice) ? `₹${targetPrice.toFixed(2)}` : '--', isManual: true },
                    { label: 'Upside', value: upside !== null && !isNaN(upside) ? `${upside > 0 ? '+' : ''}${upside.toFixed(2)}%` : '--', isManual: false },
                    { label: 'Analysts', value: analystCount !== null && !isNaN(analystCount) ? analystCount : '--', isManual: true },
                ],
                score: score,
                bias: bias,
                confidence: '60%',
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
