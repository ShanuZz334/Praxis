import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';
import { formatIndianNumber } from '@/shared/utils/formatters';

export default function ExpectedMoveCard({ cardId, liveData = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.expected_move.id);

    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const rawValue = isLiveData ? liveData.currentValue : (isManual ? Number(manualOverride) : null);

    const rawScore = isLiveData ? liveData.score : (rawValue !== null ? 55 : null);
    const rawBias  = isLiveData ? liveData.bias  : 'Range-Bound';
    const { score, bias } = { ...{ score: rawScore, bias: rawBias }, ...applyModeAdjustment({ score: rawScore, bias: rawBias }, 'expected_move', tradingMode) };
    const confidence = isLiveData ? (liveData.confidence || "92%") : (isManual ? "80%" : "0%");
    const aiInsightText = isLiveData ? liveData.aiInsight : (rawValue !== null ? `Expected Move manually set to ±₹${rawValue}. Serves as implied expiry containment band.` : "Awaiting live options chain data to calculate Expected Move...");

    const whyItMatters = [
        "Defines the 1-standard-deviation pricing boundary established by option market makers.",
        "Derived from ATM straddle pricing and implied volatility for the selected expiry.",
        "Prices contained within the expected move confirm controlled market positioning.",
        "Breaches beyond the 1σ band trigger sharp gamma hedging and volatility expansion.",
        "Essential benchmark for iron condors, straddles, and expiry breakout plays."
    ];

    const displayValue = rawValue !== null && rawValue !== '--' ? `±₹${Number(rawValue).toFixed(1)}` : '--';

    const upperVal = isLiveData && liveData?.upperBand ? `₹${formatIndianNumber(Math.round(liveData.upperBand))}` : '--';
    const lowerVal = isLiveData && liveData?.lowerBand ? `₹${formatIndianNumber(Math.round(liveData.lowerBand))}` : '--';
    const pctVal   = isLiveData && liveData?.emPct != null ? `±${Number(liveData.emPct).toFixed(2)}%` : '--';

    const details = [
        { label: "Upper Band", value: upperVal, color: "text-emerald-400" },
        { label: "Lower Band", value: lowerVal, color: "text-red-400" },
        { label: "Move %",     value: pctVal }
    ];

    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Expected Move", 
                category: "Market Positioning", 
                mode: isLiveData ? "AUTO" : "MANUAL", 
                creditScore: configData?.creditScore ?? 8, 
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'), 
                source: isLiveData ? (liveData?.method ? `Upstox (${liveData.method})` : "Upstox Option Chain") : "Manual", 
                aiModel: configData?.aiModel ?? "Qwen3 8B" 
            }}
            data={{ 
                currentValueObj: { label: "1σ Expected Move", value: displayValue }, 
                details, 
                score, 
                bias, 
                confidence, 
                impactWeight: configData?.impactWeight ?? "7.0%",
                isManual
            }}
            chartData={{ points: [], valueKey: "value", valueName: "Expected Move" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
        />
    );
}
