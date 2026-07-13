import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scoreSMA50Card } from '../engine/TechnicalCompositeEngine';

export default function SMA50Card({ data = null, lastUpdated }) {
    const configData = getIndicatorConfig('sma_50');
    
    // Resolve current value
    const currentValue = data?.sma_50 ?? null;
    const currentPrice = data?.current_price ?? null;

    const { score, bias, confidence, aiInsight } = scoreSMA50Card(currentValue, currentPrice);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? "₹" + parseFloat(currentValue).toFixed(2) : '--';
    
    return (
        <IndicatorCard
            config={{ title: "SMA 50", category: "Trend", mode: "AUTO", creditScore: configData.creditScore, updateTime: lastUpdated ?? "--:--", source: configData.source, aiModel: configData.aiModel }}
            data={{ 
                currentValueObj: { label: "Value", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
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
