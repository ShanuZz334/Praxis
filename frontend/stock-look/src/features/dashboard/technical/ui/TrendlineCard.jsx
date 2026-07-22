import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

import { scoreTrendlineCard } from '../engine/TechnicalCompositeEngine';

export default function TrendlineCard({ cardId, data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.trendline.id);
    
    // Resolve current value
    // (Assuming Upstox live data mapping will be added here later)
    const isLiveData = false; 
    const currentValue = isLiveData ? null : (manualOverride ?? null);
    const currentPrice = data?.current_price ?? null;

    const { score, bias, confidence, aiInsight } = scoreTrendlineCard(currentValue, currentPrice);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? "₹" + parseFloat(currentValue).toFixed(2) : '--';
return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Trendline", 
                category: "Market Structure", 
                mode: "MANUAL",
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Trendline", value: displayValue }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: [], valueKey: "value", valueName: "Trendline Score" }}
            insights={{ aiInsight: aiInsight, whyItMatters: ["Provides context on volume and market breadth.", "Crucial for confirming trend strength."] }}
            />
    );
}
