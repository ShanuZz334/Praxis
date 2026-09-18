import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

import { scoreVwapCard } from '../engine/TechnicalCompositeEngine';

export default function VwapCard({ cardId, data = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.vwap.id);
    
    // Resolve current value from live backend data or manual override
    const isLiveData = data?.vwap !== undefined && data?.vwap !== null && !isNaN(Number(data.vwap));
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const currentValue = isLiveData ? Number(data.vwap) : (isManual ? Number(manualOverride) : null);
    const mode = isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO");

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreVwapCard(currentValue, data?.current_price), 'vwap', tradingMode);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? "₹" + parseFloat(currentValue).toFixed(2) : '--';
    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: "VWAP",
                category: "Volume Analysis",
                mode,
                creditScore: configData.creditScore,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || "--:--"),
                source: isLiveData ? configData.source : "Manual",
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "Current VWAP", value: displayValue },
                details: [],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight,
                isManual
            }}
            chartData={{
                points: data?.history || [],
                valueKey: "value",
                valueName: "VWAP"
            }}
            insights={{
                aiInsight: aiInsight,
                whyItMatters: ["Provides context on volume and market breadth.", "Crucial for confirming trend strength."] }}
            />
    );
}


