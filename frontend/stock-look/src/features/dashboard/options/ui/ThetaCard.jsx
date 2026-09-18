import React, { useState } from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';
import { scoreTheta, generateThetaInsight } from '../engine/optionsScoringEngine';

export default function ThetaCard({ cardId, liveData = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.theta.id);
    
    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const rawValue = isLiveData ? liveData.currentValue : (isManual ? Number(manualOverride) : null);

    const manualCalculated = isManual ? scoreTheta(rawValue, 24000) : null;
    const daysToExpiry = isLiveData ? liveData.daysToExpiry : '--';
    const rawScore = isLiveData ? liveData.score : (manualCalculated ? manualCalculated.score : null);
    const rawBias  = isLiveData ? liveData.bias  : (manualCalculated ? manualCalculated.bias : 'Neutral');
    const { score, bias } = { ...{ score: rawScore, bias: rawBias }, ...applyModeAdjustment({ score: rawScore, bias: rawBias }, 'theta', tradingMode) };
    const confidence = isLiveData ? (liveData.confidence || "90%") : (isManual ? "85%" : "0%");
    const aiInsightText = isLiveData ? liveData.aiInsight : (isManual ? generateThetaInsight(rawValue, manualCalculated?.decayPace) : "Waiting for market data...");

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
                currentValueObj: { label: "Theta", value: displayValue }, 
                details: [
                    { label: "Daily Time Decay", value: displayValue },
                    { label: "Days to Expiry", value: daysToExpiry }
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
                    "Measures daily option premium erosion.",
                    "Helps evaluate expiry risk.",
                    "Essential for option selling strategies.",
                    "Supports position management.",
                    "Improves option selection."
                ]
            }}
        />
    );
}
