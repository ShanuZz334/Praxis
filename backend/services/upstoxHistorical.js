import axios from "axios";
import UpstoxAuth from "../models/UpstoxAuth.js";
import db from "../config/localDb.js";

const UPSTOX_BASE_URL = "https://api.upstox.com/v2";

const cooldownCache = new Map();

/**
 * Helper to get the active Upstox access token.
 */
const getAuthToken = async () => {
    const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
    if (!auth || !auth.accessToken) throw new Error("Upstox is not authenticated");
    return auth.accessToken;
};

const insertCandleStmt = db.prepare(`
    INSERT INTO candles (
        instrument_key, timeframe, timestamp, open, high, low, close, volume, open_interest
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(instrument_key, timeframe, timestamp) DO UPDATE SET
        open=excluded.open,
        high=excluded.high,
        low=excluded.low,
        close=excluded.close,
        volume=excluded.volume,
        open_interest=excluded.open_interest
`);

/**
 * Fetches historical candles from Upstox (V3 API) and persists them locally.
 */
export const fetchHistoricalCandles = async (instrumentKey, timeframe, toDate, fromDate, isIntraday = false) => {
    try {
        const token = await getAuthToken();
        
        let apiInterval = 'day';
        if (timeframe.includes('minute') || timeframe.includes('hour')) {
            apiInterval = '1minute';
        } else {
            apiInterval = timeframe;
        }
        
        const url = isIntraday 
            ? `https://api.upstox.com/v2/historical-candle/intraday/${encodeURIComponent(instrumentKey)}/${apiInterval}`
            : `https://api.upstox.com/v2/historical-candle/${encodeURIComponent(instrumentKey)}/${apiInterval}/${toDate}/${fromDate}`;
        
        const response = await axios.get(url, {
            headers: { 
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            },
            timeout: 5000
        });

        let candlesData = response.data?.data?.candles || [];

        // If requested timeframe is not 1minute but we fetched 1minute, we must aggregate
        if (apiInterval === '1minute' && timeframe !== '1minute') {
            const minutesToGroup = timeframe.includes('hour') 
                ? parseInt(timeframe) * 60 
                : parseInt(timeframe);
                
            if (minutesToGroup && !isNaN(minutesToGroup)) {
                // Upstox returns data descending (newest first).
                // Sort ascending first to aggregate chronologically
                candlesData.reverse();
                
                const aggregated = [];
                let currentCandle = null;
                let currentWindowMs = 0;
                
                for (const c of candlesData) {
                    const ts = new Date(c[0]).getTime();
                    // Align window to the start of the interval (e.g. 09:15)
                    // Indian market opens at 09:15 IST (03:45 UTC). We can just group by mathematical intervals of the day.
                    // But simpler: just group every N minutes starting from the first candle of the day.
                    const dateStr = new Date(ts).toISOString().split('T')[0];
                    const marketOpenMs = new Date(`${dateStr}T03:45:00.000Z`).getTime();
                    let windowStartMs;
                    if (ts < marketOpenMs) {
                        windowStartMs = Math.floor(ts / (minutesToGroup * 60000)) * (minutesToGroup * 60000);
                    } else {
                        const msSinceOpen = ts - marketOpenMs;
                        const windowIndex = Math.floor(msSinceOpen / (minutesToGroup * 60000));
                        windowStartMs = marketOpenMs + (windowIndex * minutesToGroup * 60000);
                    }
                    
                    if (!currentCandle || currentWindowMs !== windowStartMs) {
                        if (currentCandle) aggregated.push(currentCandle);
                        currentWindowMs = windowStartMs;
                        currentCandle = [
                            new Date(windowStartMs).toISOString(), // timestamp
                            c[1], // open
                            c[2], // high
                            c[3], // low
                            c[4], // close
                            c[5], // volume
                            c[6] || 0 // oi
                        ];
                    } else {
                        if (c[2] > currentCandle[2]) currentCandle[2] = c[2]; // high
                        if (c[3] < currentCandle[3]) currentCandle[3] = c[3]; // low
                        currentCandle[4] = c[4]; // close
                        currentCandle[5] += c[5]; // volume
                        currentCandle[6] = c[6] || currentCandle[6]; // oi
                    }
                }
                if (currentCandle) aggregated.push(currentCandle);
                
                // Reverse back to descending for standard format
                aggregated.reverse();
                candlesData = aggregated;
            }
        }

        
        const insertAll = db.transaction((candles) => {
            for (const c of candles) {
                insertCandleStmt.run(
                    instrumentKey,
                    timeframe,
                    new Date(c[0]).toISOString(),
                    c[1], c[2], c[3], c[4], c[5], c[6] || 0
                );
            }
        });

        if (candlesData.length > 0) {
            insertAll(candlesData);
        }

        return candlesData;
    } catch (error) {
        console.error("❌ Failed to fetch historical candles:", error?.response?.data || error.message);
        throw error;
    }
};

