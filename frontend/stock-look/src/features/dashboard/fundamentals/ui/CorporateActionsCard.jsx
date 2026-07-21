import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function CorporateActionsCard({ cardId, data, lastUpdated }) {
    const actions = Array.isArray(data?.corporate_actions) ? data.corporate_actions : [];
    
    // Sort descending by date if available
    // Assuming action shape: { date: '2023-10-15', purpose: 'Dividend - Rs 5', type: 'dividend' }
    const sortedActions = [...actions].slice(0, 3); // Take top 3 most recent

    const isLiveData = sortedActions.length > 0;
    
    const configData = getIndicatorConfig('corporate_actions') || { creditScore: 4, impactWeight: 2.0, aiModel: 'Engine v2' };

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Corporate Actions',
                category: 'Ownership & Flow',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData.creditScore,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'),
                source: isLiveData ? 'Upstox' : 'No Data',
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { 
                    label: 'Latest Action', 
                    value: isLiveData ? sortedActions[0].purpose || sortedActions[0].type : '--' 
                },
                details: isLiveData ? sortedActions.slice(1).map((a, i) => ({
                    label: a.date || `Action ${i+2}`,
                    value: a.purpose || a.type,
                    isManual: false
                })) : [],
                score: isLiveData ? 50 : null, // Neutral score since this is mostly informational
                bias: 'Neutral',
                confidence: '90%',
                impactWeight: configData.impactWeight
            }}
            chartData={{ points: [], valueKey: 'value', valueName: 'Action' }}
            insights={{
                aiInsight: 'Tracks recent corporate actions like dividends, splits, and buybacks.',
                whyItMatters: [
                    'Buybacks typically signal management believes the stock is undervalued.',
                    'Stock splits increase liquidity and retail participation.',
                    'Consistent dividend payouts reflect strong cash generation.'
                ]
            }}
        />
    );
}
