import axios from "axios";
import UpstoxAuth from "../models/UpstoxAuth.js";
import db from "../config/localDb.js";

const UPSTOX_BASE_URL = "https://api.upstox.com/v2";

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

export const fetchOptionChain = async (instrumentKey, expiryDate) => {
    try {
        const token = await getAuthToken();
        const url = `${UPSTOX_BASE_URL}/option/chain?instrument_key=${encodeURIComponent(instrumentKey)}&expiry_date=${expiryDate}`;
        
        const response = await axios.get(url, {
            headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
        });

        const chainData = response.data?.data || [];
        
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
