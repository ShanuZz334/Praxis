import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

import { scoreVolumeSmaCard } from '../engine/TechnicalCompositeEngine';

export default function VolumeSmaCard({ cardId, data = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.volume_sma.id);
    
    // Resolve current value from live backend data or manual override
    const isLiveData = data?.volume_sma !== undefined && data?.volume_sma !== null && !isNaN(Number(data.volume_sma));
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const currentValue = isLiveData ? Number(data.volume_sma) : (isManual ? Number(manualOverride) : null);
    const mode = isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO");

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreVolumeSmaCard(currentValue, data?.current_volume, data?.current_price, data?.open_price), 'volume_sma', tradingMode);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(currentValue) : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: "Volume SMA (20)",
                category: "Volume Analysis",
                mode,
                creditScore: configData.creditScore,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || "--:--"),
                source: isLiveData ? configData.source : "Manual",
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "Volume SMA", value: displayValue },
                details: [
                    { label: "Current Vol", value: data?.current_volume ? Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(data.current_volume) : "--" }
                ],
                score,
                bias,
                confidence,
                impactWeight: configData.impactWeight,
                isManual
            }}
            chartData={{
                points: data?.history || [],
                valueKey: "value",
                valueName: "Volume Ratio"
            }}
            insights={{
                aiInsight: aiInsight,
                whyItMatters: ["Provides context on volume and market breadth.", "Crucial for confirming trend strength."] }}
            />
    );
}
