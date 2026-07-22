import { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { 
    computeCompanyComposite, 
    computeIndexComposite, 
    INDEX_CARD_TO_SECTION_MAP,
    COMPANY_CARD_TO_SECTION_MAP,
    ID_TO_TITLE
} from './FundamentalCompositeEngine';

import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

/**
 * Hook to manage the Fundamental Composite state based on card snapshots.
 * @param {string} instrumentType - 'Companies' or 'Indices'
 * @param {string} instrumentKey - The unique key of the selected instrument
 */
export function useFundamentalComposite(instrumentType, instrumentKey) {
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

    useEffect(() => {
        // Compute function wraps the correct mode
        const recompute = () => {
            const isIndex = instrumentType === 'Indices';
            const newRes = isIndex 
                ? computeIndexComposite(scoresRef.current)
                : computeCompanyComposite(scoresRef.current);
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
        };

        const handleSnapshot = (e) => {
            if (!e.detail) return;
            const { card_id, score } = e.detail;
            
            // card_id is now exactly the metric ID (e.g., 'crude', 'nifty_pe') because IndicatorCard sends resolvedCardId
            const metricId = card_id;
            
            if (metricId) {
                if (score === undefined || score === null || score === '--' || score === '') {
                    // Remove from composite engine if value was deleted
                    if (scoresRef.current[metricId] !== undefined) {
                        delete scoresRef.current[metricId];
                        recompute();
                    }
                } else {
                    // Update score map and trigger recomputation
                    if (scoresRef.current[metricId] !== score) {
                        scoresRef.current[metricId] = score;
                        recompute();
                    }
                }
            }
        };

        window.addEventListener('ai-snapshot', handleSnapshot);
        
        // Recompute on mount / category change to clear or refresh
        recompute();

        return () => window.removeEventListener('ai-snapshot', handleSnapshot);
    }, [instrumentType]);

    // Automatically clear scores when instrument changes to avoid stale composite
    useEffect(() => {
        if (prevInstrumentRef.current !== instrumentKey) {
            prevInstrumentRef.current = instrumentKey;
            scoresRef.current = {};
            const isIndex = instrumentType === 'Indices';
            const newRes = isIndex 
                ? computeIndexComposite({})
                : computeCompanyComposite({});
            setResult(newRes);
        }
    }, [instrumentKey, instrumentType]);

    const resetScores = () => {
        scoresRef.current = {};
        const isIndex = instrumentType === 'Indices';
        const newRes = isIndex 
            ? computeIndexComposite(scoresRef.current)
            : computeCompanyComposite(scoresRef.current);
        setResult(newRes);
    };

    return { ...result, resetScores };
}
