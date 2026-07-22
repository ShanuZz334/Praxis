import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { gradeAtmIv } from '../engine/optionsScoringEngine';

export default function AtmIvCard({ cardId, liveData = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.atm_iv.id);
    
    // Step 1: Detect if we have live data
    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    
    // Step 2: Use live data OR manual override
    const rawValue = isLiveData ? liveData.currentValue : (manualOverride ?? null);
    
    // Step 3: Grade the manual override if necessary, otherwise use live grade
    let score = 50;
    let bias = "Neutral";
    let confidence = "0%";
    let aiInsightText = "Awaiting volatility data...";
    
    if (isLiveData) {
        score = liveData.score ?? 50;
        bias = liveData.bias ?? "Neutral";
        confidence = liveData.confidence ?? "95%";
        aiInsightText = liveData.aiInsight ?? "Live Volatility Data.";
    } else if (rawValue !== null) {
        const manualGrade = gradeAtmIv(parseFloat(rawValue));
        if (manualGrade) {
            score = manualGrade.score;
            bias = manualGrade.bias;
            confidence = manualGrade.confidence;
            aiInsightText = manualGrade.aiInsight;
        }
    }

    const whyItMatters = [
        "Measures expected market volatility.",
        "Helps evaluate option premiums.",
        "Identifies high-risk periods.",
        "Supports volatility-based trading decisions.",
        "Confirms market uncertainty."
    ];

    const displayValue = rawValue !== null && rawValue !== '--' ? `${parseFloat(rawValue).toFixed(2)}%` : '--';

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: "At-the-Money Implied Volatility",
                category: "Volatility",
                mode: isLiveData ? "AUTO" : "MANUAL",
                creditScore: configData.creditScore,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'),
                source: isLiveData ? configData.source : "Manual",
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "ATM IV (%)", value: displayValue },
                details: [
                    { label: "Trend", value: isLiveData ? "Live" : "Static" }
                ],
                score: rawValue !== null ? score : null,
                bias,
                confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: [], valueKey: "value", valueName: "ATM IV" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
        />
    );
}
