import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function CreditRatingCard({ cardId, manualOverrides = {}, lastUpdated }) {
    // Credit Rating is manual-only for now
    const rating = manualOverrides.credit_rating_value || null;
    const agency = manualOverrides.credit_rating_agency || null;
    const outlook = manualOverrides.credit_rating_outlook || null;

    let score = null;
    let bias = 'Neutral';

    if (rating) {
        const r = rating.toUpperCase();
        if (r.includes('AAA') || r.includes('AA+') || r.includes('AA-') || r.includes('A1+')) {
            score = 90; bias = 'Bullish';
        } else if (r.includes('A+') || r.includes('A-') || r === 'A') {
            score = 75; bias = 'Bullish';
        } else if (r.includes('BBB')) {
            score = 50; bias = 'Neutral';
        } else {
            score = 20; bias = 'Bearish';
        }
    }

    const configData = getIndicatorConfig('credit_rating') || { creditScore: 7, impactWeight: 6.0, aiModel: 'Engine v2' };

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Credit Rating',
                category: 'Risk',
                mode: 'MANUAL',
                creditScore: configData.creditScore,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(false) : (lastUpdated || '--:--'),
                source: 'Manual',
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: 'Rating', value: rating || '--' },
                details: [
                    agency && { label: 'Agency', value: agency, isManual: false },
                    outlook && { label: 'Outlook', value: outlook, isManual: false },
                ].filter(Boolean),
                score: score,
                bias: bias,
                confidence: '80%',
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: [], valueKey: 'value', valueName: 'Rating' }}
            insights={{
                aiInsight: 'Reflects the creditworthiness and default risk assessed by major rating agencies.',
                whyItMatters: [
                    'A downgrade can increase the cost of debt significantly.',
                    'Institutional debt funds are often mandated to sell if ratings fall below AA or A.',
                    'Positive outlooks often precede formal rating upgrades, leading to lower borrowing costs.'
                ]
            }}
        />
    );
}
