import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

import { scoreADLineCard } from '../engine/TechnicalCompositeEngine';

export default function ADLineCard({ cardId, data = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.ad_line.id);
    
    // Resolve current value
    const liveNet = data?.breadth?.netAdvances;
    const isLiveData = liveNet !== undefined && liveNet !== null;
    const currentValue = isLiveData ? liveNet : (manualOverride ?? null);

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreADLineCard(currentValue), 'ad_line', tradingMode);

    const isManual = !isLiveData && manualOverride !== null && manualOverride !== undefined && manualOverride !== '';

    const num = (currentValue !== null && currentValue !== undefined && currentValue !== '') ? Number(currentValue) : null;
    const displayValue = num !== null && !isNaN(num)
        ? (num > 0 ? `+${num.toLocaleString()}` : `${num.toLocaleString()}`)
        : '--';

    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Advance / Decline Line", 
                category: "Market Breadth", 
                mode: isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO"),
                creditScore: configData.creditScore, 
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || "--:--"), 
                source: isLiveData ? configData.source : "Manual", 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "A/D Line", value: displayValue }, 
                details: [],
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight,
                isManual
            }}
            chartData={{ points: [], valueKey: "value", valueName: "A/D Line" }}
            insights={{ aiInsight: aiInsight, whyItMatters: ["Provides context on volume and market breadth.", "Crucial for confirming trend strength."] }}
            />
    );
}
