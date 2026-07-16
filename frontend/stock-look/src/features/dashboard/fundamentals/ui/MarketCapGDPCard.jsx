import React from 'react';
import { cleanNum } from '@/lib/utils';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { formatPercentage } from '@/shared/utils/formatters';

export default function MarketCapGDPCard({ data = null, manualOverride, lastUpdated }) {
    // ── Company market cap: must be manual because Upstox /profile only gives SECTOR cap ──
    let marketCap = null;
    if (data?.manualMarketCap !== undefined && data.manualMarketCap !== null && data.manualMarketCap !== '') {
        marketCap = cleanNum(data.manualMarketCap);
    }

    // ── Sector data from Upstox /profile (informational context, NOT used in ratio) ──
    const sectorName   = data?.company_profile?.sector || null;
    const sectorCapFmt = data?.company_profile?.sector_market_cap_inr?.formatted || null;
    const hasSectorData = sectorName !== null && sectorCapFmt !== null;

    // ── manualOverride = Total GDP in Crores ──
    const manualGDP = manualOverride ? cleanNum(manualOverride) : null;

    let currentRatio = null;
    let isLiveData   = false;

    if (marketCap !== null && !isNaN(marketCap) && marketCap > 0 &&
        manualGDP  !== null && !isNaN(manualGDP)  && manualGDP  > 0) {
        currentRatio = (marketCap / manualGDP) * 100;
        isLiveData = true;
    }

    const configData = getIndicatorConfig('market_cap_gdp');

    let score = 0, bias = 'Neutral', valuationZone = 'Unknown';
    let aiInsightText = 'Enter company Market Cap and Total GDP in the info panel to calculate the Buffett Indicator.';

    if (currentRatio !== null && !isNaN(currentRatio)) {
        if (currentRatio < 80) {
            score = 95; bias = 'Strong Bullish'; valuationZone = 'Undervalued';
            aiInsightText = `At ${currentRatio.toFixed(1)}%, the market appears attractively valued relative to the economy.`;
        } else if (currentRatio < 100) {
            score = 82; bias = 'Bullish'; valuationZone = 'Fairly Valued';
            aiInsightText = `At ${currentRatio.toFixed(1)}%, market valuation remains broadly aligned with economic output.`;
        } else if (currentRatio <= 120) {
            score = 60; bias = 'Neutral'; valuationZone = 'Fully Valued';
            aiInsightText = `At ${currentRatio.toFixed(1)}%, the market is fully valued compared to historical norms.`;
        } else if (currentRatio <= 150) {
            score = 30; bias = 'Bearish'; valuationZone = 'Overvalued';
            aiInsightText = `At ${currentRatio.toFixed(1)}%, market valuations are elevated compared to the size of the economy.`;
        } else {
            score = 10; bias = 'Strong Bearish'; valuationZone = 'Significantly Overvalued';
            aiInsightText = `At ${currentRatio.toFixed(1)}%, the market appears historically expensive with elevated valuation risk.`;
        }
        if (hasSectorData) {
            aiInsightText += ` (${sectorName} sector total cap: ${sectorCapFmt} — sourced live from Upstox.)`;
        }
    }

    const confidence = currentRatio !== null
        ? (currentRatio < 80 || currentRatio > 150 ? '92%' : (currentRatio < 100 || currentRatio > 130 ? '82%' : '72%'))
        : '0%';

    return (
        <IndicatorCard
            config={{
                title: 'Market Cap to GDP',
                category: 'Market Health',
                mode: 'MANUAL', // The core ratio relies on manual inputs
                creditScore: configData?.creditScore || 5,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(false) : (lastUpdated || '--:--'),
                source: 'Manual Override',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Market Cap / GDP', value: currentRatio !== null && !isNaN(currentRatio) ? formatPercentage(currentRatio) : '--' },
                details: [
                    marketCap !== null && !isNaN(marketCap) && { label: 'Company Mkt Cap', value: `${cleanNum(marketCap).toLocaleString()} Cr`, isManual: true },
                    manualGDP !== null && !isNaN(manualGDP) && { label: 'Total GDP', value: `${cleanNum(manualGDP).toLocaleString()} Cr`, isManual: true },
                    currentRatio !== null && !isNaN(currentRatio) && { label: 'Valuation Zone', value: valuationZone, isManual: false },
                    hasSectorData && { label: `${sectorName} Sector Cap`, value: sectorCapFmt, isManual: false },
                ].filter(Boolean),
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence,
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Ratio (%)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'The Buffett Indicator: Total Market Cap / GDP. Readings above 120% historically signal overvaluation.',
                    'Upstox /profile gives only the SECTOR market cap (all companies in the sector combined), not a single company cap.',
                    'Enter the individual stock\'s current market cap in the info panel (in Cr ₹) for the ratio to compute.',
                    'India\'s total GDP is ~₹3,000 Lakh Cr — enter as 30000000 in the GDP field.',
                    'The sector cap shown is live context from Upstox — useful for gauging sectoral dominance.'
                ]
            }}
        />
    );
}
