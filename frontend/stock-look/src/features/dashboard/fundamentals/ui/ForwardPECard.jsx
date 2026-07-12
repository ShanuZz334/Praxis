import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { generateAiInsightForwardPECard, scoreForwardPE } from '@/features/dashboard/fundamentals/engine/scoringEngine';
// ─── Main Component ─────────────────────────────────────────────────────────
export default function ForwardPECard({ data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig('forward_pe');

    // ── Step 1: Resolve currentFwdPE (Live from Upstox or manual fallback) ────
    const ratiosArray = Array.isArray(data?.ratios) ? data.ratios : [];
    const upstoxFwdPEObj = ratiosArray.find(r => 
        r.name?.toLowerCase().includes("forward p/e") || 
        r.name?.toLowerCase().includes("forward pe") ||
        r.name?.toLowerCase().includes("fwd pe")
    );
    const parsedFwdPE = upstoxFwdPEObj?.company_value ? parseFloat(upstoxFwdPEObj.company_value) : null;
    
    const isLiveData = parsedFwdPE !== null && !isNaN(parsedFwdPE) && parsedFwdPE > 0;
    const currentFwdPE = isLiveData ? parsedFwdPE : (manualOverride ?? null);

    // ── Step 2: Resolve Trailing PE for comparison (Live) ─────────────────────
    const upstoxPEObj = ratiosArray.find(r =>
        r.name === 'P/E' ||
        r.name === 'PE' ||
        r.name?.toLowerCase() === 'p/e ratio' ||
        r.name?.toLowerCase().includes('price to earnings')
    );
    const parsedPE = upstoxPEObj?.company_value ? parseFloat(upstoxPEObj.company_value) : null;
    const currentPE = (parsedPE !== null && !isNaN(parsedPE)) ? parsedPE : null;

    // Removed Projected EPS to comply with Zero Clutter Rule

    // ── Step 4: Run Engine ────────────────────────────────────────────────────
    const { score, bias, confidence } = scoreForwardPE(currentFwdPE, currentPE);

    // ── Step 5: Dynamic AI Insight ────────────────────────────────────────────
    const aiInsight = generateAiInsightForwardPECard(currentFwdPE, currentPE, bias);

    // ── Step 6: Display Value Formatting ──────────────────────────────────────
    const displayFwdPE = currentFwdPE !== null && !isNaN(currentFwdPE)
        ? parseFloat(currentFwdPE).toFixed(2)
        : '--';

    return (
        <IndicatorCard
            config={{
                title: 'Forward P/E',
                category: 'Valuation',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore ?? 5,
                updateTime: lastUpdated ?? '--:--',
                source: isLiveData ? 'Upstox' : 'Manual',
                aiModel: configData?.aiModel ?? 'Engine v2'
            }}
            data={{
                currentValueObj: { 
                    label: 'Current Fwd PE', 
                    value: displayFwdPE 
                },
                details: [
                    currentPE !== null && { 
                        label: 'Trailing P/E (Live)', 
                        value: parseFloat(currentPE).toFixed(2), 
                        isManual: false 
                    }
                ].filter(Boolean),
                score,
                bias,
                confidence: `${confidence}%`,
                impactWeight: configData?.impactWeight ?? 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Forward P/E'
            }}
            insights={{
                aiInsight,
                whyItMatters: [
                    'Forecasts valuation based on expected future earnings, providing a forward-looking perspective.',
                    'A Forward P/E lower than Trailing P/E indicates expected earnings growth.',
                    'Helps identify if current market prices accurately reflect fundamental growth prospects.',
                    'Crucial for comparing high-growth companies against value stocks.'
                ]
            }}
        />
    );
}
