import axios from "axios";
import UpstoxAuth from "../models/UpstoxAuth.js";
import db from "../config/localDb.js";

const UPSTOX_BASE_URL = "https://api.upstox.com/v2";

const getAuthToken = async () => {
    const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
    if (!auth || !auth.accessToken) throw new Error("Upstox is not authenticated");
    return auth.accessToken;
};

const insertQuoteStmt = db.prepare(`
    INSERT INTO quotes (
        instrument_key, ltp, open, high, low, close, volume, 
        lower_circuit, upper_circuit, yearly_high, yearly_low, market_depth
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(instrument_key) DO UPDATE SET
        ltp=excluded.ltp,
        open=excluded.open,
        high=excluded.high,
        low=excluded.low,
        close=excluded.close,
        volume=excluded.volume,
        lower_circuit=excluded.lower_circuit,
        upper_circuit=excluded.upper_circuit,
        yearly_high=excluded.yearly_high,
        yearly_low=excluded.yearly_low,
        market_depth=excluded.market_depth,
        updated_at=CURRENT_TIMESTAMP
`);

export const fetchQuotes = async (instrumentKeys) => {
    try {
        const token = await getAuthToken();
        const url = `${UPSTOX_BASE_URL}/market-quote/quotes?instrument_key=${encodeURIComponent(instrumentKeys.join(","))}`;
        
        const response = await axios.get(url, {
            headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
        });

        const quotesData = response.data?.data || {};
        
        const insertAll = db.transaction((keys) => {
            for (const key of keys) {
                const q = quotesData[key];
                if (!q) continue;
                
                insertQuoteStmt.run(
                    key,
                    q.last_price, q.ohlc?.open, q.ohlc?.high, q.ohlc?.low, q.ohlc?.close,
                    q.volume, q.lower_circuit_limit, q.upper_circuit_limit,
                    q.all_time_high || 0, q.all_time_low || 0,
                    JSON.stringify(q.depth || {})
                );
            }
        });

        const keys = Object.keys(quotesData);
        if (keys.length > 0) insertAll(keys);

        return quotesData;
    } catch (error) {
        console.error("❌ Failed to fetch quotes:", error?.response?.data || error.message);
        throw error;
    }
};
