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
    const [liveCandle, setLiveCandle] = useState(null);
    const { livePrices } = useDashboardContext();
    const backfillPollRef = useRef(null);
    const lastTotalCandlesRef = useRef(0);

    // Synchronously wipe data and show loader when instrument or timeframe changes
    // This prevents a 1-frame flash of the old chart data before useEffect kicks in
    const prevKeyRef = useRef(`${instrumentKey}-${timeframe}`);
    if (prevKeyRef.current !== `${instrumentKey}-${timeframe}`) {
        prevKeyRef.current = `${instrumentKey}-${timeframe}`;
        setLoading(true);
        setData([]);
        setLiveCandle(null);
    }

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
        setData([]); // Clear old data immediately for a clean reload
        setLiveCandle(null); // Clear stale live candle
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

    // Real-time live update of the latest candle using websocket data
    const lastLiveUpdateRef = useRef(0);
    useEffect(() => {
        if (!data || data.length === 0 || !livePrices || !instrumentKey) return;
        
        const tick = livePrices[instrumentKey];
        if (!tick || !tick.ltp) return;

        const now = Date.now();
        // Throttle rapid websocket ticks to 4 frames per second to prevent chart/UI lag
        if (now - lastLiveUpdateRef.current < 250) {
            return;
        }

        const lastHistorical = data[data.length - 1];
        
        setLiveCandle(prevLive => {
            const base = prevLive || lastHistorical;
            
            // If the tick doesn't stretch the candle or change the close, do nothing to avoid extra renders
            if (base.close === tick.ltp && base.high >= tick.ltp && base.low <= tick.ltp) {
                return prevLive;
            }
            
            lastLiveUpdateRef.current = now;
            return {
                ...base,
                close: tick.ltp,
                high: Math.max(base.high, tick.ltp),
                low: Math.min(base.low, tick.ltp)
            };
        });
    }, [livePrices, instrumentKey, data]);

    return { data, loading, error, isBackfilling, backfillInfo, liveCandle };
}
