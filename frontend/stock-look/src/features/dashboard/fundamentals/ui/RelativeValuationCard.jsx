/**
 * @file RelativeValuationCard.jsx
 * @purpose Compares company valuation multiples (P/E, P/B, EV/EBITDA) against sector averages.
 *
 * DATA SOURCES:
 *  - Upstox key-ratios (company_value vs sector_value for P/E, P/B, EV/EBITDA)
 *
 * SCORING ENGINE:
 *  - Computes premium/discount % for each multiple vs sector
 *  - Blended score: 40% P/E, 35% P/B, 25% EV/EBITDA
 *  - Discount to sector = bullish; premium = bearish
 */
import React from 'react';
import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';

function extractRatio(ratios, names) {
    const item = ratios.find(r => names.some(n => r.name?.toLowerCase() === n.toLowerCase()));
    if (!item) return { company: null, sector: null };
    const company = cleanNum(item.company_value);
    const sector  = cleanNum(item.sector_value);
    return {
        company: isNaN(company) ? null : company,
        sector:  isNaN(sector)  ? null : sector
    };
}

function premiumDiscount(company, sector) {
    if (company === null || sector === null || sector === 0) return null;
    return ((company - sector) / sector) * 100;
}

export default function RelativeValuationCard({ cardId, data = null, lastUpdated }) {
    const ratios = Array.isArray(data?.ratios) ? data.ratios : [];

    const pe   = extractRatio(ratios, ['p/e', 'pe', 'pe ratio']);
    const pb   = extractRatio(ratios, ['p/b', 'pb', 'price to book', 'pb ratio']);
    const eveb = extractRatio(ratios, ['ev/ebitda', 'ev / ebitda']);

    const pePremium   = premiumDiscount(pe.company,   pe.sector);
    const pbPremium   = premiumDiscount(pb.company,   pb.sector);
    const evebPremium = premiumDiscount(eveb.company, eveb.sector);

    const hasData = pe.company !== null || pb.company !== null || eveb.company !== null;
    const hasSectorComparison = pe.sector !== null || pb.sector !== null || eveb.sector !== null;

    // ── Scoring: discount to sector is bullish ──────────────────────────────
    let blendedPremium = null;
    let weights = 0;
    if (pePremium !== null)   { blendedPremium = (blendedPremium || 0) + pePremium   * 0.40; weights += 0.40; }
    if (pbPremium !== null)   { blendedPremium = (blendedPremium || 0) + pbPremium   * 0.35; weights += 0.35; }
    if (evebPremium !== null) { blendedPremium = (blendedPremium || 0) + evebPremium * 0.25; weights += 0.25; }
    if (weights > 0 && blendedPremium !== null) blendedPremium = blendedPremium / weights;

    let score = 0, bias = 'Neutral', valuationStatus = 'Unknown';
    let aiInsightText = 'Awaiting Upstox ratio data to compare company vs sector valuation.';

    if (blendedPremium !== null) {
        if (blendedPremium < -25)       { score = 95; bias = 'Strong Bullish'; valuationStatus = 'Deep Discount'; }
        else if (blendedPremium < -10)  { score = 80; bias = 'Bullish';        valuationStatus = 'Discount to Sector'; }
        else if (blendedPremium < 0)    { score = 65; bias = 'Bullish';        valuationStatus = 'Slight Discount'; }
        else if (blendedPremium < 10)   { score = 55; bias = 'Neutral';        valuationStatus = 'In-Line with Sector'; }
        else if (blendedPremium < 25)   { score = 38; bias = 'Bearish';        valuationStatus = 'Premium to Sector'; }
        else if (blendedPremium < 50)   { score = 22; bias = 'Bearish';        valuationStatus = 'Significant Premium'; }
        else                             { score = 10; bias = 'Strong Bearish'; valuationStatus = 'Extreme Premium'; }

        const absP = Math.abs(blendedPremium).toFixed(1);
        aiInsightText = blendedPremium < 0
            ? `Company trades at a ${absP}% discount to its sector peers across blended multiples — a potential value opportunity.`
            : `Company trades at a ${absP}% premium to its sector peers — priced for perfection, with limited margin of safety.`;

        if (pe.company !== null && pe.sector !== null) {
            aiInsightText += ` Sector P/E: ${pe.sector.toFixed(1)}x vs Company P/E: ${pe.company.toFixed(1)}x.`;
        }
    }

    const cCard = computeCardConfidence({
        hasLiveData: hasData,
        isManual: false,
        sourcePipeline: hasData ? 'Upstox API' : 'Manual',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(hasData) : (lastUpdated || '--:--')
    }, 'fundamentals');

    const configData = getIndicatorConfig(CARD_REGISTRY.relative_valuation.id) || { creditScore: 8, impactWeight: 7.0, aiModel: 'Engine v3' };

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Relative Valuation',
                category: 'Valuation',
                mode: hasData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore || 8,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(hasData) : (lastUpdated || '--:--'),
                source: hasData ? 'Upstox Key Ratios' : 'No Data',
                aiModel: configData?.aiModel || 'Engine v3'
            }}
            data={{
                currentValueObj: {
                    label: 'vs Sector Avg',
                    value: blendedPremium !== null
                        ? `${blendedPremium >= 0 ? '+' : ''}${blendedPremium.toFixed(1)}%`
                        : '--'
                },
                details: [
                    { label: 'Valuation Status', value: valuationStatus, isManual: false },
                    pe.company   !== null && { label: 'P/E',      value: `${pe.company.toFixed(1)}x${pe.sector !== null ? ` (Sector: ${pe.sector.toFixed(1)}x)` : ''}`,     isManual: false },
                    pb.company   !== null && { label: 'P/B',      value: `${pb.company.toFixed(2)}x${pb.sector !== null ? ` (Sector: ${pb.sector.toFixed(2)}x)` : ''}`,     isManual: false },
                    eveb.company !== null && { label: 'EV/EBITDA',value: `${eveb.company.toFixed(1)}x${eveb.sector !== null ? ` (Sector: ${eveb.sector.toFixed(1)}x)` : ''}`, isManual: false },
                ].filter(Boolean),
                score: score ?? null,
                bias: bias || 'Neutral',
                confidence: `${cCard}%`,
                impactWeight: configData?.impactWeight || 7.0
            }}
            chartData={{ points: [], valueKey: 'value', valueName: 'Premium/Discount %' }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'A company trading at a discount to sector peers is the classic "margin of safety" concept (Benjamin Graham).',
                    'Sector-relative P/E, P/B, and EV/EBITDA together form a composite relative valuation score.',
                    'Premium to sector is only justified if growth rate (PEG) is also superior to peers.',
                    'Extreme premium (>50% above sector) historically precedes mean reversion and multiple compression.',
                    'This card uses live Upstox sector_value fields — no manual entry required.'
                ]
            }}
        />
    );
}
