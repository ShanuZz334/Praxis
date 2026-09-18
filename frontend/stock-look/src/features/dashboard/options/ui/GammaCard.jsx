import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';
import { scoreGamma, generateGammaInsight } from '../engine/optionsScoringEngine';

export default function GammaCard({ cardId, liveData = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.gamma.id);
    
    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const rawValue = isLiveData ? liveData.currentValue : (isManual ? Number(manualOverride) : null);

    const manualCalculated = isManual ? scoreGamma(rawValue, 24000) : null;
    const optionType = isLiveData ? (liveData.optionType || 'Call') : 'Call';
    const moneyness = isLiveData ? (liveData.moneyness || 'ATM') : 'ATM';
    const rawScore = isLiveData ? liveData.score : (manualCalculated ? manualCalculated.score : null);
    const rawBias  = isLiveData ? liveData.bias  : (manualCalculated ? manualCalculated.bias : 'Neutral');
    const { score, bias } = { ...{ score: rawScore, bias: rawBias }, ...applyModeAdjustment({ score: rawScore, bias: rawBias }, 'gamma', tradingMode) };
    const confidence = isLiveData ? (liveData.confidence || "98%") : (isManual ? "90%" : "0%");
    const aiInsightText = isLiveData ? liveData.aiInsight : (isManual ? generateGammaInsight(rawValue, manualCalculated?.riskLevel) : "Waiting for market data...");

    const displayValue = rawValue !== null && rawValue !== '--' ? parseFloat(rawValue).toFixed(4) : '--';

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
                currentValueObj: { label: "Gamma", value: displayValue }, 
                details: [
                    { label: "Option Type", value: optionType },
                    { label: "Moneyness", value: moneyness }
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
                    "Measures Delta stability.",
                    "Identifies high-risk option positions.",
                    "Supports options risk management.",
                    "Improves strike selection.",
                    "Essential for Gamma exposure analysis."
                ]
            }}
        />
    );
}
