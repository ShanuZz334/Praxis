import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

import { scoreFibonacciCard } from '../engine/TechnicalCompositeEngine';

export default function FibonacciCard({ cardId, data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.fibonacci.id);
    
    const liveValue = data?.fibonacci ?? null;
    const isManual = liveValue === null && manualOverride !== null && manualOverride !== undefined;
    const currentPrice = data?.current_price ?? null;
    
    let currentValue = liveValue;
    if (isManual) {
        const valVal = parseFloat(manualOverride);
        currentValue = {
            level_500: valVal,
            level_382: valVal * 1.01,
            level_618: valVal * 0.99,
            level_0: valVal * 1.05,
            level_236: valVal * 1.03,
            level_705: valVal * 0.98,
            level_786: valVal * 0.97,
            level_100: valVal * 0.95,
            level_1272: valVal * 0.92,
            level_1414: valVal * 0.90,
            level_1618: valVal * 0.88,
            level_2000: valVal * 0.85,
            level_2618: valVal * 0.80
        };
    }

    const { score, bias, confidence, aiInsight, nearestFib, nearestFibVal, distancePct } = scoreFibonacciCard(currentValue, currentPrice);

    return (
        <IndicatorCard
            cardId={cardId}
            config={{ 
                title: "Fibonacci Retracement", 
                category: "Market Structure", 
                mode: isManual ? "MANUAL" : "AUTO", 
                creditScore: configData.creditScore, 
                updateTime: lastUpdated ?? "--:--", 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { 
                    label: `Nearest Fib: ${nearestFib ?? '--'}`, 
                    value: nearestFibVal ? "₹" + nearestFibVal.toFixed(2) : "--",
                    isManual
                }, 
                details: [
                    { label: "Distance", value: distancePct ? `${distancePct.toFixed(2)}%` : "--" },
                    { label: "0.786", value: currentValue?.level_786 ? "₹" + currentValue.level_786.toFixed(2) : "--" },
                    { label: "0.705", value: currentValue?.level_705 ? "₹" + currentValue.level_705.toFixed(2) : "--" },
                    { label: "0.618", value: currentValue?.level_618 ? "₹" + currentValue.level_618.toFixed(2) : "--" },
                    { label: "0.500", value: currentValue?.level_500 ? "₹" + currentValue.level_500.toFixed(2) : "--" },
                    { label: "0.382", value: currentValue?.level_382 ? "₹" + currentValue.level_382.toFixed(2) : "--" },
                    // Full list for the modal expansion (if supported) or just basic ones.
                    { label: "0.000 (Top)", value: currentValue?.level_0 ? "₹" + currentValue.level_0.toFixed(2) : "--", hidden: true },
                    { label: "0.236", value: currentValue?.level_236 ? "₹" + currentValue.level_236.toFixed(2) : "--", hidden: true },
                    { label: "1.000 (Base)", value: currentValue?.level_100 ? "₹" + currentValue.level_100.toFixed(2) : "--", hidden: true },
                    { label: "1.272 (Ext)", value: currentValue?.level_1272 ? "₹" + currentValue.level_1272.toFixed(2) : "--", hidden: true },
                    { label: "1.414 (Ext)", value: currentValue?.level_1414 ? "₹" + currentValue.level_1414.toFixed(2) : "--", hidden: true },
                    { label: "1.618 (Ext)", value: currentValue?.level_1618 ? "₹" + currentValue.level_1618.toFixed(2) : "--", hidden: true },
                    { label: "2.000 (Ext)", value: currentValue?.level_2000 ? "₹" + currentValue.level_2000.toFixed(2) : "--", hidden: true },
                    { label: "2.618 (Ext)", value: currentValue?.level_2618 ? "₹" + currentValue.level_2618.toFixed(2) : "--", hidden: true }
                ].filter(d => !d.hidden),
                score, 
                bias, 
                confidence, 
                impactWeight: configData.impactWeight 
            }}
            chartData={{ points: [], valueKey: "value", valueName: "Fibonacci Score" }}
            insights={{ aiInsight: aiInsight, whyItMatters: ["Fibonacci retracements identify hidden support/resistance zones.", "Calculated based on the High/Low over a lookback period.", "The 0.618 level is known as the 'Golden Pocket'."] }}
            />
    );
}
