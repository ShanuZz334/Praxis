import { useEffect, useRef, useMemo } from 'react';

/**
 * Tracks the exact timestamp when specific data fields change their mathematical value.
 * Prevents the UI clock from ticking forward on API polling if the data hasn't shifted.
 */
export function useDataFreshness(liveData, manualOverrides, manualOverrideTimes, isMarketOpen, formatTime) {
    const lastValuesRef = useRef({});
    const lastChangedTimesRef = useRef({});

    useEffect(() => {
        if (!liveData) return;
        
        // Prefer the backend's true updated_at timestamp, fallback to Date.now()
        const calcTime = liveData.calculated_at || liveData.updated_at || Date.now();
        let anyChanged = false;
        
        Object.keys(liveData).forEach(key => {
            if (key === 'calculated_at' || key === 'updated_at') return;
            
            // Deep JSON stringify comparison
            const prevValString = JSON.stringify(lastValuesRef.current[key]);
            const newValString = JSON.stringify(liveData[key]);
            
            if (prevValString !== newValString) {
                const specificTime = liveData[`${key}_updated_at`];
                const finalTime = specificTime ? new Date(specificTime).getTime() : calcTime;
                
                lastValuesRef.current[key] = liveData[key];
                lastChangedTimesRef.current[key] = finalTime;
                anyChanged = true;
            }
        });
        
        if (anyChanged) {
            lastChangedTimesRef.current['__global__'] = calcTime;
        }
    }, [liveData]);

    const resolveTime = useMemo(() => (hasData, overrideKey) => {
        const isManual = overrideKey && manualOverrides[overrideKey] !== undefined && manualOverrides[overrideKey] !== null;
        if (isManual) {
            const manualTs = manualOverrideTimes[overrideKey];
            if (manualTs) return formatTime(manualTs);
        }

        if (!hasData) return null;

        const targetKey = overrideKey || '__global__';
        const changedTs = lastChangedTimesRef.current[targetKey];

        if (changedTs) {
            console.log(`[Freshness Debug] ${targetKey} returned changedTs: ${changedTs}`);
            return formatTime(changedTs);
        }

        if (isMarketOpen()) return "Live";
        if (liveData && (liveData.calculated_at || liveData.updated_at)) {
            console.log(`[Freshness Debug] ${targetKey} returned fallback calculated_at: ${liveData.calculated_at}`);
            return formatTime(liveData.calculated_at || liveData.updated_at);
        }
        return "3:30 PM";
    }, [liveData, manualOverrides, manualOverrideTimes, isMarketOpen, formatTime]);

    return resolveTime;
}
