import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

export default function MaxPainCard({ cardId, liveData = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.max_pain.id);

    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    const rawValue = isLiveData ? liveData.currentValue : (manualOverride ?? null);

    const distancePct = isLiveData ? liveData.distance : '--';
    const rawScore = isLiveData ? liveData.score : (rawValue !== null ? 50 : null);
    const rawBias  = isLiveData ? liveData.bias  : 'Neutral';
    const { score, bias } = { ...{ score: rawScore, bias: rawBias }, ...applyModeAdjustment({ score: rawScore, bias: rawBias }, 'max_pain', tradingMode) };
    const confidence = isLiveData ? liveData.confidence : "0%";
    const aiInsightText = isLiveData ? liveData.aiInsight : (rawValue !== null ? "Manual override provided." : "Awaiting live options chain data to calculate Max Pain...");

    const whyItMatters = [
        "Identifies important expiry levels.",
        "Tracks institutional options positioning.",
        "Improves expiry-week analysis.",
        "Complements Open Interest analysis.",
        "Supports short-term market assessment."
    ];

    const displayValue = rawValue !== null && rawValue !== '--' ? rawValue.toString() : '--';

    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Max Pain", 
                category: "Market Positioning", 
                mode: isLiveData ? "AUTO" : "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'), 
                source: isLiveData ? configData.source : "Manual", 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Max Pain Strike", value: displayValue }, 
                details: [
                    { label: "Distance", value: (distancePct != null && distancePct !== '--') ? `${parseFloat(distancePct).toFixed(2)}%` : '--' }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: [], valueKey: "value", valueName: "Max Pain" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
        />
    );
}
