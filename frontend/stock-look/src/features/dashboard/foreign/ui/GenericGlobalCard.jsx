import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { cleanNum } from '@/lib/utils';
import { ID_TO_TITLE_GLOBAL } from '../engine/useGlobalComposite';

export default function GenericGlobalCard({ id, label, engineData, resolveTime, isLive }) {
    const configData = getIndicatorConfig(id) || {};
    const title = label || ID_TO_TITLE_GLOBAL[id] || id;

    const rawValue = engineData?.value;
    const hasValue = rawValue !== null && rawValue !== undefined && rawValue !== '';
    let displayValue = '--';
    if (hasValue) {
        const parsed = cleanNum(rawValue);
        if (parsed === null) {
            displayValue = rawValue?.toString() || '--';
        } else if (id === 'us_10y_yield') {
            displayValue = `${parsed.toFixed(2)}%`;
        } else if (id === 'vix' || id === 'move') {
            displayValue = parsed.toFixed(2);
        } else if (['sp_futures', 'nasdaq_futures', 'dow_futures', 'dow_jones'].includes(id)) {
            displayValue = `$${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (id === 'nikkei') {
            displayValue = `¥${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (id === 'ftse') {
            displayValue = `£${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (['dax', 'cac40', 'eurostoxx'].includes(id)) {
            displayValue = `€${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (id === 'hangseng') {
            displayValue = `HK$${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (id === 'shanghai') {
            displayValue = `¥${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (id === 'usd_inr') {
            displayValue = `₹${parsed.toFixed(2)}`;
        } else if (id === 'usdjpy') {
            displayValue = `¥${parsed.toFixed(2)}`;
        } else if (id === 'eurusd') {
            displayValue = `$${parsed.toFixed(4)}`;
        } else if (id === 'dxy') {
            displayValue = parsed.toFixed(2);
        } else if (id === 'copper') {
            const v = parsed > 10 ? parsed / 100 : parsed;
            displayValue = `$${v.toFixed(2)}/lb`;
        } else if (['gold', 'silver', 'natgas', 'crude', 'bitcoin', 'ethereum', 'aluminum'].includes(id)) {
            displayValue = `$${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (id === 'wheat') {
            displayValue = `${parsed.toFixed(2)} ¢/bu`;
        } else {
            displayValue = parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    }

    // Standardize fallbacks
    let score = null;
    let bias = "Neutral";
    let confidence = "0%";
    let aiInsightText = "Waiting for manual input...";
    
    // Override with engineData
    score = engineData?.score ?? score;
    bias = engineData?.bias ?? bias;
    confidence = engineData?.confidence !== undefined ? `${engineData.confidence}%` : confidence;
    aiInsightText = engineData?.insight ?? aiInsightText;

    return (
        <IndicatorCard
            cardId={id}
            config={{
                title: title,

                category: "Global Macro",
                mode: isLive ? "AUTO" : "MANUAL",
                creditScore: configData.creditScore ?? 5,
                updateTime: typeof resolveTime === 'function' ? resolveTime(isLive) : resolveTime,
                source: configData.source || "Global Market Data",
                aiModel: configData.aiModel || "Qwen3 8B"
            }}
            data={{
                currentValueObj: { 
                    label: "Current Value", 
                    value: displayValue
                },
                score,
                bias,
                confidence,
                impactWeight: engineData?.impact ?? (configData.impactWeight || "Moderate")
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    "Monitors structural shifts in global macroeconomics.",
                    "Influences systemic risk and cross-asset correlations.",
                    "Directly impacts institutional asset allocation."
                ]
            }}
        />
    );
}
