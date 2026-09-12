import axios from "axios";
import UpstoxAuth from "../models/UpstoxAuth.js";
import db from "../config/localDb.js";

import { getUpstoxLiveToken } from "../utils/upstoxAuthHelper.js";

const UPSTOX_BASE_URL = "https://api.upstox.com/v2";

const cooldownCache = new Map();

/**
 * Helper to get the active Upstox access token.
 */
const getAuthToken = async () => {
    return await getUpstoxLiveToken();
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
    const SYNC_TIMEOUT_MS = 15000;
    const cacheKey = `${instrumentKey}_${timeframe}`;

    // 1. Check Cooldown Cache (CRITICAL: Prevents API spam when market is closed)
    const lastCheck = cooldownCache.get(cacheKey);
    const nowTs = Date.now();
    if (lastCheck) {
        // Per-timeframe cooldowns — sync happens ~1 candle-duration before the next bar,
        // not every 60 seconds regardless of interval (the old flat-60s caused stale charts).
        const COOLDOWNS = {
            '1minute':  45 * 1000,          // 45 s  — 1-min bars
            '3minute':  2  * 60 * 1000,     // 2 min
            '5minute':  4  * 60 * 1000,     // 4 min
            '10minute': 9  * 60 * 1000,     // 9 min
            '15minute': 13 * 60 * 1000,     // 13 min — key fix: was 60s (flat)
            '30minute': 28 * 60 * 1000,     // 28 min
            '1hour':    58 * 60 * 1000,     // 58 min
            'day':      60 * 60 * 1000,     // 1 hr
            'week':     6  * 60 * 60 * 1000,// 6 hr
            'month':    24 * 60 * 60 * 1000,// 24 hr
        };
        const cooldown = COOLDOWNS[timeframe]
            ?? (timeframe.includes('minute') ? 45 * 1000
                : timeframe.includes('hour') ? 58 * 60 * 1000
                : 60 * 60 * 1000);
        if (nowTs - lastCheck < cooldown) return;
    }
    
    const syncWork = async () => {
        const stmt = db.prepare(`SELECT MAX(timestamp) as lastTs, COUNT(*) as count FROM candles WHERE instrument_key = ? AND timeframe = ?`);
        const { lastTs, count } = stmt.get(instrumentKey, timeframe);

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const isIntraday = timeframe.includes('minute') || timeframe.includes('hour');

        // Check if there is an existing multi-day gap between the newest candles and older candles
        let hasHistoricalGap = false;
        if (lastTs && count > 0) {
            const recentDates = db.prepare(`
                SELECT DISTINCT SUBSTR(timestamp, 1, 10) as dt 
                FROM candles 
                WHERE instrument_key = ? AND timeframe = ?
                ORDER BY dt DESC 
                LIMIT 2
            `).all(instrumentKey, timeframe);

            if (recentDates.length >= 2) {
                const newestDay = new Date(recentDates[0].dt);
                const prevDay = new Date(recentDates[1].dt);
                const diffDays = Math.round((newestDay - prevDay) / (1000 * 60 * 60 * 24));
                // Normal weekend gap is 3 days (Fri to Mon). A gap > 4 days indicates missing trading sessions.
                if (diffDays > 4) {
                    hasHistoricalGap = true;
                    console.log(`[Historical Sync] Detected ${diffDays}-day gap between ${recentDates[1].dt} and ${recentDates[0].dt} for ${instrumentKey} (${timeframe}).`);
                }
            }
        }
        
        if (!lastTs || count < 200 || hasHistoricalGap) {
            const fromDateObj = new Date();
            // Upstox historical-candle API strictly enforces a maximum 30-day window for 1minute intervals.
            // Using 28 days prevents UDAPI1148 errors across all intraday timeframes (1m, 5m, 15m, 30m, 1h).
            if (isIntraday) {
                fromDateObj.setDate(fromDateObj.getDate() - 28);
            } else {
                fromDateObj.setDate(fromDateObj.getDate() - 365);
            }
            
            const fromDate = fromDateObj.toISOString().split('T')[0];
            console.log(`[Historical Sync] Missing/Insufficient data or gap for ${instrumentKey} (${timeframe}). Fetching: ${fromDate} to ${todayStr}`);
            await fetchHistoricalCandles(instrumentKey, timeframe, todayStr, fromDate, false);
            if (isIntraday) {
                await fetchHistoricalCandles(instrumentKey, timeframe, todayStr, todayStr, true);
            }
            cooldownCache.set(cacheKey, Date.now());
            return;
        }

        const lastDateObj = new Date(lastTs);
        const lastDateStr = lastDateObj.toISOString().split('T')[0];
        
        if (lastDateStr < todayStr || (timeframe !== 'day' && (nowTs - lastDateObj.getTime()) > 60000)) {
            // Need to update. If it's intraday, any gap > 1 minute might mean we need to fetch today's data again.
            if (lastDateStr < todayStr) {
                // Cap from_date to Upstox's intraday data retention window to prevent UDAPI1148 errors.
                let effectiveFromDate = lastDateStr;
                if (isIntraday) {
                    const maxDaysBack = 28; // stay safely inside the 30-day retention window
                    const retentionCutoff = new Date();
                    retentionCutoff.setDate(retentionCutoff.getDate() - maxDaysBack);
                    const cutoffStr = retentionCutoff.toISOString().split('T')[0];
                    if (lastDateStr < cutoffStr) {
                        console.warn(`[Historical Sync] ${instrumentKey} (${timeframe}): lastDate ${lastDateStr} is outside Upstox retention (${maxDaysBack}d). Capping from_date to ${cutoffStr}.`);
                        effectiveFromDate = cutoffStr;
                    }
                }
                console.log(`[Historical Sync] Data stale for ${instrumentKey} (${timeframe}). Fetching historical: ${effectiveFromDate} to ${todayStr}`);
                await fetchHistoricalCandles(instrumentKey, timeframe, todayStr, effectiveFromDate, false);
            }
            if (isIntraday) {
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

// Cache of completed deep historical backfills to guarantee zero redundant API calls
const completedHistoricalSyncs = new Set();

/**
 * Ensures daily historical candles exist in SQLite back to targetFromDate (e.g. '2010-01-01' or '2000-01-01').
 * If data is already in SQLite, strictly returns immediately with ZERO API calls.
 */
export const ensureHistoricalDailyCandles = async (instrumentKey, targetFromDate = '2010-01-01') => {
    const targetYear = new Date(targetFromDate).getFullYear();
    const syncKey = `${instrumentKey}_day_${targetYear}`;
    if (completedHistoricalSyncs.has(syncKey)) {
        return; // Already backfilled and verified in DB
    }

    try {
        // Check persistent SQLite backfill metadata
        try {
            const meta = db.prepare("SELECT oldest_date FROM historical_backfill_meta WHERE instrument_key = ? AND timeframe = 'day'").get(instrumentKey);
            if (meta && meta.oldest_date) {
                const metaYear = new Date(meta.oldest_date).getFullYear();
                if (metaYear <= targetYear) {
                    completedHistoricalSyncs.add(syncKey);
                    return; // 100% verified in DB metadata
                }
            }
        } catch (_) {}

        const stmt = db.prepare(`SELECT MIN(timestamp) as oldestTs, COUNT(*) as cnt FROM candles WHERE instrument_key = ? AND timeframe = 'day'`);
        const row = stmt.get(instrumentKey);
        
        if (row && row.oldestTs) {
            const oldestYear = new Date(row.oldestTs).getFullYear();
            // If the oldest candle in DB is in the target year or earlier, it's ALREADY STORED!
            if (oldestYear <= targetYear) {
                completedHistoricalSyncs.add(syncKey);
                try {
                    db.prepare("INSERT OR REPLACE INTO historical_backfill_meta (instrument_key, timeframe, oldest_date) VALUES (?, 'day', ?)").run(instrumentKey, row.oldestTs);
                } catch (_) {}
                return; // 100% in DB, zero API calls needed
            }
        }

        let oldestInDb = row?.oldestTs ? new Date(row.oldestTs) : new Date();
        const targetDateObj = new Date(targetFromDate);

        console.log(`[Deep Backfill] Fetching historical daily candles for ${instrumentKey} from ${targetFromDate} to ${oldestInDb.toISOString().split('T')[0]}`);

        let currentTo = oldestInDb;
        while (currentTo > targetDateObj) {
            const nextFrom = new Date(currentTo);
            nextFrom.setFullYear(nextFrom.getFullYear() - 7);
            const actualFrom = nextFrom < targetDateObj ? targetDateObj : nextFrom;

            const toStr = currentTo.toISOString().split('T')[0];
            const fromStr = actualFrom.toISOString().split('T')[0];

            console.log(`[Deep Backfill] Window: ${fromStr} -> ${toStr}`);
            try {
                await fetchHistoricalCandles(instrumentKey, 'day', toStr, fromStr, false);
            } catch (err) {
                console.warn(`[Deep Backfill] Window ${fromStr} -> ${toStr} failed: ${err.message}`);
                break;
            }

            // Move pointer backwards
            currentTo = new Date(actualFrom);
            currentTo.setDate(currentTo.getDate() - 1);
        }

        // Record persistent metadata so this instrument is never re-queried for history
        try {
            const postStmt = db.prepare(`SELECT MIN(timestamp) as oldestTs FROM candles WHERE instrument_key = ? AND timeframe = 'day'`);
            const postRow = postStmt.get(instrumentKey);
            if (postRow && postRow.oldestTs) {
                db.prepare("INSERT OR REPLACE INTO historical_backfill_meta (instrument_key, timeframe, oldest_date) VALUES (?, 'day', ?)").run(instrumentKey, postRow.oldestTs);
            }
        } catch (_) {}

        completedHistoricalSyncs.add(syncKey);
    } catch (e) {
        console.error(`[Deep Backfill] Error for ${instrumentKey}:`, e.message);
    }
};

