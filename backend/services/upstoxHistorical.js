import axios from "axios";
import UpstoxAuth from "../models/UpstoxAuth.js";
import db from "../config/localDb.js";

const UPSTOX_BASE_URL = "https://api.upstox.com/v2";

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
            headers: { "Accept": "application/json" } 
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
