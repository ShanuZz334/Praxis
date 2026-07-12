import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { formatCompactCurrency } from '@/shared/utils/formatters';

function scoreInstitutionalFlow(fiiFlow, diiFlow) {
    if (fiiFlow === null || isNaN(fiiFlow) || diiFlow === null || isNaN(diiFlow)) {
        return { score: 50, bias: 'Neutral', confidence: '0%', netFlow: null };
    }

    const netFlow = fiiFlow + diiFlow;
    let score = 50;

    if (fiiFlow > 0 && diiFlow > 0) {
        // Both buying: Strong Bullish
        score = 95;
    } else if (fiiFlow < 0 && diiFlow < 0) {
        // Both selling: Strong Bearish
        score = 10;
    } else if (netFlow > 0) {
        // One is selling, but net is positive (usually DII absorbing FII)
        score = fiiFlow > 0 ? 80 : 70; // Slightly better if FII is leading the buying
    } else {
        // One is buying, but net is negative
        score = fiiFlow < 0 ? 30 : 40; // Slightly worse if FII is leading the selling
    }

    let bias = "Neutral";
    if (score >= 80) bias = "Strong Bullish";
    else if (score >= 60) bias = "Bullish";
    else if (score <= 20) bias = "Strong Bearish";
    else if (score <= 40) bias = "Bearish";

    return { score, bias, confidence: '95%', netFlow };
}

function generateAiInsight(fiiFlow, diiFlow, netFlow) {
    if (fiiFlow === null || diiFlow === null) {
        return "Awaiting manual entry of FII and DII Flow (₹ Cr).";
    }

    if (fiiFlow > 0 && diiFlow > 0) {
        return `Exceptional institutional support. Both Foreign (FII) and Domestic (DII) investors are aggressively accumulating, injecting a net ₹${netFlow} Cr into the market.`;
    } else if (fiiFlow < 0 && diiFlow < 0) {
        return `Severe institutional distribution. Both FIIs and DIIs are offloading positions simultaneously, draining a net ₹${Math.abs(netFlow)} Cr from the market.`;
    } else if (fiiFlow < 0 && diiFlow > 0) {
        if (netFlow > 0) {
            return `Domestic resilience. DIIs (₹${diiFlow} Cr) are successfully absorbing the FII selling pressure (₹${fiiFlow} Cr), resulting in positive net liquidity of ₹${netFlow} Cr.`;
        } else {
            return `FII distribution is overpowering domestic support. Despite DII buying, massive FII selling (₹${fiiFlow} Cr) has dragged net liquidity into the red (₹${netFlow} Cr).`;
        }
    } else if (fiiFlow > 0 && diiFlow < 0) {
        if (netFlow > 0) {
            return `Foreign capital is driving the market higher (₹${fiiFlow} Cr), easily absorbing the profit-booking by Domestic institutions (₹${diiFlow} Cr).`;
        } else {
            return `Domestic institutions are booking heavy profits (₹${diiFlow} Cr), entirely neutralizing the foreign capital inflows and turning net liquidity negative.`;
        }
    }
    
    return "Institutional flows are perfectly balanced, resulting in flat net liquidity.";
}

export default function FIIDIIFlowCard({ data = null, manualOverride, lastUpdated }) {
    // Institutional flows are macro indicators not provided in single-stock Upstox APIs.
    const isManual = true;

    // Core Value States
    const fiiFlow = manualOverride !== undefined && manualOverride !== null && manualOverride !== '' 
        ? parseFloat(manualOverride) : null;
    const diiFlow = data?.manualDiiFlow !== undefined && data?.manualDiiFlow !== null && data?.manualDiiFlow !== ''
        ? parseFloat(data.manualDiiFlow) : null;

    // Centralized Config
    const configData = getIndicatorConfig('fii_dii_flow');

    // --- Scoring Engine ---
    const { score, bias, confidence, netFlow } = scoreInstitutionalFlow(fiiFlow, diiFlow);
    const aiInsightText = generateAiInsight(fiiFlow, diiFlow, netFlow);

        return (
        <IndicatorCard
            config={{
                title: 'FII / DII Flow',
                category: 'Market Health',
                mode: 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: 'Manual Override',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'Net Flow', value: netFlow !== null && !isNaN(netFlow) ? formatCompactCurrency(netFlow * 10000000) : '--' },
                details: [
                    fiiFlow !== null && !isNaN(fiiFlow) && { label: 'FII Flow', value: formatCompactCurrency(fiiFlow * 10000000), isManual: true },
                    diiFlow !== null && !isNaN(diiFlow) && { label: 'DII Flow', value: formatCompactCurrency(diiFlow * 10000000), isManual: true }
                ].filter(Boolean),
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Flow (₹ Cr)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Tracks institutional money movement.',
                    'Strong indicator of market sentiment.',
                    'Often drives short-term market trends.'
                ]
            }}
        />
    );
}
