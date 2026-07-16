import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { ID_TO_TITLE_GLOBAL } from '../engine/useGlobalComposite';

export default function GenericGlobalCard({ id, label, cardData, resolveTime, isLive }) {
    const configData = getIndicatorConfig(id) || {};
    const title = label || ID_TO_TITLE_GLOBAL[id] || id;

    const rawValue = cardData?.value;
    const hasValue = rawValue !== null && rawValue !== undefined && rawValue !== '';
    let displayValue = '--';
    if (hasValue) {
        // format based on id
                if (id.includes('yield') || id.includes('futures')) {
            displayValue = `${parseFloat(rawValue).toFixed(2)}%`;
        } else if (['gold', 'silver', 'copper', 'natgas', 'wheat', 'aluminum', 'crude', 'bitcoin'].includes(id)) {
            displayValue = `$${parseFloat(rawValue).toFixed(2)}`;
        } else if (['nikkei', 'ftse', 'dax', 'hangseng', 'shanghai', 'cac40', 'eurostoxx'].includes(id)) {
            // These are indices/prices. Typically they don't need decimals or maybe just 2.
            const parsed = parseFloat(rawValue);
            displayValue = isNaN(parsed) ? rawValue : parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            displayValue = parseFloat(rawValue).toFixed(4);
        }
    }

    return (
        <IndicatorCard
            config={{
                title: title,
                category: "Global Macro",
                mode: isLive ? "AUTO" : "MANUAL",
                creditScore: configData.creditScore ?? 5,
                updateTime: resolveTime,
                source: configData.source || "Global Market Data",
                aiModel: configData.aiModel || "Qwen3 8B"
            }}
            data={{
                currentValueObj: { 
                    label: "Current Value", 
                    value: displayValue
                },
                score: cardData?.score ?? 50,
                bias: cardData?.bias ?? "Neutral",
                confidence: `${cardData?.confidence ?? 80}%`,
                impactWeight: cardData?.impact ?? (configData.impactWeight || "Moderate")
            }}
            insights={{
                aiInsight: cardData?.insight ?? "Waiting for manual input...",
                whyItMatters: [
                    "Monitors structural shifts in global macroeconomics.",
                    "Influences systemic risk and cross-asset correlations.",
                    "Directly impacts institutional asset allocation."
                ]
            }}
        />
    );
}
