import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { applyModeAdjustment } from '@/shared/thresholds/modeThresholds';

import { scoreSMA50Card } from '../engine/TechnicalCompositeEngine';

export default function SMA50Card({ cardId, data = null, manualOverride, lastUpdated, tradingMode = 'swing' }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.sma_50.id);
    
    // Resolve current value from live data or manual override
    const currentPrice = data?.current_price ?? null;
    const isLiveData = data?.sma_50 !== undefined && data?.sma_50 !== null && !isNaN(Number(data.sma_50));
    const isManual = !isLiveData && manualOverride !== undefined && manualOverride !== null && manualOverride !== '' && !isNaN(Number(manualOverride));
    const currentValue = isLiveData ? Number(data.sma_50) : (isManual ? Number(manualOverride) : null);
    const mode = isLiveData ? "AUTO" : (isManual ? "MANUAL" : "AUTO");

    const { score, bias, confidence, aiInsight } = applyModeAdjustment(scoreSMA50Card(currentValue, currentPrice), 'sma_50', tradingMode);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? "₹" + parseFloat(currentValue).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "SMA 50", 
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
            chartData={{ points: data?.history || [], valueKey: "value", valueName: "SMA 50" }}
            insights={{ 
                aiInsight: aiInsight, 
                whyItMatters: [
                    "Highly respected medium-term trend indicator.",
                    "Less sensitive to daily volatility than EMA50.",
                    "Used by large institutions to balance their portfolios.",
                    "Major dynamic support during market rallies.",
                    "A key component of the famous 'Golden Cross' and 'Death Cross' signals."
                ] 
            }}
            />
    );
}
