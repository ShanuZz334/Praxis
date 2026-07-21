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
    const lastSyncedRef = useRef(null);

    useEffect(() => {
        if (!instrumentKey || !pageName || !snapshot) return;
        
        // Prevent spamming the backend with the exact same payload repeatedly
        // We only want to sync when the actual underlying composite score or data changes
        const hashStr = `${instrumentKey}-${snapshot.compositeScore}-${snapshot.regime || ''}`;
        
        if (lastSyncedRef.current === hashStr) {
            return; // Already synced this exact snapshot
        }

        const syncToBackend = async () => {
            try {
                // Ensure we have the minimum required data to avoid DB errors
                if (snapshot.compositeScore === undefined || snapshot.compositeScore === null) return;
                
                await axiosInstance.post(
                    `/api/v1/intelligence/sync`, 
                    {
                        instrument_key: instrumentKey,
                        page_name: pageName,
                        payload: snapshot
                    }
                );
                
                // Mark as successfully synced
                lastSyncedRef.current = hashStr;
                console.log(`📡 Silently synced ${pageName} AI Snapshot for ${instrumentKey} to SQLite.`);
            } catch (err) {
                console.error(`Failed to sync ${pageName} AI Snapshot to backend:`, err.message);
            }
        };

        syncToBackend();

    }, [instrumentKey, pageName, snapshot]);
}
