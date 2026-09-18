import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

import { scoreEMA20Card } from '../engine/TechnicalCompositeEngine';

export default function EMA20Card({ cardId, data = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.ema_20.id);
    
    // Resolve current value from live data or manual override
    const currentPrice = data?.current_price ?? null;
    const isLiveData = data?.ema_20 !== undefined && data?.ema_20 !== null && !isNaN(Number(data.ema_20));
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const currentValue = isLiveData ? Number(data.ema_20) : (isManual ? Number(manualOverride) : null);
    const mode = isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO");

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreEMA20Card(currentValue, currentPrice), 'ema_20', tradingMode);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? "₹" + parseFloat(currentValue).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "EMA 20", 
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
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "EMA 20" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "One of the most widely used short-term trend indicators.",
                    "Acts as dynamic support during uptrends.",
                    "Acts as dynamic resistance during downtrends.",
                    "Reacts faster than SMA because recent prices carry more weight.",
                    "Forms the foundation for many institutional trading systems."
                ] 
            }}
            />
    );
}
