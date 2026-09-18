import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

import { scoreEMA200Card } from '../engine/TechnicalCompositeEngine';

export default function EMA200Card({ cardId, data = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.ema_200.id);
    
    // Resolve current value from live data or manual override
    const currentPrice = data?.current_price ?? null;
    const isLiveData = data?.ema_200 !== undefined && data?.ema_200 !== null && !isNaN(Number(data.ema_200));
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const currentValue = isLiveData ? Number(data.ema_200) : (isManual ? Number(manualOverride) : null);
    const mode = isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO");

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreEMA200Card(currentValue, currentPrice), 'ema_200', tradingMode);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? "₹" + parseFloat(currentValue).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "EMA 200", 
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
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "EMA 200" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "The ultimate institutional trend filter.",
                    "Price above EMA 200 indicates a long-term bull market.",
                    "Price below EMA 200 indicates a long-term bear market.",
                    "Acts as major psychological support and resistance.",
                    "Crucial for identifying macro market regimes."
                ] 
            }}
            />
    );
}
