import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { formatIndianNumber } from '@/shared/utils/formatters';

export default function OpenInterestChangeCard({ cardId, liveData = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.oi_change.id);
    
    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    const rawValue = isLiveData ? liveData.currentValue : (manualOverride ?? null);

    const oiChangePct = isLiveData ? liveData.changePercentage : '--';
    const position = isLiveData ? liveData.position : "Neutral";
    const score = isLiveData ? liveData.score : (rawValue !== null ? 50 : null);
    const bias = isLiveData ? liveData.bias : "Neutral";
    const confidence = isLiveData ? liveData.confidence : "0%";
    const aiInsightText = isLiveData ? liveData.aiInsight : (rawValue !== null ? "Manual override provided." : "Waiting for market data...");

    const whyItMatters = [
        "Monitors intraday market flows.",
        "Highlights institutional directional bets.",
        "Tracks smart money positioning.",
        "Identifies short-term trend reversals.",
        "Crucial for day trading options."
    ];

    const displayValue = rawValue !== null && rawValue !== '--' ? formatIndianNumber(rawValue) : '--';

    const details = [
        { label: "OI Change (%)", value: (oiChangePct != null && oiChangePct !== '--') ? `${oiChangePct > 0 ? '+' : ''}${parseFloat(oiChangePct).toFixed(2)}%` : '--', color: (oiChangePct != null && oiChangePct !== '--') ? (oiChangePct > 0 ? "text-green-500" : "text-red-500") : "" },
        { label: "Position", value: position, color: bias?.includes("Bullish") ? "text-green-500" : bias?.includes("Bearish") ? "text-red-500" : "text-blue-500" }
    ];

    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Open Interest Change", 
                category: "Open Interest", 
                mode: isLiveData ? "AUTO" : "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'), 
                source: isLiveData ? configData.source : "Manual", 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Current OI Change", value: displayValue }, 
                details, 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={null}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
        />
    );
}
