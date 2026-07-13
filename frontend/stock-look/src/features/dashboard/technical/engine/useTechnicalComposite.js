import { useMemo } from 'react';
import { computeTechnicalComposite, generateAiInsightTechnical } from './TechnicalCompositeEngine';
import { getIndicatorColor } from '@/shared/config/scoreColors';

/**
 * useTechnicalComposite
 * Custom hook to encapsulate Technicals scoring logic.
 *
 * Tailwinds & Risks: Derived from SECTIONS (not individual cards), using the
 * exact same institutional impact algorithm as FundamentalCompositeEngine.buildResult:
 *
 *   Impact = (score - 50) × weight
 *
 * This ensures the header rows show "Trend", "Momentum", "Volatility" etc.
 * with their weight and indicator-tier label — identical to Fundamentals.
 */
export function useTechnicalComposite(scoresData, isIndex = false) {
    return useMemo(() => {
        // 1) Run the scoring engine
        const engineResult = computeTechnicalComposite(scoresData, isIndex);
        const sections = engineResult.sections || [];

        // 2) Tailwinds: sections scoring >= 60, sorted by true impact (score - 50) × weight
        const tailwindImpact = (s) => (s.score - 50) * s.weight;
        const tailwinds = sections
            .filter(s => s.score !== null && s.score >= 60)
            .sort((a, b) => tailwindImpact(b) - tailwindImpact(a))
            .slice(0, 3)
            .map(s => ({
                id: s.id,
                label: s.label,
                value: s.score,
                sub: `${Math.round(s.weight * 100)}% weight · ${getIndicatorColor(s.score).label}`,
            }));

        // 3) Risks: sections scoring <= 40, sorted by true drag (50 - score) × weight
        const riskImpact = (s) => (50 - s.score) * s.weight;
        const risks = sections
            .filter(s => s.score !== null && s.score <= 40)
            .sort((a, b) => riskImpact(b) - riskImpact(a))
            .slice(0, 3)
            .map(s => ({
                id: s.id,
                label: s.label,
                value: s.score,
                sub: `${Math.round(s.weight * 100)}% weight · ${getIndicatorColor(s.score).label}`,
            }));

        // 4) AI Insight
        const aiInsight = generateAiInsightTechnical(
            engineResult.compositeScore,
            engineResult.rawSections,
            isIndex
        );

        return {
            ...engineResult,
            aiInsight,
            tailwinds,
            risks,
        };
    }, [scoresData, isIndex]);
}
