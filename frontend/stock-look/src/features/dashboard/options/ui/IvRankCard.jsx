import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

export default function IvRankCard({ cardId, liveData = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.iv_rank.id);
    
    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    const rawValue = isLiveData ? liveData.currentValue : (manualOverride ?? null);

    const score = isLiveData ? liveData.score : (rawValue !== null ? 50 : null);
    const bias = isLiveData ? liveData.bias : "Neutral";
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
                mode: "MANUAL",
                creditScore: configData.creditScore,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(false) : (lastUpdated || '--:--'),
                source: "Manual",
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
