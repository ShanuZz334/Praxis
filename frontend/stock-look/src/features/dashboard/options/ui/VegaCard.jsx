import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

export default function VegaCard({ cardId, liveData = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.vega.id);
    
    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    const rawValue = isLiveData ? liveData.currentValue : (manualOverride ?? null);

    const currentIV = isLiveData && liveData.impliedVol ? `${liveData.impliedVol.toFixed(2)}%` : '--%';
    const ivSensitivity = isLiveData ? liveData.exposure : '--';
    const score = isLiveData ? liveData.score : (rawValue !== null ? 50 : null);
    const bias = isLiveData ? liveData.bias : "Neutral";
    const confidence = isLiveData ? liveData.confidence : "0%";
    const aiInsightText = isLiveData ? liveData.aiInsight : (rawValue !== null ? "Manual override provided." : "Waiting for market data...");

    const displayValue = rawValue !== null && rawValue !== '--' ? parseFloat(rawValue).toFixed(2) : '--';

    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: configData.title, 
                category: configData.category, 
                mode: isLiveData ? "AUTO" : "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'), 
                source: isLiveData ? configData.source : "Manual", 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Vega", value: displayValue }, 
                details: [
                    { label: "Current IV", value: currentIV },
                    { label: "IV Sensitivity", value: ivSensitivity }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={null}
            insights={{ 
                aiInsight: aiInsightText, 
                whyItMatters: [
                    "Measures volatility sensitivity.",
                    "Helps evaluate option pricing risk.",
                    "Supports volatility-based strategies.",
                    "Improves option selection.",
                    "Essential for volatility trading."
                ]
            }}
        />
    );
}
