import axios from "axios";
import UpstoxAuth from "../models/UpstoxAuth.js";
import db from "../config/localDb.js";

const UPSTOX_BASE_URL = "https://api.upstox.com/v2";

const getTradingDay = () => {
    const now = new Date();
    // Convert to IST
    const istOffset = 5.5 * 60 * 60 * 1000; 
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + istOffset);
    
    let day = istDate.getDay();
    let hours = istDate.getHours();
    let minutes = istDate.getMinutes();
    
    if (hours < 9 || (hours === 9 && minutes < 15)) {
        istDate.setDate(istDate.getDate() - 1);
        day = istDate.getDay();
    }
    
    if (day === 0) {
        istDate.setDate(istDate.getDate() - 2);
    } else if (day === 6) {
        istDate.setDate(istDate.getDate() - 1);
    }
    
    return istDate.toISOString().split('T')[0];
};

const getAuthToken = async () => {
    const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
    if (!auth || !auth.accessToken) throw new Error("Upstox is not authenticated");
    return auth.accessToken;
};

const insertOptionChainStmt = db.prepare(`
    INSERT INTO option_chain (
        underlying_key, expiry, strike_price, spot_price, 
        ce_ltp, pe_ltp, ce_oi, pe_oi, ce_oi_change, pe_oi_change, 
        ce_volume, pe_volume, ce_instrument_key, pe_instrument_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(underlying_key, expiry, strike_price) DO UPDATE SET
        spot_price=excluded.spot_price,
        ce_ltp=excluded.ce_ltp,
        pe_ltp=excluded.pe_ltp,
        ce_oi=excluded.ce_oi,
        pe_oi=excluded.pe_oi,
        ce_oi_change=excluded.ce_oi_change,
        pe_oi_change=excluded.pe_oi_change,
        ce_volume=excluded.ce_volume,
        pe_volume=excluded.pe_volume,
        ce_instrument_key=excluded.ce_instrument_key,
        pe_instrument_key=excluded.pe_instrument_key,
        updated_at=CURRENT_TIMESTAMP
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS daily_oi_baseline (
        instrument_key TEXT,
        expiry TEXT,
        strike_price REAL,
        snapshot_date TEXT,
        ce_oi REAL,
        pe_oi REAL,
        PRIMARY KEY (instrument_key, expiry, strike_price, snapshot_date)
    )
`);

const insertBaselineStmt = db.prepare(`
    INSERT OR IGNORE INTO daily_oi_baseline (
        instrument_key, expiry, strike_price, snapshot_date, ce_oi, pe_oi
    ) VALUES (?, ?, ?, ?, ?, ?)
`);

const getBaselineStmt = db.prepare(`
    SELECT ce_oi, pe_oi FROM daily_oi_baseline 
    WHERE instrument_key = ? AND expiry = ? AND strike_price = ? AND snapshot_date = ?
`);

export const fetchOptionChain = async (instrumentKey, expiryDate) => {
    try {
        const token = await getAuthToken();
        const url = `${UPSTOX_BASE_URL}/option/chain?instrument_key=${encodeURIComponent(instrumentKey)}&expiry_date=${expiryDate}`;
        
        const response = await axios.get(url, {
            headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
        });

        const chainData = response.data?.data || [];
        const today = getTradingDay();
        
        // Inject true OI change from backend baseline before saving
        chainData.forEach(c => {
            const strike = c.strike_price;
            const ce_oi = c.call_options?.market_data?.oi || 0;
            const pe_oi = c.put_options?.market_data?.oi || 0;
            
            // Register baseline for the day (ignored if already exists)
            insertBaselineStmt.run(instrumentKey, expiryDate, strike, today, ce_oi, pe_oi);
            
            const baseline = getBaselineStmt.get(instrumentKey, expiryDate, strike, today);
            
            let ce_oi_change = 0;
            let pe_oi_change = 0;
            
            if (baseline) {
                ce_oi_change = ce_oi - baseline.ce_oi;
                pe_oi_change = pe_oi - baseline.pe_oi;
            }

            if (c.call_options && c.call_options.market_data) {
                c.call_options.market_data.oi_change = ce_oi_change;
            }
            if (c.put_options && c.put_options.market_data) {
                c.put_options.market_data.oi_change = pe_oi_change;
            }
        });
        
        const insertAll = db.transaction((items) => {
            for (const c of items) {
                insertOptionChainStmt.run(
                    instrumentKey, expiryDate, c.strike_price, c.underlying_spot_price,
                    c.call_options?.market_data?.ltp, c.put_options?.market_data?.ltp,
                    c.call_options?.market_data?.oi, c.put_options?.market_data?.oi,
                    c.call_options?.market_data?.oi_change, c.put_options?.market_data?.oi_change,
                    c.call_options?.market_data?.volume, c.put_options?.market_data?.volume,
                    c.call_options?.instrument_key, c.put_options?.instrument_key
                );
            }
        });

        if (chainData.length > 0) insertAll(chainData);

        return chainData;
    } catch (error) {
        console.error("❌ Failed to fetch option chain:", error?.response?.data || error.message);
        throw error;
    }
};
