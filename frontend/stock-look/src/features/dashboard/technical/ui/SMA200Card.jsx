import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

import { scoreSMA200Card } from '../engine/TechnicalCompositeEngine';

export default function SMA200Card({ cardId, data = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.sma_200.id);
    
    // Resolve current value from live data or manual override
    const currentPrice = data?.current_price ?? null;
    const isLiveData = data?.sma_200 !== undefined && data?.sma_200 !== null && !isNaN(Number(data.sma_200));
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const currentValue = isLiveData ? Number(data.sma_200) : (isManual ? Number(manualOverride) : null);
    const mode = isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO");

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreSMA200Card(currentValue, currentPrice), 'sma_200', tradingMode);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? "₹" + parseFloat(currentValue).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "SMA 200", 
                category: "Trend", 
                mode, 
                creditScore: configData.creditScore, 
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || "--:--"), 
                source: isLiveData ? configData.source : "Manual", 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Value", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight,
                isManual
            }}
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "SMA 200" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "The ultimate institutional benchmark for long-term trend direction.",
                    "Slower and more stable than EMA200.",
                    "Used globally by investors to filter bull and bear markets.",
                    "Major resistance in bear markets and major support in bull markets.",
                    "Forms the slower leg of the famous 'Golden Cross' signal."
                ] 
            }}
            />
    );
}
