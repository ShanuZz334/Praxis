import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scoreVolumeSmaCard } from '../engine/TechnicalCompositeEngine';

export default function VolumeSmaCard({ data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig('volume_sma');
    
    const currentValue = data?.volume_sma ?? null;

    const { score, bias, confidence, aiInsight } = scoreVolumeSmaCard(data?.volume_sma, data?.current_volume);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(currentValue) : '--';
    
    return (
        <IndicatorCard
            config={{
                title: "Volume SMA (20)",
                category: "Volume Analysis",
                mode: "AUTO",
                creditScore: configData.creditScore,
                updateTime: lastUpdated ?? "--:--",
                source: configData.source,
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
                impactWeight: configData.impactWeight
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
