import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scoreResistanceCard } from '../engine/TechnicalCompositeEngine';

export default function ResistanceCard({ cardId, data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig('resistance');
    
    const liveValue = data?.resistance ?? null;
    const isManual = liveValue === null && manualOverride !== null && manualOverride !== undefined;
    const currentValue = liveValue ?? manualOverride ?? null;
    const currentPrice = data?.current_price ?? null;

    const { score, bias, confidence, aiInsight } = scoreResistanceCard(currentValue, currentPrice);

    const displayValue = currentValue !== null && !isNaN(currentValue) ? "₹" + parseFloat(currentValue).toFixed(2) : '--';
return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Resistance Level", 
                category: "Market Structure", 
                mode: isManual ? "MANUAL" : "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Resistance", value: displayValue, isManual }, 
                details: [], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: [], valueKey: "value", valueName: "Resistance Score" }}
            insights={{ aiInsight: aiInsight, whyItMatters: ["Resistance represents overhead supply where sellers previously overpowered buyers.", "A breakout above resistance signals a structural shift to the upside."] }}
            />
    );
}
