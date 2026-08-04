import { useState, useEffect, useCallback } from 'react';

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
                if (parsed && parsed[instrument]) return parsed[instrument]; // This should now be an object: { key: timestamp }
            } catch (e) { console.error(`Error parsing ${timeStorageKey}`, e); }
        }
        return {};
    };

    const getExpiryConfigs = () => {
        const defaults = { 
            face_value: 30 * 24 * 60 * 60 * 1000, 
            global_default: 2 * 60 * 60 * 1000,
            mcap_gdp: 30 * 24 * 60 * 60 * 1000,
            eps_yoy: 30 * 24 * 60 * 60 * 1000,
            forward_eps: 7 * 24 * 60 * 60 * 1000,
            profit_margin: 30 * 24 * 60 * 60 * 1000,
            policy_tailwinds: 30 * 24 * 60 * 60 * 1000,
            fii_trend: 24 * 60 * 60 * 1000,
            mf_flows: 30 * 24 * 60 * 60 * 1000,
            system_liquidity: 24 * 60 * 60 * 1000,
            // Technical Module Overrides
            mcclellan: 24 * 60 * 60 * 1000,
            trin: 24 * 60 * 60 * 1000,
            kc: 24 * 60 * 60 * 1000,
            cmf: 24 * 60 * 60 * 1000,
            support: 24 * 60 * 60 * 1000,
            resistance: 24 * 60 * 60 * 1000,
            trendline: 24 * 60 * 60 * 1000,
            fibonacci: 24 * 60 * 60 * 1000,
            pivot: 24 * 60 * 60 * 1000,
            // Options Module Overrides
            iv_rank: 24 * 60 * 60 * 1000,
            iv_percentile: 24 * 60 * 60 * 1000,
            iv_lookback: 24 * 60 * 60 * 1000,
            atm_iv: 24 * 60 * 60 * 1000,
            total_call_oi: 24 * 60 * 60 * 1000,
            total_put_oi: 24 * 60 * 60 * 1000,
            oi_change: 24 * 60 * 60 * 1000,
            pcr_oi: 24 * 60 * 60 * 1000,
            pcr_volume: 24 * 60 * 60 * 1000,
            max_pain: 24 * 60 * 60 * 1000,
            delta: 24 * 60 * 60 * 1000,
            gamma: 24 * 60 * 60 * 1000,
            theta: 24 * 60 * 60 * 1000,
            vega: 24 * 60 * 60 * 1000
        };
        try {
            const stored = localStorage.getItem('praxis_manual_expiry_config');
            if (stored) return { ...defaults, ...JSON.parse(stored) };
        } catch (e) { }
        return defaults;
    };

    const [overrides, setOverrides] = useState(getInitialOverrides);
    const [lastUpdated, setLastUpdated] = useState(getInitialLastUpdated);
    const [expiryConfigs, setExpiryConfigs] = useState(getExpiryConfigs);

    // Re-initialize state when instrument changes
    useEffect(() => {
        setOverrides(getInitialOverrides());
        setLastUpdated(getInitialLastUpdated());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instrument]);

    // Listen for storage events (e.g. from global OverrideUpdateModal)
    useEffect(() => {
        const handleStorage = (e) => {
            // A custom event triggers this with e = Event, which doesn't have e.key
            if (!e.key || e.key === storageKey || e.key === timeStorageKey) {
                setOverrides(getInitialOverrides());
                setLastUpdated(getInitialLastUpdated());
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instrument, storageKey, timeStorageKey]);

    const handleChange = useCallback((key, val) => {
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

        const timeVal = Date.now();
        setLastUpdated(prev => {
            const next = { ...prev, [key]: timeVal };
            const storedTime = localStorage.getItem(timeStorageKey);
            let allTimes = {};
            if (storedTime) {
                try { allTimes = JSON.parse(storedTime); } catch(e) {}
            }
            allTimes[instrument] = next;
            localStorage.setItem(timeStorageKey, JSON.stringify(allTimes));
            return next;
        });
    }, [instrument, storageKey, timeStorageKey]);

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
        
        setLastUpdated({});
        
        const storedTime = localStorage.getItem(timeStorageKey);
        let allTimes = {};
        if (storedTime) {
            try { allTimes = JSON.parse(storedTime); } catch(e) {}
        }
        allTimes[instrument] = {};
        localStorage.setItem(timeStorageKey, JSON.stringify(allTimes));
    };

    return {
        overrides,
        lastUpdated,
        expiryConfigs,
        handleChange,
        handleClearAll
    };
}
