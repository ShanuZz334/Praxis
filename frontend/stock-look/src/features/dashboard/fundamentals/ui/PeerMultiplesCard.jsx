import React from 'react';
import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scorePeerValuation, generateAiInsightPeerMultiples } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function PeerMultiplesCard({ cardId, data = null, manualOverride, lastUpdated }) {
    // 1. Extract Stock P/E and ROCE
    const extractRatio = (names) => {
        const ratiosArray = Array.isArray(data?.ratios) ? data.ratios : [];
        const obj = ratiosArray.find(r => names.some(n => r.name?.toLowerCase() === n.toLowerCase()));
        return obj?.company_value ? parseFloat(obj.company_value) : null;
    };

    const stockPE = extractRatio(['p/e', 'pe', 'pe ratio']) ?? 
                    (data?.screener?.ratios?.['Stock P/E'] ? parseFloat(data.screener.ratios['Stock P/E']) : null);
    
    const stockROCE = extractRatio(['roce', 'return on capital employed']) ?? 
                      (data?.screener?.ratios?.['ROCE'] ? parseFloat(data.screener.ratios['ROCE']) : null);

    const peers = data?.screener?.peers || [];
    const isLive = peers.length > 0 && stockPE !== null;

    const manualVal = manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? cleanNum(manualOverride) 
        : null;

    // 2. Praxis Scoring Engine
    const scoreObj = scorePeerValuation(stockPE, peers, stockROCE, manualVal);
    const { 
        score, 
        bias, 
        valuationLabel, 
        peDiffPct, 
        medianPE, 
        medianROCE, 
        peerCount 
    } = scoreObj;

    // Build Chart Points from peers for visual comparison
    let chartPoints = [];
    if (isLive) {
        chartPoints = peers.slice(0, 6).map(p => ({
            name: p.companyName.split(' ')[0], // short name
            value: parseFloat(p.pe) || 0,
            roce: parseFloat(p.rocePct) || 0
        })).filter(pt => pt.value > 0);
    }

    const configData = getIndicatorConfig(CARD_REGISTRY.peer_multiples.id) || { creditScore: 8, impactWeight: 6.0, aiModel: 'Engine v3' };

    const cCard = computeCardConfidence({
        hasLiveData: isLive,
        isManual: !isLive && manualVal !== null,
        sourcePipeline: isLive ? 'Screener.in Domestic Peers' : 'Manual Override',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(isLive) : (lastUpdated || '--:--')
    }, 'fundamentals');

    const stockSymbol = data?.company_profile?.company_name || data?.screener?.symbol || 'Stock';
    const aiInsightText = generateAiInsightPeerMultiples(stockSymbol, stockPE, medianPE, peDiffPct, stockROCE, medianROCE, valuationLabel);

    const displayDiff = peDiffPct !== null 
        ? `${peDiffPct > 0 ? '+' : ''}${peDiffPct}% ${peDiffPct >= 0 ? 'Prem.' : 'Disc.'}`
        : '--';

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Sector Peer Multiples',
                category: 'Valuation',
                mode: isLive ? 'AUTO' : 'MANUAL',
                creditScore: configData.creditScore || 8,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLive) : (lastUpdated || '--:--'),
                source: isLive ? 'Screener.in (Domestic Industry)' : 'Manual Override',
                aiModel: configData.aiModel || 'Engine v3'
            }}
            data={{
                currentValueObj: { 
                    label: 'Valuation vs Peers', 
                    value: isLive ? displayDiff : (manualVal !== null ? `${manualVal}%` : '--'),
                    isManual: !isLive
                },
                details: [
                    { 
                        label: 'Peer Status', 
                        value: valuationLabel, 
                        isManual: !isLive 
                    },
                    medianPE !== null && stockPE !== null && { 
                        label: 'P/E vs Peer Median', 
                        value: `${stockPE.toFixed(1)}x vs ${medianPE.toFixed(1)}x`, 
                        isManual: false 
                    },
                    medianROCE !== null && stockROCE !== null && { 
                        label: 'ROCE vs Peer Median', 
                        value: `${stockROCE.toFixed(1)}% vs ${medianROCE.toFixed(1)}%`, 
                        isManual: false 
                    },
                    peerCount > 0 && { 
                        label: 'Industry Peers', 
                        value: `${peerCount} Companies`, 
                        isManual: false 
                    }
                ].filter(Boolean),
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData.impactWeight || 6.0
            }}
            chartData={{
                points: chartPoints,
                valueKey: 'value',
                valueName: 'Peer P/E Multiples'
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'Evaluates current valuation strictly against direct domestic industry competitors.',
                    'Trading at a discount to peers while delivering superior ROCE signals potential mispricing.',
                    'A rich premium requires higher earnings growth or market dominance to be sustainable.',
                    'Domestic industry categorization accounts for Indian regulatory and market conditions.',
                    'Peer median provides an authentic sector baseline rather than arbitrary global multiples.'
                ]
            }}
        />
    );
}
