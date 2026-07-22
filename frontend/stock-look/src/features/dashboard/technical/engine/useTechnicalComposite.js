import { useMemo, useEffect, useRef, useState } from 'react';
import { 
    computeTechnicalComposite, 
    generateAiInsightTechnical, 
    TECHNICAL_CARD_MAP,
    ID_TO_TITLE 
} from './TechnicalCompositeEngine';
import { getIndicatorColor } from '@/shared/config/scoreColors';

export function useTechnicalComposite(isIndex = false) {
    const scoresRef = useRef({});
    const [compositeData, setCompositeData] = useState({
        compositeScore: 50,
        regime: { label: 'Unknown', color: 'text-slate-400' },
        sections: [],
        rawSections: {},
        cardScores: {}
    });

    const recompute = () => {
        const engineResult = computeTechnicalComposite(scoresRef.current, isIndex);
        setCompositeData(engineResult);
    };

    useEffect(() => {
        const handleSnapshot = (e) => {
            if (!e.detail) return;
            const { card_id, score } = e.detail;
            
            const metricId = card_id;
            
            if (metricId) {
                if (score === undefined || score === null || score === '--' || score === '') {
                    if (scoresRef.current[metricId] !== undefined) {
                        delete scoresRef.current[metricId];
                        recompute();
                    }
                } else {
                    if (scoresRef.current[metricId] !== score) {
                        scoresRef.current[metricId] = score;
                        recompute();
                    }
                }
            }
        };

        window.addEventListener('ai-snapshot', handleSnapshot);
        return () => window.removeEventListener('ai-snapshot', handleSnapshot);
    }, [isIndex]);

    return useMemo(() => {
        const engineResult = compositeData;
        const sections = engineResult.sections || [];

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

        const aiInsight = generateAiInsightTechnical(
            engineResult.compositeScore,
            engineResult.rawSections,
            isIndex
        );

        const result = {
            ...engineResult,
            tailwinds,
            risks,
            aiInsight,
            nestedTreePayload: engineResult.nestedTreePayload
        };

        return result;
    }, [compositeData, isIndex]);
}
