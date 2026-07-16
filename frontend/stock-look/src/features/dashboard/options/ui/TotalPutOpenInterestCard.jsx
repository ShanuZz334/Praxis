import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { formatIndianNumber } from '@/shared/utils/formatters';

export default function TotalPutOpenInterestCard({ liveData = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig('total_put_oi');
    
    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    const rawValue = isLiveData ? liveData.currentValue : (manualOverride ?? null);

    const highestOIStrike = isLiveData ? liveData.highestOIStrike : '--';
    const oiChange = isLiveData ? liveData.oiChange : '--';
    const score = isLiveData ? liveData.score : (rawValue !== null ? 50 : null);
    const bias = isLiveData ? liveData.bias : "Neutral";
    const confidence = isLiveData ? liveData.confidence : "0%";
    const aiInsightText = isLiveData ? liveData.aiInsight : (rawValue !== null ? "Manual override provided." : "Waiting for market data...");

    const whyItMatters = [
        "Identifies potential support zones.",
        "Tracks institutional option writing.",
        "Measures market positioning.",
        "Confirms trend strength.",
        "Supports options-based market analysis."
    ];

    const displayValue = rawValue !== null && rawValue !== '--' ? formatIndianNumber(rawValue) : '--';

    const details = [
        { label: "Highest OI Strike", value: highestOIStrike !== '--' ? highestOIStrike.toLocaleString() : '--' },
        { label: "Change", value: oiChange !== '--' ? (oiChange > 0 ? `+${formatIndianNumber(oiChange)}` : formatIndianNumber(oiChange)) : '--', color: oiChange > 0 ? "text-green-500" : (oiChange < 0 ? "text-red-500" : "") }
    ];

    return (
        <IndicatorCard
            config={{ 
                title: "Total Put Open Interest", 
                category: "Open Interest", 
                mode: isLiveData ? "AUTO" : "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'), 
                source: isLiveData ? configData.source : "Manual", 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Total Put OI", value: displayValue }, 
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
