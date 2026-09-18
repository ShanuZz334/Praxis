import React from 'react';
import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { scoreShareholdingTrend, generateAiInsightShareholdingTrend } from '@/features/dashboard/fundamentals/engine/scoringEngine';

export default function ShareholdingTrendCard({ cardId, data = null, manualOverride, lastUpdated }) {
    // 1. Extract Live Screener Shareholding Trend Data
    const trendData = data?.screener?.shareholdingTrend || null;
    const isLive = !!(trendData && trendData.quarters && trendData.quarters.length > 0);

    const manualVal = manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? cleanNum(manualOverride) 
        : null;

    // 2. Praxis Scoring Engine
    const scoreObj = scoreShareholdingTrend(trendData, manualVal);
    const { 
        score, 
        bias, 
        trendZone, 
        fiiDelta, 
        diiDelta, 
        instNetDelta, 
        latestFII, 
        latestDII, 
        latestProm 
    } = scoreObj;

    // Build Chart Points across available quarters (up to 12 quarters)
    let chartPoints = [];
    if (isLive) {
        const qtrs = trendData.quarters || [];
        const fii = trendData.categories?.['FIIs'] || trendData.categories?.['FII'] || [];
        const dii = trendData.categories?.['DIIs'] || trendData.categories?.['DII'] || [];
        chartPoints = qtrs.map((q, idx) => {
            const fVal = fii[idx] ?? null;
            const dVal = dii[idx] ?? null;
            const instTotal = (fVal !== null && dVal !== null) ? Number((fVal + dVal).toFixed(2)) : null;
            return {
                name: q,
                value: instTotal,
                fii: fVal,
                dii: dVal
            };
        }).filter(pt => pt.value !== null);
    }

    const configData = getIndicatorConfig(CARD_REGISTRY.shareholding_trend.id) || { creditScore: 9, impactWeight: 7.0, aiModel: 'Engine v3' };

    const cCard = computeCardConfidence({
        hasLiveData: isLive,
        isManual: !isLive && manualVal !== null,
        sourcePipeline: isLive ? 'Screener.in 12Q' : 'Manual Override',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(isLive) : (lastUpdated || '--:--')
    }, 'fundamentals');

    const aiInsightText = generateAiInsightShareholdingTrend(trendData, scoreObj);

    const totalInstPct = (latestFII !== null && latestDII !== null) 
        ? (latestFII + latestDII).toFixed(2) 
        : null;

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Shareholding Trend',
                category: 'Ownership & Flow',
                mode: isLive ? 'AUTO' : 'MANUAL',
                creditScore: configData.creditScore || 9,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLive) : (lastUpdated || '--:--'),
                source: isLive ? 'Screener.in (12 Quarters)' : 'Manual Override',
                aiModel: configData.aiModel || 'Engine v3'
            }}
            data={{
                currentValueObj: { 
                    label: 'Inst. Holding', 
                    value: totalInstPct !== null ? `${totalInstPct}%` : (manualVal !== null ? `${manualVal}%` : '--'),
                    isManual: !isLive
                },
                details: [
                    { 
                        label: 'Ownership Regime', 
                        value: trendZone, 
                        isManual: !isLive 
                    },
                    instNetDelta !== null && { 
                        label: '3Y Inst. Shift', 
                        value: `${instNetDelta > 0 ? '+' : ''}${instNetDelta}%`, 
                        isManual: false 
                    },
                    latestFII !== null && { 
                        label: 'FII Stake (3Y)', 
                        value: `${latestFII}% (${fiiDelta > 0 ? '+' : ''}${fiiDelta}%)`, 
                        isManual: false 
                    },
                    latestDII !== null && { 
                        label: 'DII Stake (3Y)', 
                        value: `${latestDII}% (${diiDelta > 0 ? '+' : ''}${diiDelta}%)`, 
                        isManual: false 
                    },
                    latestProm !== null && { 
                        label: 'Promoter Stake', 
                        value: `${latestProm}%`, 
                        isManual: false 
                    }
                ].filter(Boolean),
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData.impactWeight || 7.0
            }}
            chartData={{
                points: chartPoints,
                valueKey: 'value',
                valueName: 'Total Institutional %'
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'Tracks 12 consecutive quarters of institutional ownership evolution.',
                    'Divergence between FII selling and DII absorption highlights domestic liquidity cushions.',
                    'Sustained institutional accumulation over 8+ quarters provides durable fundamental floor support.',
                    'Sharp drop in institutional stake alongside rising retail counts often precedes prolonged distribution.',
                    'Promoter holding stability confirms managerial alignment and long-term confidence.'
                ]
            }}
        />
    );
}
