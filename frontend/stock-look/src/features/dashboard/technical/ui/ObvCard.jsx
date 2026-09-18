import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

import { scoreObvCard } from '../engine/TechnicalCompositeEngine';

export default function ObvCard({ cardId, data = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.obv.id);
    
    // Resolve current value from live backend data or manual override
    const isLiveData = data?.obv !== undefined && data?.obv !== null && !isNaN(Number(data.obv));
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const currentValue = isLiveData ? Number(data.obv) : (isManual ? Number(manualOverride) : null);
    const mode = isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO");

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreObvCard(currentValue, data?.obv_sma), 'obv', tradingMode);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(currentValue) : '--';
    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: "On-Balance Volume (OBV)",
                category: "Volume Analysis",
                mode,
                creditScore: configData.creditScore,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || "--:--"),
                source: isLiveData ? configData.source : "Manual",
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "Current OBV", value: displayValue },
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
                valueName: "OBV"
            }}
            insights={{
                aiInsight: aiInsight,
                whyItMatters: ["Provides context on volume and market breadth.", "Crucial for confirming trend strength."] }}
            />
    );
}
