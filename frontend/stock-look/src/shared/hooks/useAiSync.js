import { useEffect, useRef } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';

/**
 * useAiSync
 * Silently streams the fully-calculated AI Composite Snapshot to the backend SQLite universal store.
 * 
 * @param {string} instrumentKey - The selected instrument (e.g. 'NSE_EQ|HDFC')
 * @param {string} pageName - The page being synced (e.g. 'Technical', 'Options')
 * @param {object} snapshot - The fully calculated AI composite snapshot object
 */
export function useAiSync(instrumentKey, pageName, snapshot) {
    const lastSyncedRef  = useRef(null);
    const failureCountRef = useRef(0);   // consecutive failure counter
    const backoffTimerRef = useRef(null); // tracks active backoff timer

    useEffect(() => {
        if (!instrumentKey || !pageName || !snapshot) return;
        
        // Prevent spamming the backend with the exact same payload repeatedly
        const hashStr = `${instrumentKey}-${snapshot.compositeScore}-${JSON.stringify(snapshot.regime || {})}`;
        
        if (lastSyncedRef.current === hashStr) return; // already synced this exact snapshot

        // ── Failure Circuit Breaker ───────────────────────────────────────────────
        // If the endpoint has failed ≥3 times in a row, stop retrying automatically.
        // The user must change the instrument or refresh to reset the counter.
        // This prevents the infinite 500-error spam when the AI provider is down.
        const MAX_CONSECUTIVE_FAILURES = 3;
        if (failureCountRef.current >= MAX_CONSECUTIVE_FAILURES) return;

        const syncToBackend = async () => {
            // Optimistically mark as synced before the request so that if React
            // re-renders during the await, we don't launch a duplicate call.
            lastSyncedRef.current = hashStr;
            
            try {
                if (snapshot.compositeScore === undefined || snapshot.compositeScore === null) return;
                
                await axiosInstance.post(
                    `/api/v1/intelligence/sync`, 
                    {
                        instrument_key: instrumentKey,
                        page_name: pageName,
                        payload: snapshot
                    }
                );
                
                // Success — reset failure count
                failureCountRef.current = 0;
                console.log(`📡 Silently synced ${pageName} AI Snapshot for ${instrumentKey} to SQLite.`);
            } catch (err) {
                failureCountRef.current += 1;
                const count = failureCountRef.current;
                console.warn(`[useAiSync] Sync failed (${count}/${MAX_CONSECUTIVE_FAILURES}): ${err.message}`);

                if (count < MAX_CONSECUTIVE_FAILURES) {
                    // Revert hash so it retries when data next changes — but cap retries
                    lastSyncedRef.current = null;
                } else {
                    // Circuit open: keep hash so the effect early-exits on next render.
                    // Do NOT revert to null — we're done retrying until a reset condition.
                    console.warn(`[useAiSync] Circuit breaker open for ${pageName}. Stopped auto-retry after ${count} failures.`);
                }
            }
        };

        syncToBackend();

        return () => {
            if (backoffTimerRef.current) clearTimeout(backoffTimerRef.current);
        };
    }, [instrumentKey, pageName, snapshot]);
}
