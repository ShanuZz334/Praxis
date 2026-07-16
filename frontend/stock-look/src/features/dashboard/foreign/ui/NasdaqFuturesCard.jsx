import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { Edit2 } from 'lucide-react';

export default function NasdaqFuturesCard({ cardData, resolveTime, isLive }) {
    const configData = getIndicatorConfig('nasdaq_futures');

    const rawValue = cardData?.value;
    const hasValue = rawValue !== null && rawValue !== undefined && rawValue !== '';
    const parsed = parseFloat(String(rawValue).replace(/,/g, ''));
    const displayValue = hasValue && !isNaN(parsed) ? parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--';

    return (
        <IndicatorCard
            config={{
                title: "Nasdaq Futures",
                category: "Global Macro",
                mode: isLive ? "AUTO" : "MANUAL",
                creditScore: configData.creditScore,
                updateTime: resolveTime,
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { 
                    label: "Current Value", 
                    value: displayValue
                },
                score: cardData?.score ?? 50,
                bias: cardData?.bias ?? "Neutral",
                confidence: `${cardData?.confidence ?? 88}%`,
                impactWeight: cardData?.impact ?? configData.impactWeight
            }}
            insights={{
                aiInsight: cardData?.insight ?? "Waiting for manual input...",
                whyItMatters: [
                    "Barometer for global tech and growth sentiment.",
                    "Directly influences Indian IT sector opening.",
                    "Highly sensitive to global liquidity conditions."
                ]
            }}
        />
    );
}
