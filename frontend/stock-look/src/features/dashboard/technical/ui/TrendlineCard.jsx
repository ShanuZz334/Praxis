import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

import { scoreTrendlineCard } from '../engine/TechnicalCompositeEngine';

export default function TrendlineCard({ cardId, data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.trendline.id);
    
    // Check if we have dynamic linear regression trendline data from the backend
    let trendlineObj = data?.trendline ?? null;
    let isManual = false;
    let currentValue = trendlineObj;
    const currentPrice = data?.current_price ?? null;

    if (manualOverride !== undefined && manualOverride !== null && manualOverride !== '') {
        const parsed = parseFloat(manualOverride);
        if (!isNaN(parsed)) {
            currentValue = parsed;
            isManual = true;
        }
    }

    const isLiveData = !!trendlineObj;
    const { score, bias, confidence, aiInsight } = scoreTrendlineCard(currentValue, currentPrice);

    // Format display depending on if it's manual (price level) or dynamic (slope object)
    let displayValue = '--';
    let details = [];

    if (isManual && typeof currentValue === 'number') {
        displayValue = "₹" + currentValue.toFixed(2);
    } else if (trendlineObj && typeof trendlineObj === 'object') {
        displayValue = (trendlineObj.slopePct > 0 ? "+" : "") + trendlineObj.slopePct.toFixed(2) + "%";
        if (trendlineObj.r2 !== undefined) {
            details.push({ label: 'R-Squared', value: trendlineObj.r2.toFixed(2), isManual: false });
        }
        if (trendlineObj.standardError !== undefined) {
            details.push({ label: 'Std. Error', value: "±" + trendlineObj.standardError.toFixed(2), isManual: false });
        }
    }

    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Trendline", 
                category: "Market Structure", 
                mode: (isLiveData && !isManual) ? 'AUTO' : 'MANUAL',
                creditScore: configData.creditScore, 
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData && !isManual) : (lastUpdated || '--:--'),
                source: (isLiveData && !isManual) ? 'System' : 'Manual',
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: isManual ? "Level" : "Slope", value: displayValue, isManual }, 
                details, 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: [], valueKey: "value", valueName: "Trendline Score" }}
            insights={{ aiInsight: aiInsight, whyItMatters: ["Validates the structural direction of the trend.", "High R-Squared confirms institutional algorithmic trading adherence."] }}
        />
    );
}
