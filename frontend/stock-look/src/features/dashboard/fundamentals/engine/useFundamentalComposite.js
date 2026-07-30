import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../../shared/context/ThemeContext';
import axiosInstance from '../../../../shared/utils/axiosInstance';
import { 
    computeCompanyComposite, 
    computeIndexComposite, 
    INDEX_CARD_TO_SECTION_MAP,
    COMPANY_CARD_TO_SECTION_MAP,
    ID_TO_TITLE
} from './FundamentalCompositeEngine';

import { getIndicatorConfig } from '../../../../shared/config/indicatorConfig';

/**
 * Hook to manage the Fundamental Composite state based on card snapshots.
 * @param {string} instrumentType - 'Companies' or 'Indices'
 * @param {string} instrumentKey - The unique key of the selected instrument
 */
export function useFundamentalComposite(instrumentType, instrumentKey) {
    const { tradingMode } = useTheme();
    const tradingModeRef = useRef(tradingMode);
    const [result, setResult] = useState({
        sections: [],
        compositeScore: 0,
        regime: { label: 'Neutral', confidence: 0, color: 'text-slate-400' },
        tailwinds: [],
        risks: [],
        rawScores: {}
    });

    // We store the latest valid score for each indicator here
    const scoresRef = useRef({});
    const prevInstrumentRef = useRef(instrumentKey);

    const debounceTimerRef = useRef(null);

    useEffect(() => {
        // Compute function wraps the correct mode
        const scheduleRecompute = () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                tradingModeRef.current = tradingMode;
                const isIndex = instrumentType === 'Indices';
                const newRes = isIndex 
                    ? computeIndexComposite(scoresRef.current, tradingMode)
                    : computeCompanyComposite(scoresRef.current, tradingMode);
                setResult({ ...newRes, rawScores: { ...scoresRef.current } });

                // Persist header calculation to Backend (Fire & Forget)
                if (instrumentKey) {
                    axiosInstance.post('/api/v1/snapshots/header', {
                        instrument_key: instrumentKey,
                        category: 'fundamental',
                        composite_score: newRes.compositeScore,
                        regime_json: newRes.regime,
                        tailwinds_json: newRes.tailwinds,
                        risks_json: newRes.risks,
                        counts_json: newRes.cardScores,
                        breakdown: newRes.sections
                    }).catch(err => console.error("Failed to sync header:", err));
                }
            }, 50);
        };

        const handleSnapshot = (e) => {
            if (!e.detail) return;
            const { card_id, score, instrumentKey: snapInstrument } = e.detail;
            
            // Prevent cross-contamination from stale cards unmounting after an instrument change
            if (snapInstrument && snapInstrument !== instrumentKey) {
                return;
            }

            // card_id is now exactly the metric ID (e.g., 'crude', 'nifty_pe') because IndicatorCard sends resolvedCardId
            const metricId = card_id;
            
            if (metricId) {
                if (score === undefined || score === null || score === '--' || score === '') {
                    // Remove from composite engine if value was deleted
                    if (scoresRef.current[metricId] !== undefined) {
                        delete scoresRef.current[metricId];
                        scheduleRecompute();
                    }
                } else {
                    // Update score map and trigger recomputation
                    if (scoresRef.current[metricId] !== score) {
                        scoresRef.current[metricId] = score;
                        scheduleRecompute();
                    }
                }
            }
        };

        window.addEventListener('ai-snapshot', handleSnapshot);
        
        // Recompute on mount / category change to clear or refresh
        scheduleRecompute();

        return () => window.removeEventListener('ai-snapshot', handleSnapshot);
    }, [instrumentType, instrumentKey, tradingMode]);

    // Automatically clear scores when instrument changes to avoid stale composite
    useEffect(() => {
        if (prevInstrumentRef.current !== instrumentKey) {
            prevInstrumentRef.current = instrumentKey;
            scoresRef.current = {};
            const isIndex = instrumentType === 'Indices';
            const newRes = isIndex 
                ? computeIndexComposite({}, tradingMode)
                : computeCompanyComposite({}, tradingMode);
            setResult(newRes);
        }
    }, [instrumentKey, instrumentType]);

    const resetScores = () => {
        scoresRef.current = {};
        const isIndex = instrumentType === 'Indices';
        const newRes = isIndex 
            ? computeIndexComposite(scoresRef.current, tradingMode)
            : computeCompanyComposite(scoresRef.current, tradingMode);
        setResult(newRes);
    };

    return { ...result, resetScores };
}
