import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { Edit2 } from 'lucide-react';

export default function VixCard({ cardData, resolveTime, isLive }) {
    const configData = getIndicatorConfig('vix');
    
    const rawValue = cardData?.value;
    const hasValue = rawValue !== null && rawValue !== undefined && rawValue !== '';
    const displayValue = hasValue ? parseFloat(rawValue).toFixed(2) : '--';

    return (
        <IndicatorCard
            config={{ 
                title: "CBOE Volatility Index (VIX)", 
                category: "Volatility", 
                mode: isLive ? "AUTO" : "MANUAL", 
                creditScore: configData.creditScore, 
                updateTime: resolveTime, 
                source: configData.source, 
                aiModel: configData.aiModel 
            }}
            data={{ 
                currentValueObj: { 
                    label: "Index Value", 
                    value: displayValue 
                }, 
                score: cardData?.score ?? 50, 
                bias: cardData?.bias ?? "Neutral", 
                confidence: `${cardData?.confidence ?? 95}%`, 
                impactWeight: cardData?.impact ?? configData.impactWeight 
            }}
            insights={{ 
                aiInsight: cardData?.insight ?? "Waiting for manual input...", 
                whyItMatters: [
                    "Measures global market fear.",
                    "Reflects expected volatility.",
                    "Confirms overall market sentiment."
                ] 
            }}
        />
    );
}
