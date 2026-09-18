import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

export default function IvRankCard({ cardId, liveData = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.iv_rank.id);
    
    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    const rawValue = isLiveData ? liveData.currentValue : (manualOverride ?? null);

    const rawScore = isLiveData ? liveData.score : (rawValue !== null ? 50 : null);
    const rawBias  = isLiveData ? liveData.bias  : 'Neutral';
    const { score, bias } = { ...{ score: rawScore, bias: rawBias }, ...applyModeAdjustment({ score: rawScore, bias: rawBias }, 'iv_rank', tradingMode) };
    const confidence = isLiveData ? liveData.confidence : "0%";
    const aiInsightText = isLiveData ? liveData.aiInsight : (rawValue !== null ? "Manual override provided." : "Waiting for manual data...");

    const whyItMatters = [
        "Identifies expensive and cheap option premiums.",
        "Supports volatility-based strategies.",
        "Improves options timing.",
        "Complements ATM IV and IV Percentile.",
        "Widely used by professional options traders."
    ];

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: "IV Rank",
                category: "Volatility",
                mode: isLiveData ? "AUTO" : "MANUAL",
                creditScore: configData.creditScore,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'),
                source: isLiveData ? "Upstox Live Chain" : "Manual",
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "IV Rank", value: rawValue !== null && rawValue !== '--' ? `${parseFloat(rawValue).toFixed(1)}%` : '--' },
                details: [
                    { label: "Lookback Period", value: liveData?.lookback ? `${liveData.lookback} Days` : "252 Days" }
                ],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: [], valueKey: "value", valueName: "IV Rank" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
        />
    );
}
