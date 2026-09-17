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
    const { livePrices, updateLivePrice } = useDashboardContext();
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
        // Return all available stored candles from local SQLite DB (up to 25,000 bars).
        // If 10+ years of data is already stored in the DB (from Backtesting Workshop or past sync),
        // the normal chart section will cleanly include and display all of it.
        // Because no 'fromDate' param is passed here, the backend works safely like before
        // without hitting Upstox limits or calling 10-year deep backfill on instrument change.
        return 25000;
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
                const candleList = response.data.data || [];
                setData(candleList);
                lastTotalCandlesRef.current = candleList.length;
                if (candleList.length > 0) {
                    const latestBar = candleList[candleList.length - 1];
                    if (latestBar && typeof latestBar.close === 'number') {
                        updateLivePrice?.(instrumentKey, {
                            ltp: latestBar.close,
                            close: latestBar.close,
                            open: latestBar.open,
                            high: latestBar.high,
                            low: latestBar.low,
                            volume: latestBar.volume
                        });
                    }
                }
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

    // ─── Helpers for intraday candle boundary detection ───────────────────────
    // Returns true only when the Indian equity market (NSE/BSE) is open
    const _isMarketOpen = (nowMs) => {
        const istOffsetMs = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(nowMs + istOffsetMs);
        const dayOfWeek = istDate.getUTCDay(); // 0: Sun, 6: Sat
        if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Closed on weekends

        const hours = istDate.getUTCHours();
        const minutes = istDate.getUTCMinutes();
        const totalMinutes = hours * 60 + minutes;
        // Normal trading session: 09:15 IST (555 min) to 15:30 IST (930 min)
        return totalMinutes >= 555 && totalMinutes < 930;
    };

    // Returns the interval length in seconds for a given timeframe string,
    // or null for daily/weekly/monthly (which don't need live boundary tracking).
    const _getTimeframeSec = (tf) => {
        if (!tf) return null;
        const map = {
            '1m': 60, '1minute': 60,
            '3m': 180, '3minute': 180,
            '5m': 300, '5minute': 300,
            '10m': 600, '10minute': 600,
            '15m': 900, '15minute': 900,
            '30m': 1800, '30minute': 1800,
            '1h': 3600, '60m': 3600, '1hour': 3600,
        };
        return map[tf.toLowerCase().trim()] ?? null;
    };

    // Returns the Unix-seconds start of the candle that contains `nowMs`,
    // aligned to IST market open (09:15 = 03:45 UTC).
    const _alignedCandleStart = (nowMs, tfSec) => {
        if (!_isMarketOpen(nowMs)) return null;

        const istOffsetMs = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(nowMs + istOffsetMs);
        const dateStr = istDate.toISOString().split('T')[0];
        const marketOpenMs = new Date(`${dateStr}T03:45:00.000Z`).getTime();
        
        const windowIndex = Math.floor((nowMs - marketOpenMs) / (tfSec * 1000));
        return Math.floor((marketOpenMs + windowIndex * tfSec * 1000) / 1000);
    };

    // Real-time live update of the latest candle using websocket data
    const lastLiveUpdateRef = useRef(0);
    useEffect(() => {
        if (!data || data.length === 0 || !livePrices || !instrumentKey) return;
        
        const tick = livePrices[instrumentKey];
        if (!tick || !tick.ltp) return;

        const now = Date.now();
        // Do not synthesize live candles or mutate historical data when the market is closed
        if (!_isMarketOpen(now)) {
            return;
        }

        // Throttle rapid websocket ticks to 4 frames per second to prevent chart/UI lag
        if (now - lastLiveUpdateRef.current < 250) {
            return;
        }

        const lastHistorical = data[data.length - 1];

        setLiveCandle(prevLive => {
            // ── Candle boundary detection ─────────────────────────────────────
            // For intraday timeframes, check whether wall-clock has crossed into
            // a new bar. If so, open a brand-new candle instead of patching the old one.
            const tfSec = _getTimeframeSec(timeframe);
            if (tfSec) {
                const currentCandleStartSec = _alignedCandleStart(now, tfSec);
                const lastHistoricalTimeSec = typeof lastHistorical.time === 'number'
                    ? lastHistorical.time
                    : Math.floor(new Date(lastHistorical.time).getTime() / 1000);

                if (currentCandleStartSec && currentCandleStartSec > lastHistoricalTimeSec) {
                    // GUARD: Only spawn a fresh candle on the VERY FIRST tick of this new
                    // boundary. If prevLive already has this timestamp, the bar is already
                    // open — fall through to the normal OHLC-accumulation logic below.
                    if (!prevLive || prevLive.time !== currentCandleStartSec) {
                        // First tick of a genuinely new bar — spawn a fresh OHLCV candle
                        lastLiveUpdateRef.current = now;
                        return {
                            time:   currentCandleStartSec,
                            open:   tick.ltp,
                            high:   tick.ltp,
                            low:    tick.ltp,
                            close:  tick.ltp,
                            volume: 0, // Fresh bar starts at 0, never full-day cumulative volume
                        };
                    }
                    // else: prevLive is already at this boundary — accumulate below
                }
            }

            // ── Same bar — update the running candle ──────────────────────────
            const base = prevLive || lastHistorical;

            // Skip re-render if nothing changed
            if (base.close === tick.ltp && base.high >= tick.ltp && base.low <= tick.ltp) {
                return prevLive;
            }

            lastLiveUpdateRef.current = now;
            return {
                ...base,
                close:  tick.ltp,
                high:   Math.max(base.high, tick.ltp),
                low:    Math.min(base.low,  tick.ltp),
                volume: base.volume || 0,
            };
        });
    }, [livePrices, instrumentKey, data, timeframe]);

    return { data, loading, error, isBackfilling, backfillInfo, liveCandle };
}
