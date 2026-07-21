import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function FnOBanCard({ cardId, data, manualOverrides = {}, lastUpdated }) {
    const mwplPct = data?.mwplPct ?? (manualOverrides.mwpl_pct ? parseFloat(manualOverrides.mwpl_pct) : null);
    const isBanned = data?.banStatus === true || manualOverrides.ban_status === 'true';
    const daysInBan = data?.daysInBan ?? (manualOverrides.days_in_ban ? parseInt(manualOverrides.days_in_ban) : 0);

    let score = null;
    let bias = 'Neutral';

    if (mwplPct !== null) {
        if (isBanned) {
            score = 10; bias = 'Bearish';
        } else if (mwplPct > 95) {
            score = 30; bias = 'Bearish'; // Near ban
        } else if (mwplPct < 80) {
            score = 70; bias = 'Bullish'; // Safe
        } else {
            score = 50; bias = 'Neutral';
        }
    }

    const configData = getIndicatorConfig('fno_ban') || { creditScore: 4, impactWeight: 6.0, aiModel: 'Engine v2' };

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'F&O Ban Status',
                category: 'Market Positioning',
                mode: 'MANUAL',
                creditScore: configData.creditScore,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(mwplPct !== null) : (lastUpdated || '--:--'),
                source: 'NSE',
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { 
                    label: 'Status', 
                    value: isBanned ? 'BANNED' : 'ACTIVE' 
                },
                details: [
                    mwplPct !== null && { label: 'MWPL', value: `${mwplPct.toFixed(1)}%`, isManual: false },
                    isBanned && { label: 'Days in Ban', value: daysInBan.toString(), isManual: false },
                ].filter(Boolean),
                score: score,
                bias: bias,
                confidence: '100%',
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: [], valueKey: 'value', valueName: 'MWPL %' }}
            insights={{
                aiInsight: 'Tracks the Market Wide Position Limit (MWPL). Breach of 95% triggers an F&O ban.',
                whyItMatters: [
                    'Stocks in F&O ban prohibit new positions, reducing liquidity.',
                    'Ban periods often lead to short-covering if the stock was heavily shorted.',
                    'Consistently hovering near 95% shows extreme speculative interest.'
                ]
            }}
        />
    );
}
