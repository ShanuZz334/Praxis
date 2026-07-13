import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scoreNhnlCard } from '../engine/TechnicalCompositeEngine';

export default function NhnlCard({ data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig('nh_nl');
    
    // Resolve current value
    // (Assuming Upstox live data mapping will be added here later)
    const isLiveData = false; 
    const currentValue = isLiveData ? null : (manualOverride ?? null);

    const { score, bias, confidence, aiInsight } = scoreNhnlCard(currentValue);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? parseFloat(currentValue).toFixed(2) : '--';
return (
        <IndicatorCard
            config={{ 
                title: "New High / New Low", 
                category: "Market Breadth", 
                mode: "MANUAL",
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "NH/NL Ratio", value: displayValue }, 
                details: [],
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: [], valueKey: "value", valueName: "NH/NL %" }}
            insights={{ aiInsight: aiInsight, whyItMatters: ["Provides context on volume and market breadth.", "Crucial for confirming trend strength."] }}
            />
    );
}
