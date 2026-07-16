import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function IvPercentileCard({ liveData = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig('iv_percentile');
    
    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    const rawValue = isLiveData ? liveData.currentValue : (manualOverride ?? null);

    const score = isLiveData ? liveData.score : (rawValue !== null ? 50 : null);
    const bias = isLiveData ? liveData.bias : "Neutral";
    const confidence = isLiveData ? liveData.confidence : "0%";
    const aiInsightText = isLiveData ? liveData.aiInsight : (rawValue !== null ? "Manual override provided." : "Waiting for manual data...");

    const whyItMatters = [
        "Measures historical volatility frequency.",
        "Evaluates option premium levels.",
        "Supports volatility trading strategies.",
        "Complements IV Rank.",
        "Improves options pricing analysis."
    ];

    return (
        <IndicatorCard
            config={{
                title: "IV Percentile",
                category: "Volatility",
                mode: "MANUAL",
                creditScore: configData.creditScore,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(false) : (lastUpdated || '--:--'),
                source: "Manual",
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "IV Percentile", value: rawValue !== null && rawValue !== '--' ? `${parseFloat(rawValue).toFixed(1)}%` : '--' },
                details: [
                    { label: "Lookback Period", value: liveData?.lookback ? `${liveData.lookback} Days` : "252 Days" }
                ],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: [], valueKey: "value", valueName: "IV Percentile" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
        />
    );
}
