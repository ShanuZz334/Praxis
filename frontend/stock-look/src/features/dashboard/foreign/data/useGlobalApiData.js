import { useState, useEffect } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';

/**
 * Fetches global macro data from the backend Yahoo Finance scraper.
 * Returns TWO separate objects:
 *   - `data`   : flat map of { [id]: currentValue } — used by mergedLiveData checks
 *   - `ranges` : map of { [id]: { hi52, lo52 } }   — used by scoring engine for auto-calibration
 */
export function useGlobalApiData() {
    const [liveApiData, setLiveApiData] = useState({});
    const [rangeData, setRangeData] = useState({});
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(API_PATHS.DATA.GLOBAL);
                if (mounted && res.data?.data) {
                    const raw = res.data.data;
                    const flatValues = {};
                    const ranges = {};

                    for (const [id, payload] of Object.entries(raw)) {
                        if (payload && typeof payload === 'object' && 'value' in payload) {
                            // New enriched format: { value, hi52, lo52 }
                            flatValues[id] = payload.value;
                            if (payload.hi52 !== null || payload.lo52 !== null) {
                                ranges[id] = { hi52: payload.hi52, lo52: payload.lo52 };
                            }
                        } else {
                            // Backward-compat: old format was just a scalar
                            flatValues[id] = payload;
                        }
                    }

                    setLiveApiData(flatValues);
                    setRangeData(ranges);
                }
            } catch(e) {
                console.error("Failed to fetch global live data", e);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        
        fetchData();
        const interval = setInterval(fetchData, 1 * 60 * 1000); // refresh every 1 min
        
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    return { data: liveApiData, ranges: rangeData, loading };
}
