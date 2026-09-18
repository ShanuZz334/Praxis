import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { formatIndianNumber } from '@/shared/utils/formatters';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

export default function TotalCallOpenInterestCard({ cardId, liveData = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.total_call_oi.id);
    
    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const rawValue = isLiveData ? liveData.currentValue : (isManual ? Number(manualOverride) : null);

    const highestOIStrike = isLiveData ? liveData.highestOIStrike : '--';
    const oiChange = isLiveData ? liveData.oiChange : '--';
    const rawScore = isLiveData ? liveData.score : (rawValue !== null ? 60 : null);
    const rawBias  = isLiveData ? liveData.bias  : (rawValue !== null ? "Bearish Resistance" : 'Neutral');
    const { score, bias } = { ...{ score: rawScore, bias: rawBias }, ...applyModeAdjustment({ score: rawScore, bias: rawBias }, 'total_call_oi', tradingMode) };
    const confidence = isLiveData ? (liveData.confidence || "90%") : (isManual ? "80%" : "0%");
    const aiInsightText = isLiveData ? liveData.aiInsight : (rawValue !== null ? `Total Call OI set to ${formatIndianNumber(rawValue)}. Serves as baseline overhead resistance level.` : "Waiting for market data...");

    const whyItMatters = [
        "Identifies potential resistance zones.",
        "Tracks institutional option writing.",
        "Measures market positioning.",
        "Confirms trend strength.",
        "Supports options-based market analysis."
    ];

    const displayValue = rawValue !== null && rawValue !== '--' ? formatIndianNumber(rawValue) : '--';

    const details = [
        { label: "Highest OI Strike", value: (highestOIStrike !== '--' && highestOIStrike != null) ? (isNaN(highestOIStrike) ? highestOIStrike : `₹${Number(highestOIStrike).toLocaleString('en-IN')}`) : '--' },
        { label: "Change", value: oiChange !== '--' ? (oiChange > 0 ? `+${formatIndianNumber(oiChange)}` : formatIndianNumber(oiChange)) : '--', color: oiChange > 0 ? "text-green-500" : (oiChange < 0 ? "text-red-500" : "") }
    ];

    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Total Call Open Interest", 
                category: "Open Interest", 
                mode: isLiveData ? "AUTO" : "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'), 
                source: isLiveData ? configData.source : "Manual", 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Total Call OI", value: displayValue }, 
                details, 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight,
                isManual
            }}
            chartData={null}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
        />
    );
}
