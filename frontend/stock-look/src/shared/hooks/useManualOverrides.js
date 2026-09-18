import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '/api/v1';

/**
 * Universal hook for managing manual dashboard overrides via SQLite (server-side).
 * Drop-in replacement for the old localStorage-based version.
 * External API is identical: { overrides, lastUpdated, expiryConfigs, handleChange, handleClearAll }
 *
 * @param {string} moduleKey - 'fundamentals', 'technical', 'options', 'foreign'
 * @param {string} instrument - Instrument key e.g. 'NSE_INDEX|Nifty 50'
 * @param {object} defaultOverrides - Base null-override structure for this module
 */
export function useManualOverrides(moduleKey, instrument, defaultOverrides) {
    const [overrides, setOverrides] = useState({ ...defaultOverrides });
    const [lastUpdated, setLastUpdated] = useState({});
    const debounceTimers = useRef({});

    const expiryConfigs = {
        face_value: 30 * 24 * 60 * 60 * 1000, global_default: 2 * 60 * 60 * 1000,
        mcap_gdp: 30 * 24 * 60 * 60 * 1000, eps_yoy: 30 * 24 * 60 * 60 * 1000,
        forward_eps: 7 * 24 * 60 * 60 * 1000, profit_margin: 30 * 24 * 60 * 60 * 1000,
        policy_tailwinds: 30 * 24 * 60 * 60 * 1000, fii_trend: 24 * 60 * 60 * 1000,
        mf_flows: 30 * 24 * 60 * 60 * 1000, system_liquidity: 24 * 60 * 60 * 1000,
        mcclellan: 24 * 60 * 60 * 1000, trin: 24 * 60 * 60 * 1000, kc: 24 * 60 * 60 * 1000,
        cmf: 24 * 60 * 60 * 1000, support: 24 * 60 * 60 * 1000, resistance: 24 * 60 * 60 * 1000,
        trendline: 24 * 60 * 60 * 1000, fibonacci: 24 * 60 * 60 * 1000, pivot: 24 * 60 * 60 * 1000,
        iv_rank: 24 * 60 * 60 * 1000, iv_percentile: 24 * 60 * 60 * 1000, iv_lookback: 24 * 60 * 60 * 1000,
        atm_iv: 24 * 60 * 60 * 1000, total_call_oi: 24 * 60 * 60 * 1000, total_put_oi: 24 * 60 * 60 * 1000,
        oi_change: 24 * 60 * 60 * 1000, pcr_oi: 24 * 60 * 60 * 1000, pcr_volume: 24 * 60 * 60 * 1000,
        max_pain: 24 * 60 * 60 * 1000, delta: 24 * 60 * 60 * 1000, gamma: 24 * 60 * 60 * 1000,
        theta: 24 * 60 * 60 * 1000, vega: 24 * 60 * 60 * 1000
    };

    // Load overrides from SQLite when module or instrument changes
    useEffect(() => {
        // Synchronously reset state on instrument/module change to prevent state bleed
        setOverrides({ ...defaultOverrides });
        setLastUpdated({});
        if (!moduleKey || !instrument) return;

        let isCancelled = false;
        const encodedKey = encodeURIComponent(instrument);
        fetch(`${API_BASE}/overrides/${moduleKey}/${encodedKey}`)
            .then(r => r.json())
            .then(res => {
                if (isCancelled) return;
                if (res.status === 'success' && res.data) {
                    const loaded = { ...defaultOverrides };
                    const times = {};
                    for (const [fieldKey, entry] of Object.entries(res.data)) {
                        loaded[fieldKey] = entry.value;
                        if (entry.updated_at) {
                            const raw = String(entry.updated_at);
                            const isoString = (raw.endsWith('Z') || raw.includes('+')) ? raw : raw.replace(' ', 'T') + 'Z';
                            times[fieldKey] = new Date(isoString).getTime();
                        } else {
                            times[fieldKey] = Date.now();
                        }
                    }
                    setOverrides(loaded);
                    setLastUpdated(times);
                }
            })
            .catch(e => console.warn('[useManualOverrides] Failed to load from SQLite:', e.message));

        return () => { isCancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moduleKey, instrument]);

    // Listen for custom override update event (from OverrideUpdateModal)
    useEffect(() => {
        const handleOverrideEvent = (e) => {
            const detail = e?.detail;
            if (!detail) return;
            const targetMod = (detail.moduleKey === 'v2' || detail.moduleKey === 'fundamental') ? 'fundamentals' : detail.moduleKey;
            const currentMod = (moduleKey === 'v2' || moduleKey === 'fundamental') ? 'fundamentals' : moduleKey;

            if (targetMod === currentMod && detail.instrument === instrument) {
                const field = detail.field || detail.overrideKey || detail.fieldKey;
                if (field) {
                    setOverrides(prev => ({ ...prev, [field]: detail.value }));
                    setLastUpdated(prev => ({ ...prev, [field]: Date.now() }));
                }
            }
        };
        window.addEventListener('praxis:override-updated', handleOverrideEvent);
        return () => window.removeEventListener('praxis:override-updated', handleOverrideEvent);
    }, [moduleKey, instrument]);

    const handleChange = useCallback((key, val) => {
        const timeVal = Date.now();
        setOverrides(prev => ({ ...prev, [key]: val }));
        setLastUpdated(prev => ({ ...prev, [key]: timeVal }));

        // Debounce the API write 400ms after last keystroke
        if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
        debounceTimers.current[key] = setTimeout(() => {
            fetch(`${API_BASE}/overrides`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ module_key: moduleKey, instrument_key: instrument, field_key: key, value: val })
            }).catch(e => console.warn('[useManualOverrides] Failed to save to SQLite:', e.message));
        }, 400);
    }, [moduleKey, instrument]);

    const handleClearAll = useCallback(() => {
        setOverrides({ ...defaultOverrides });
        setLastUpdated({});
        const encodedKey = encodeURIComponent(instrument);
        fetch(`${API_BASE}/overrides/${moduleKey}/${encodedKey}`, { method: 'DELETE' })
            .catch(e => console.warn('[useManualOverrides] Failed to clear from SQLite:', e.message));
    }, [moduleKey, instrument, defaultOverrides]);

    return { overrides, lastUpdated, expiryConfigs, handleChange, handleClearAll };
}
