import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

export default function PcrOiCard({ cardId, liveData = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.pcr_oi.id);

    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    const rawValue = isLiveData ? liveData.currentValue : (manualOverride ?? null);

    const trend = isLiveData ? liveData.trend : "Stable";
    const score = isLiveData ? liveData.score : (rawValue !== null ? 50 : null);
    const bias = isLiveData ? liveData.bias : "Neutral";
    const sentiment = isLiveData ? liveData.sentiment : "Neutral";
    const confidence = isLiveData ? liveData.confidence : "0%";
    const aiInsightText = isLiveData ? liveData.aiInsight : (rawValue !== null ? "Manual override provided." : "Waiting for market data...");

    const whyItMatters = [
        "Measures institutional options sentiment.",
        "Identifies bullish and bearish positioning.",
        "Detects sentiment extremes.",
        "Confirms trend direction.",
        "Widely followed by professional options traders."
    ];

    const displayValue = rawValue !== null && rawValue !== '--' ? parseFloat(rawValue).toFixed(2) : '--';

    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Put-Call Ratio (OI)", 
                category: "Put-Call Ratio", 
                mode: isLiveData ? "AUTO" : "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'), 
                source: isLiveData ? configData.source : "Manual", 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "PCR (OI)", value: displayValue }, 
                details: [
                    { label: "Trend", value: trend },
                    { label: "Sentiment", value: sentiment }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: liveData?.history || [], valueKey: "value", valueName: "PCR (OI)" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
        />
    );
}
