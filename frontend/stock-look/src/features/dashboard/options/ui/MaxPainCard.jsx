import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function MaxPainCard({ liveData = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig('max_pain');

    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    const rawValue = isLiveData ? liveData.currentValue : (manualOverride ?? null);

    const distancePct = isLiveData ? liveData.distance : '--';
    const score = isLiveData ? liveData.score : (rawValue !== null ? 50 : null);
    const bias = isLiveData ? liveData.bias : "Neutral";
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
