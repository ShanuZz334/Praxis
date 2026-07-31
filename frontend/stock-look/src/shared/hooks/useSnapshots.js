import { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';

/**
 * Universal hook for managing background snapshot queueing and fetching historical snapshots.
 * @param {string} instrument - The currently selected instrument (e.g., "NIFTY", "RELIANCE").
 */
export function useSnapshots(instrument) {
    const [historicalSnapshots, setHistoricalSnapshots] = useState({});
    const snapshotQueue = useRef({});
    const snapshotTimer = useRef(null);

    // Fetch historical data
    useEffect(() => {
        if (!instrument) return;
        
        setHistoricalSnapshots({}); // Clear previous instrument's history instantly
        
        axiosInstance.get(`/api/v1/snapshots/${encodeURIComponent(instrument)}`)
            .then(res => setHistoricalSnapshots(res.data?.data || {}))
            .catch(e => console.error("Failed to fetch snapshots", e));
    }, [instrument]);

    // Listen for SAVE_SNAPSHOT events from ANY card component in the app
    useEffect(() => {
        const handleSnapshot = (e) => {
            if (!instrument) return;
            const { card_id, raw_value, score, bias } = e.detail;
            snapshotQueue.current[card_id] = { instrument_key: instrument, card_id, raw_value, score, bias };

            clearTimeout(snapshotTimer.current);
            snapshotTimer.current = setTimeout(() => {
                const snapshots = Object.values(snapshotQueue.current);
                if (snapshots.length > 0) {
                    axiosInstance.post('/api/v1/snapshots', { snapshots })
                        .then(() => console.log('Saved snapshots:', snapshots.length))
                        .catch(err => console.error('Error saving snapshots:', err));
                    snapshotQueue.current = {};
                }
            }, 3000); // 3 second debounce to allow all cards to render and calculate
        };

        window.addEventListener('SAVE_SNAPSHOT', handleSnapshot);
        return () => window.removeEventListener('SAVE_SNAPSHOT', handleSnapshot);
    }, [instrument]);

    return {
        historicalSnapshots
    };
}