/**
 * Smart Sync Engine with 4-second timeout guard.
 */
export const syncCandlesIfStale = async (instrumentKey, timeframe = 'day') => {
    const SYNC_TIMEOUT_MS = 8000;
    const cacheKey = `${instrumentKey}_${timeframe}`;

    // 1. Check Cooldown Cache (CRITICAL: Prevents API spam when market is closed)
    const lastCheck = cooldownCache.get(cacheKey);
    const nowTs = Date.now();
    if (lastCheck) {
        if (timeframe.includes('minute') && nowTs - lastCheck < 60000) return; // 1m cooldown
        if (timeframe.includes('hour') && nowTs - lastCheck < 300000) return; // 5m cooldown
        if (timeframe === 'day' && nowTs - lastCheck < 3600000) return; // 1hr cooldown
    }
    
    const syncWork = async () => {
        const stmt = db.prepare(`SELECT MAX(timestamp) as lastTs, COUNT(*) as count FROM candles WHERE instrument_key = ? AND timeframe = ?`);
        const { lastTs, count } = stmt.get(instrumentKey, timeframe);

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        if (!lastTs || count < 200) {
            const fromDateObj = new Date();
            if (timeframe === '1minute' || timeframe === '5minute' || timeframe === '10minute' || timeframe === '15minute') fromDateObj.setDate(fromDateObj.getDate() - 15);
            else if (timeframe === '30minute' || timeframe === '1hour') fromDateObj.setDate(fromDateObj.getDate() - 60);
            else fromDateObj.setDate(fromDateObj.getDate() - 365);
            
            const fromDate = fromDateObj.toISOString().split('T')[0];
            console.log(`[Historical Sync] Missing/Insufficient data for ${instrumentKey} (${timeframe}). Fetching: ${fromDate} to ${todayStr}`);
            await fetchHistoricalCandles(instrumentKey, timeframe, todayStr, fromDate, false);
            await fetchHistoricalCandles(instrumentKey, timeframe, todayStr, todayStr, true);
            cooldownCache.set(cacheKey, Date.now());
            return;
        }

        const lastDateObj = new Date(lastTs);
        const lastDateStr = lastDateObj.toISOString().split('T')[0];
        
        if (lastDateStr < todayStr || (timeframe !== 'day' && (nowTs - lastDateObj.getTime()) > 60000)) {
            // Need to update. If it's intraday, any gap > 1 minute might mean we need to fetch today's data again.
            if (lastDateStr < todayStr) {
                console.log(`[Historical Sync] Data stale for ${instrumentKey} (${timeframe}). Fetching historical: ${lastDateStr} to ${todayStr}`);
                await fetchHistoricalCandles(instrumentKey, timeframe, todayStr, lastDateStr, false);
            }
            if (timeframe !== 'day') {
                console.log(`[Historical Sync] Fetching intraday for ${instrumentKey} (${timeframe})`);
                await fetchHistoricalCandles(instrumentKey, timeframe, todayStr, todayStr, true);
            }
        }
        
        // Update cooldown
        cooldownCache.set(cacheKey, Date.now());
    };

    // Race: sync vs timeout. If Upstox is slow/down, timeout wins and we serve from DB.
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Sync timeout after ${SYNC_TIMEOUT_MS}ms`)), SYNC_TIMEOUT_MS)
    );

    try {
        await Promise.race([syncWork(), timeoutPromise]);
    } catch (err) {
        console.warn(`[Historical Sync] Skipped for ${instrumentKey}: ${err.message}`);
    }
};
