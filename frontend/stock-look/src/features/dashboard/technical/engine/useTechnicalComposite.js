import { useMemo, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/shared/context/ThemeContext';
import { 
    computeTechnicalComposite, 
    generateAiInsightTechnical, 
    TECHNICAL_CARD_MAP,
    ID_TO_TITLE 
} from './TechnicalCompositeEngine';
import { getIndicatorColor } from '@/shared/config/scoreColors';
import axiosInstance from '@/shared/utils/axiosInstance';

export function useTechnicalComposite(isIndex = false, instrumentKey = null) {
    const { tradingMode } = useTheme();
    const tradingModeRef = useRef(tradingMode);

    const scoresRef = useRef({});
    const [compositeData, setCompositeData] = useState({
        compositeScore: 50,
        regime: { label: 'Unknown', color: 'text-slate-400' },
        sections: [],
        rawSections: {},
        cardScores: {}
    });

    const debounceTimerRef = useRef(null);

    const scheduleRecompute = () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            tradingModeRef.current = tradingMode;
            const engineResult = computeTechnicalComposite(scoresRef.current, isIndex, tradingMode);
            setCompositeData(engineResult);

            // Persist to backend DB (fire & forget) — only when cards have sufficiently mounted
            const cardCount = Object.keys(scoresRef.current || {}).length;
            if (instrumentKey && engineResult.compositeScore != null && engineResult.compositeScore > 0 && cardCount >= 5) {
                axiosInstance.post('/api/v1/snapshots/header', {
                    instrument_key: instrumentKey,
                    category: 'technical',
                    composite_score: engineResult.compositeScore,
                    regime_json: engineResult.regime,
                    tailwinds_json: engineResult.tailwinds,
                    risks_json: engineResult.risks,
                    counts_json: engineResult.cardScores,
                    tree_payload_json: engineResult.nestedTreePayload
                }).catch(() => {});
            }
        }, 150);
    };

    useEffect(() => {
        const handleSnapshot = (e) => {
            if (!e.detail) return;
            const { card_id, score, instrumentKey: snapInstrument } = e.detail;
            
            if (snapInstrument && snapInstrument !== instrumentKey) {
                return;
            }

            const metricId = card_id;
            
            if (metricId) {
                if (score === undefined || score === null || score === '--' || score === '') {
                    if (scoresRef.current[metricId] !== undefined) {
                        delete scoresRef.current[metricId];
                        scheduleRecompute();
                    }
                } else {
                    if (scoresRef.current[metricId] !== score) {
                        scoresRef.current[metricId] = score;
                        scheduleRecompute();
                    }
                }
            }
        };

        window.addEventListener('ai-snapshot', handleSnapshot);
        
        // Recompute immediately when tradingMode changes
        scheduleRecompute();

        return () => window.removeEventListener('ai-snapshot', handleSnapshot);
    }, [isIndex, instrumentKey, tradingMode]);

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
            isIndex,
            tradingMode
        );

        const result = {
            ...engineResult,
            tailwinds,
            risks,
            aiInsight,
            nestedTreePayload: engineResult.nestedTreePayload
        };

        return result;
    }, [compositeData, isIndex, tradingMode]);
}
