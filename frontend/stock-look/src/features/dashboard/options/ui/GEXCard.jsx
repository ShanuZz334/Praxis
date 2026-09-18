import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

export default function GEXCard({ cardId, liveData = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.gex.id);

    const isLiveData = liveData?.currentValue !== undefined && liveData?.currentValue !== null && liveData?.currentValue !== '--';
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const rawValue = isLiveData ? liveData.currentValue : (isManual ? Number(manualOverride) : null);

    const rawScore = isLiveData ? liveData.score : (rawValue !== null ? (rawValue >= 0 ? 65 : 35) : null);
    const rawBias  = isLiveData ? liveData.bias  : (rawValue !== null ? (rawValue >= 0 ? 'Long Gamma' : 'Short Gamma') : 'Neutral Gamma');
    const { score, bias } = { ...{ score: rawScore, bias: rawBias }, ...applyModeAdjustment({ score: rawScore, bias: rawBias }, 'gex', tradingMode) };
    const confidence = isLiveData ? (liveData.confidence || "90%") : (isManual ? "80%" : "0%");
    const aiInsightText = isLiveData ? liveData.aiInsight : (rawValue !== null ? `Net Dealer Gamma Exposure set to ${rawValue} Cr. Evaluates dealer hedging pressure.` : "Awaiting live options chain data to calculate Gamma Exposure...");

    const whyItMatters = [
        "Measures aggregate option dealer gamma exposure across the entire chain.",
        "Positive Gamma (Long GEX): Market makers suppress volatility by buying dips and selling rallies.",
        "Negative Gamma (Short GEX): Market makers amplify volatility by selling drops and chasing rallies.",
        "Identifies gamma squeeze risks and structural market flip points.",
        "Used by institutional desks to determine whether to fade moves or trade breakouts."
    ];

    const displayValue = rawValue !== null && rawValue !== '--'
        ? `${Number(rawValue) >= 0 ? '+' : ''}${Number(rawValue).toFixed(2)} Cr`
        : '--';

    const callGex = isLiveData && liveData?.totalCallGexCr != null ? `+${Number(liveData.totalCallGexCr).toFixed(2)} Cr` : '--';
    const putGex  = isLiveData && liveData?.totalPutGexCr != null ? `-${Number(liveData.totalPutGexCr).toFixed(2)} Cr` : '--';
    const regimeVal = isLiveData && liveData?.regime ? liveData.regime : (rawValue !== null ? (rawValue >= 0 ? 'Positive Gamma' : 'Negative Gamma') : '--');

    const details = [
        { label: "Call GEX", value: callGex, color: "text-emerald-400" },
        { label: "Put GEX",  value: putGex,  color: "text-red-400" },
        { label: "Regime",   value: regimeVal }
    ];

    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Gamma Exposure (GEX)", 
                category: "Market Positioning", 
                mode: isLiveData ? "AUTO" : "MANUAL", 
                creditScore: configData?.creditScore ?? 9, 
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'), 
                source: isLiveData ? "Upstox Dealer Gamma" : "Manual", 
                aiModel: configData?.aiModel ?? "Qwen3 8B" 
            }}
            data={{ 
                currentValueObj: { label: "Net Gamma Exposure", value: displayValue }, 
                details, 
                score, 
                bias, 
                confidence, 
                impactWeight: configData?.impactWeight ?? "8.0%",
                isManual
            }}
            chartData={{ points: [], valueKey: "value", valueName: "GEX" }}
            insights={{ aiInsight: aiInsightText, whyItMatters }}
        />
    );
}
