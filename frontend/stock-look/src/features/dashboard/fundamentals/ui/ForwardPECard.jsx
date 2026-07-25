import React from 'react';

import { cleanNum } from '@/lib/utils';import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { computeCardConfidence } from '@/shared/engine/confidenceEngine';
import { generateAiInsightForwardPECard, scoreForwardPE } from '@/features/dashboard/fundamentals/engine/scoringEngine';
// ─── Main Component ─────────────────────────────────────────────────────────
export default function ForwardPECard({ cardId, data = null, manualOverride, lastUpdated }) {
    const configData = getIndicatorConfig(CARD_REGISTRY.forward_pe.id);

    // ── Step 1: Resolve Trailing PE for comparison (Live) ─────────────────────
    const ratiosArray = Array.isArray(data?.ratios) ? data.ratios : [];
    const upstoxPEObj = ratiosArray.find(r =>
        r.name === 'P/E' ||
        r.name === 'PE' ||
        r.name?.toLowerCase() === 'p/e ratio' ||
        r.name?.toLowerCase().includes('price to earnings')
    );
    const parsedPE = upstoxPEObj?.company_value ? cleanNum(upstoxPEObj.company_value) : null;
    const currentPE = (parsedPE !== null && !isNaN(parsedPE)) ? parsedPE : null;

    // ── Step 2: Resolve currentFwdPE (Live from Upstox, Auto-calculated, or manual fallback) ────
    const upstoxFwdPEObj = ratiosArray.find(r => 
        r.name?.toLowerCase().includes("forward p/e") || 
        r.name?.toLowerCase().includes("forward pe") ||
        r.name?.toLowerCase().includes("fwd pe")
    );
    const parsedFwdPE = upstoxFwdPEObj?.company_value ? cleanNum(upstoxFwdPEObj.company_value) : null;
    
    let calculatedFwdPE = null;
    if (parsedFwdPE === null && currentPE !== null) {
        let epsGrowth = null;
        
        // Try to get EPS Growth from Upstox ratios
        const ratioEPS = ratiosArray.find(r => r.name?.toLowerCase().includes('eps growth') || r.name?.toLowerCase() === 'eps growth');
        if (ratioEPS?.company_value) {
            const parsedGrowth = cleanNum(ratioEPS.company_value);
            if (!isNaN(parsedGrowth)) epsGrowth = parsedGrowth;
        }
        
        // Try to calculate from income statement history
        if (epsGrowth === null) {
            const incomeArray = Array.isArray(data?.income) ? data.income : (Array.isArray(data?.income?.full_statement) ? data.income.full_statement : []);
            const epsObj = incomeArray.find(r => r.particular === 'EPS - Basic' || r.particular === 'EPS - Diluted' || r.particular?.toLowerCase().includes('eps'));
            if (epsObj && Array.isArray(epsObj.history) && epsObj.history.length >= 2) {
                const chronological = [...epsObj.history].reverse();
                const totalPeriods = chronological.length - 1;
                const first = chronological[0].value;
                const last = chronological[chronological.length - 1].value;
                if (first > 0 && last > 0) {
                    epsGrowth = (Math.pow(last / first, 1 / totalPeriods) - 1) * 100;
                }
            }
        }

        if (epsGrowth !== null && epsGrowth !== 0) {
            calculatedFwdPE = currentPE / (1 + (epsGrowth / 100));
            if (calculatedFwdPE < 0) calculatedFwdPE = null; // Don't show negative P/E
        }
    }

    const isLiveData = (parsedFwdPE !== null && !isNaN(parsedFwdPE) && parsedFwdPE > 0) || (calculatedFwdPE !== null && !isNaN(calculatedFwdPE) && calculatedFwdPE > 0);
    const currentFwdPE = (parsedFwdPE !== null && parsedFwdPE > 0) 
        ? parsedFwdPE 
        : ((calculatedFwdPE !== null && calculatedFwdPE > 0) ? calculatedFwdPE : (manualOverride ?? null));

    // Removed Projected EPS to comply with Zero Clutter Rule

    // ── Step 4: Run Engine ────────────────────────────────────────────────────
    const { score, bias } = scoreForwardPE(currentFwdPE, currentPE);
    const cCard = computeCardConfidence({
        hasLiveData: isLiveData,
        isManual: !!manualOverride && !isLiveData,
        sourcePipeline: isLiveData ? (parsedFwdPE !== null ? 'Upstox API' : 'Upstox (Calc)') : 'Manual',
        lastUpdated: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--')
    }, 'fundamentals');

    // ── Step 5: Dynamic AI Insight ────────────────────────────────────────────
    const aiInsight = generateAiInsightForwardPECard(currentFwdPE, currentPE, bias);

    // ── Step 6: Display Value Formatting ──────────────────────────────────────
    const displayFwdPE = currentFwdPE !== null && !isNaN(currentFwdPE)
        ? cleanNum(currentFwdPE).toFixed(2)
        : '--';

    return (
        <IndicatorCard
            cardId={cardId}
            config={{
                title: 'Forward P/E',
                category: 'Valuation',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore ?? 5,
                updateTime: typeof lastUpdated === 'function' ? lastUpdated(isLiveData) : (lastUpdated || '--:--'),
                source: isLiveData ? (parsedFwdPE !== null ? 'Upstox API' : 'Upstox (Calc)') : 'Manual',
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
                        value: cleanNum(currentPE).toFixed(2), 
                        isManual: false 
                    }
                ].filter(Boolean),
                score,
                bias,
                confidence: `${cCard}%`,
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
