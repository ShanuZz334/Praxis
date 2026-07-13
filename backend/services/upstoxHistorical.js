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
 * Fetches historical candles from Upstox and persists them locally.
 */
export const fetchHistoricalCandles = async (instrumentKey, interval, toDate, fromDate) => {
    try {
        const token = await getAuthToken();
        const url = `${UPSTOX_BASE_URL}/historical-candle/${encodeURIComponent(instrumentKey)}/${interval}/${toDate}/${fromDate}`;
        
        const response = await axios.get(url, {
            headers: { 
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            },
            timeout: 5000  // 5s hard timeout — never hang the response
        });

        const candlesData = response.data?.data?.candles || [];
        
        const insertAll = db.transaction((candles) => {
            for (const c of candles) {
                insertCandleStmt.run(
                    instrumentKey,
                    interval,
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
 * Checks SQLite for MAX(timestamp). If stale, fetches only the missing days.
 * If empty or < 200, fetches history dynamically based on timeframe.
 */
export const syncCandlesIfStale = async (instrumentKey, timeframe = 'day') => {
    const SYNC_TIMEOUT_MS = 4000;
    const cacheKey = `${instrumentKey}_${timeframe}`;

    // 1. Check Cooldown Cache (CRITICAL: Prevents API spam when market is closed)
    const lastCheck = cooldownCache.get(cacheKey);
    const nowTs = Date.now();
    if (lastCheck) {
        if (timeframe === '1minute' && nowTs - lastCheck < 60000) return; // 1m cooldown
        if (timeframe === '30minute' && nowTs - lastCheck < 1800000) return; // 30m cooldown
        if (timeframe === 'day' && nowTs - lastCheck < 3600000) return; // 1hr cooldown
    }
    
    const syncWork = async () => {
        const stmt = db.prepare(`SELECT MAX(timestamp) as lastTs, COUNT(*) as count FROM candles WHERE instrument_key = ? AND timeframe = ?`);
        const { lastTs, count } = stmt.get(instrumentKey, timeframe);

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        if (!lastTs || count < 200) {
            const fromDateObj = new Date();
            if (timeframe === '1minute') fromDateObj.setDate(fromDateObj.getDate() - 15);
            else if (timeframe === '30minute') fromDateObj.setDate(fromDateObj.getDate() - 60);
            else fromDateObj.setDate(fromDateObj.getDate() - 365);
            
            const fromDate = fromDateObj.toISOString().split('T')[0];
            console.log(`[Historical Sync] Missing/Insufficient data for ${instrumentKey} (${timeframe}). Fetching: ${fromDate} to ${todayStr}`);
            await fetchHistoricalCandles(instrumentKey, timeframe, todayStr, fromDate);
            cooldownCache.set(cacheKey, Date.now());
            return;
        }

        const lastDateObj = new Date(lastTs);
        const lastDateStr = lastDateObj.toISOString().split('T')[0];
        
        if (lastDateStr < todayStr || (timeframe !== 'day' && (nowTs - lastDateObj.getTime()) > 60000)) {
            // Need to update. If it's intraday, any gap > 1 minute might mean we need to fetch today's data again.
            // For simplicity, just fetch from lastDateStr to todayStr
            console.log(`[Historical Sync] Data stale for ${instrumentKey} (${timeframe}). Fetching: ${lastDateStr} to ${todayStr}`);
            await fetchHistoricalCandles(instrumentKey, timeframe, todayStr, lastDateStr);
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
