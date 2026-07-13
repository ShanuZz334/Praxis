import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { scorePivotCard } from '../engine/TechnicalCompositeEngine';

export default function PivotCard({ data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig('pivot');
    
    const liveValue = data?.pivot ?? null;
    const isManual = liveValue === null && manualOverride !== null && manualOverride !== undefined;
    const currentPrice = data?.current_price ?? null;

    let currentValue = liveValue;
    if (isManual) {
        const pVal = parseFloat(manualOverride);
        currentValue = {
            p: pVal,
            r1: null, r2: null, r3: null,
            s1: null, s2: null, s3: null
        };
    }

    const { score, bias, confidence, aiInsight } = scorePivotCard(currentValue, currentPrice);

    return (
        <IndicatorCard
            config={{ 
                title: "Pivot Points", 
                category: "Market Structure", 
                mode: isManual ? "MANUAL" : "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { label: "Daily Pivot", value: currentValue?.p ? "₹" + currentValue.p.toFixed(2) : "--", isManual }, 
                details: [
                    { label: "R3", value: currentValue?.r3 ? "₹" + currentValue.r3.toFixed(2) : "--" },
                    { label: "R2", value: currentValue?.r2 ? "₹" + currentValue.r2.toFixed(2) : "--" },
                    { label: "R1", value: currentValue?.r1 ? "₹" + currentValue.r1.toFixed(2) : "--" },
                    { label: "S1", value: currentValue?.s1 ? "₹" + currentValue.s1.toFixed(2) : "--" },
                    { label: "S2", value: currentValue?.s2 ? "₹" + currentValue.s2.toFixed(2) : "--" },
                    { label: "S3", value: currentValue?.s3 ? "₹" + currentValue.s3.toFixed(2) : "--" }
                ], 
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: [], valueKey: "value", valueName: "Pivot Score" }}
            insights={{ aiInsight: aiInsight, whyItMatters: ["Pivots act as critical intraday support and resistance.", "Calculated using the previous day's high, low, and close.", "Price above the pivot is bullish; below is bearish."] }}
            />
    );
}
