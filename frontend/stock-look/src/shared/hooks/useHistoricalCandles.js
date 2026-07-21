import { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { useDashboardContext } from '@/shared/context/DashboardContext';

/**
 * useHistoricalCandles
 * Fetches historical candle data from Upstox (via SQLite cache) and dynamically updates
 * the most recent candle using the live price websocket stream.
 * Also drives the Smart Backfill Engine: polls backfill-status and re-fetches
 * candles whenever new historical windows are downloaded in the background.
 */
export function useHistoricalCandles(instrumentKey, timeframe) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isBackfilling, setIsBackfilling] = useState(false);
    const [backfillInfo, setBackfillInfo] = useState(null);
    const backfillPollRef = useRef(null);
    const lastTotalCandlesRef = useRef(0);

    const getLimit = (tf) => {
        if (tf === 'day') return 730;
        if (tf === 'week') return 104;
        if (tf === 'month') return 60;
        return 99999;
    };

    const fetchCandles = async (isMounted) => {
        if (!instrumentKey) return;
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get('/api/v1/upstox/candles', {
                params: { instrument: instrumentKey, timeframe, limit: getLimit(timeframe) }
            });
            if (isMounted && response.data?.success) {
                setData(response.data.data);
                lastTotalCandlesRef.current = response.data.data.length;
            }
        } catch (err) {
            console.error('Failed to fetch historical candles:', err);
            if (isMounted) setError(err.message);
        } finally {
            if (isMounted) setLoading(false);
        }
    };

    const pollBackfillStatus = (isMounted) => {
        if (timeframe === 'day' || timeframe === 'week' || timeframe === 'month') return;
        if (backfillPollRef.current) clearInterval(backfillPollRef.current);

        backfillPollRef.current = setInterval(async () => {
            if (!isMounted) return;
            try {
                const res = await axiosInstance.get('/api/v1/upstox/candles/backfill-status', {
                    params: { instrument: instrumentKey, timeframe }
                });
                if (!isMounted) return;
                const status = res.data;
                setIsBackfilling(!!status.isRunning);
                setBackfillInfo(status);
                if (status.totalCandles > lastTotalCandlesRef.current) {
                    console.log('[Backfill] New candles available ('+lastTotalCandlesRef.current+' -> '+status.totalCandles+'). Refreshing chart...');
                    await fetchCandles(isMounted);
                }
                if (status.isComplete && !status.isRunning) {
                    clearInterval(backfillPollRef.current);
                    backfillPollRef.current = null;
                    setIsBackfilling(false);
                }
            } catch (e) { /* silently ignore */ }
        }, 8000);
    };

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            await fetchCandles(isMounted);
            pollBackfillStatus(isMounted);
        };
        init();
        return () => {
            isMounted = false;
            if (backfillPollRef.current) {
                clearInterval(backfillPollRef.current);
                backfillPollRef.current = null;
            }
        };
    }, [instrumentKey, timeframe]);

    return { data, loading, error, isBackfilling, backfillInfo };
}
