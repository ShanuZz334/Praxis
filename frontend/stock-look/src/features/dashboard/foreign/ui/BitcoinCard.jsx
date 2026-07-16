import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { Edit2 } from 'lucide-react';

export default function BitcoinCard({ cardData, resolveTime, isLive }) {
    const configData = getIndicatorConfig('bitcoin');
    
    const rawValue = cardData?.value;
    const hasValue = rawValue !== null && rawValue !== undefined && rawValue !== '';
    const parsed = parseFloat(String(rawValue).replace(/,/g, ''));
    const displayValue = hasValue && !isNaN(parsed) ? `$${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--';

    return (
        <IndicatorCard
            config={{ 
                title: "Bitcoin (BTC/USD)", 
                category: "Digital Assets", 
                mode: isLive ? "AUTO" : "MANUAL", 
                creditScore: 6, 
                updateTime: resolveTime, 
                source: "Global Market Data", 
                aiModel: "Qwen3 8B" 
            }}
            data={{ 
                currentValueObj: { 
                    label: "Current Price", 
                    value: displayValue 
                }, 
                score: cardData?.score ?? 50, 
                bias: cardData?.bias ?? "Neutral", 
                confidence: `${cardData?.confidence ?? 75}%`, 
                impactWeight: cardData?.impact ?? configData.impactWeight 
            }}
            insights={{ 
                aiInsight: cardData?.insight ?? "Waiting for manual input...", 
                whyItMatters: [
                    "Measures extreme speculative risk appetite.",
                    "Provides additional global sentiment context."
                ] 
            }}
        />
    );
}
