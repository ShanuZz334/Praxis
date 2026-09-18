import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';
import { scoreVega, generateVegaInsight } from '../engine/optionsScoringEngine';

export default function VegaCard({ cardId, liveData = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.vega.id);
    
    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const rawValue = isLiveData ? liveData.currentValue : (isManual ? Number(manualOverride) : null);

    const manualCalculated = isManual ? scoreVega(rawValue, 15, 24000) : null;
    const currentIV = isLiveData && liveData.impliedVol ? `${liveData.impliedVol.toFixed(2)}%` : '--%';
    const ivSensitivity = isLiveData ? liveData.exposure : (manualCalculated?.exposure || '--');
    const rawScore = isLiveData ? liveData.score : (manualCalculated ? manualCalculated.score : null);
    const rawBias  = isLiveData ? liveData.bias  : (manualCalculated ? manualCalculated.bias : 'Neutral');
    const { score, bias } = { ...{ score: rawScore, bias: rawBias }, ...applyModeAdjustment({ score: rawScore, bias: rawBias }, 'vega', tradingMode) };
    const confidence = isLiveData ? (liveData.confidence || "95%") : (isManual ? "85%" : "0%");
    const aiInsightText = isLiveData ? liveData.aiInsight : (isManual ? generateVegaInsight(rawValue, manualCalculated?.exposure) : "Waiting for market data...");

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
                impactWeight: configData.impactWeight,
                isManual
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
