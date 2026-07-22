import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { generateAiInsightPERatioCard, scorePERatio } from '@/features/dashboard/fundamentals/engine/scoringEngine';
// ─── Main Component ─────────────────────────────────────────────────────────
export default function PERatioCard({ cardId, data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.pe_ratio.id);

    // ── Step 1: Resolve currentPE (Live from Upstox or manual fallback) ────
    const ratiosArray = Array.isArray(data?.ratios) ? data.ratios : [];
    const upstoxPEObj = ratiosArray.find(r =>
        r.name === 'P/E' ||
        r.name === 'PE' ||
        r.name?.toLowerCase() === 'p/e ratio' ||
        r.name?.toLowerCase().includes('price to earnings')
    );
    const parsedPE = upstoxPEObj?.company_value ? cleanNum(upstoxPEObj.company_value) : null;

    const isLiveData = parsedPE !== null && !isNaN(parsedPE) && parsedPE > 0;
    const currentPE  = isLiveData ? parsedPE : (manualOverride ?? null);

    // ── Step 2: Resolve Sector PE (Live from Upstox) ──────────
    const sectorPE = upstoxPEObj?.sector_value ? cleanNum(upstoxPEObj.sector_value) : null;
    const historicalPE = null; // Removed to strictly comply with Zero Clutter Rule (NO Fallbacks/Historical inputs)

    // ── Step 3: Run Engine ────────────────────────────────────────────────
    const { score, bias, confidence } = scorePERatio(currentPE, historicalPE, sectorPE);

    // ── Step 4: Dynamic AI Insight ────────────────────────────────────────
    const aiInsight = generateAiInsightPERatioCard(currentPE, historicalPE, sectorPE, bias);

    // ── Step 5: Display Value Formatting ──────────────────────────────────
    const displayPE = currentPE !== null && !isNaN(currentPE)
        ? `${cleanNum(currentPE).toFixed(2)}x`
        : '--';

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'P/E Ratio',
                category: 'Valuation',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore ?? 5,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'),
                source: isLiveData ? 'Upstox' : 'Manual',
                aiModel: configData?.aiModel ?? 'Engine v2'
            }}
            data={{
                currentValueObj: {
                    label: 'Current P/E',
                    value: displayPE,
                },
                details: [
                    sectorPE !== null && {
                        label: 'Sector P/E',
                        value: `${cleanNum(sectorPE).toFixed(2)}x`,
                        isManual: false,
                    }
                ].filter(Boolean),
                score,
                bias,
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 5.0,
            }}
            chartData={{
                points: [],   // Chart populated when historical ratio data is available
                valueKey: 'value',
                valueName: 'P/E Ratio',
            }}
            insights={{
                aiInsight,
                whyItMatters: [
                    'Primary metric for relative equity valuation — compares price to earnings power.',
                    'A PE below historical average may signal undervaluation; above may signal overextension.',
                    'Sector-relative PE reveals whether a stock is cheap or expensive vs its peers.',
                    'High PE requires strong future earnings growth to be justified — tracks growth expectations.',
                    'Low PE can signal value opportunities but may also reflect deteriorating fundamentals.',
                ],
            }}
        />
    );
}
