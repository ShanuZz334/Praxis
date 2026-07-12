import { useState, useEffect } from 'react';

/**
 * Universal hook for managing manual dashboard overrides via LocalStorage.
 * @param {string} moduleKey - Unique key for the dashboard module (e.g., "fundamentals", "options").
 * @param {string} instrument - The currently selected instrument (e.g., "NIFTY", "RELIANCE").
 * @param {object} defaultOverrides - The base structure of all null overrides for this module.
 */
export function useManualOverrides(moduleKey, instrument, defaultOverrides) {
    const storageKey = `praxis_manual_overrides_${moduleKey}`;
    const timeStorageKey = `praxis_manual_last_updated_${moduleKey}`;

    const getInitialOverrides = () => {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed && parsed[instrument]) {
                    return { ...defaultOverrides, ...parsed[instrument] };
                }
            } catch (e) { console.error(`Error parsing ${storageKey}`, e); }
        }
        return { ...defaultOverrides };
    };

    const getInitialLastUpdated = () => {
        const stored = localStorage.getItem(timeStorageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed && parsed[instrument]) return parsed[instrument];
            } catch (e) { console.error(`Error parsing ${timeStorageKey}`, e); }
        }
        return '--:--';
    };

    const [overrides, setOverrides] = useState(getInitialOverrides);
    const [lastUpdated, setLastUpdated] = useState(getInitialLastUpdated);

    // Re-initialize state when instrument changes
    useEffect(() => {
        setOverrides(getInitialOverrides());
        setLastUpdated(getInitialLastUpdated());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instrument]);

    const handleChange = (key, val) => {
        setOverrides(prev => {
            const next = { ...prev, [key]: val };
            
            const stored = localStorage.getItem(storageKey);
            let allOverrides = {};
            if (stored) {
                try { allOverrides = JSON.parse(stored); } catch (e) {}
            }
            allOverrides[instrument] = next;
            localStorage.setItem(storageKey, JSON.stringify(allOverrides));
            
            return next;
        });

        const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        setLastUpdated(timeStr);
        
        const storedTime = localStorage.getItem(timeStorageKey);
        let allTimes = {};
        if (storedTime) {
            try { allTimes = JSON.parse(storedTime); } catch(e) {}
        }
        allTimes[instrument] = timeStr;
        localStorage.setItem(timeStorageKey, JSON.stringify(allTimes));
    };

    const handleClearAll = () => {
        const resetState = { ...defaultOverrides };
        
        const stored = localStorage.getItem(storageKey);
        let allOverrides = {};
        if (stored) {
            try { allOverrides = JSON.parse(stored); } catch (e) {}
        }
        allOverrides[instrument] = resetState;
        localStorage.setItem(storageKey, JSON.stringify(allOverrides));
        
        setOverrides(resetState);
        
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        setLastUpdated(timeStr);
        
        const storedTime = localStorage.getItem(timeStorageKey);
        let allTimes = {};
        if (storedTime) {
            try { allTimes = JSON.parse(storedTime); } catch(e) {}
        }
        allTimes[instrument] = timeStr;
        localStorage.setItem(timeStorageKey, JSON.stringify(allTimes));
    };

    return {
        overrides,
        lastUpdated,
        handleChange,
        handleClearAll
    };
}
