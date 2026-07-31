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

/**
 * Hardcoded NSE 2026 Holidays as fallback.
 * Formatted as YYYY-MM-DD
 */
const FALLBACK_HOLIDAYS_2026 = [
    { date: "2026-01-26", holiday_type: "ALL", description: "Republic Day" },
    { date: "2026-03-03", holiday_type: "ALL", description: "Maha Shivaratri" },
    { date: "2026-03-24", holiday_type: "ALL", description: "Holi" },
    { date: "2026-04-03", holiday_type: "ALL", description: "Good Friday" },
    { date: "2026-04-14", holiday_type: "ALL", description: "Dr. Baba Saheb Ambedkar Jayanti" },
    { date: "2026-04-20", holiday_type: "ALL", description: "Ramzan Id (Id-Ul-Fitr)" },
    { date: "2026-05-01", holiday_type: "ALL", description: "Maharashtra Day" },
    { date: "2026-06-27", holiday_type: "ALL", description: "Bakri Id (Id-Ul-Zuha)" },
    { date: "2026-08-15", holiday_type: "ALL", description: "Independence Day" },
    { date: "2026-09-17", holiday_type: "ALL", description: "Ganesh Chaturthi" },
    { date: "2026-10-02", holiday_type: "ALL", description: "Mahatma Gandhi Jayanti" },
    { date: "2026-10-18", holiday_type: "ALL", description: "Dussehra" },
    { date: "2026-11-08", holiday_type: "ALL", description: "Diwali-Laxmi Pujan" }, // Muhurat Trading
    { date: "2026-11-10", holiday_type: "ALL", description: "Diwali-Balipratipada" },
    { date: "2026-11-24", holiday_type: "ALL", description: "Gurunanak Jayanti" },
    { date: "2026-12-25", holiday_type: "ALL", description: "Christmas" }
];

/**
 * Fetch market holidays. Tries Upstox API first, uses fallback if it fails.
 */
export const fetchMarketHolidays = async () => {
    try {
        const token = await getAuthToken();
        const response = await axios.get(`${UPSTOX_BASE_URL}/market/holidays`, {
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.data && response.data.data) {
            return response.data.data;
        }
    } catch (e) {
        console.warn("Failed to fetch Upstox holidays, using 2026 fallback:", e.message);
    }
    return FALLBACK_HOLIDAYS_2026;
};

/**
 * Fetches trades for the current day from Upstox and persists them in SQLite.
 * For a historical journal, you'd ideally use an endpoint that accepts a date, 
 * but Upstox only provides 'for-day' currently without a date param.
 * We sync it daily and store it locally.
 */
export const fetchTodayTrades = async () => {
    try {
        const token = await getAuthToken();
        const response = await axios.get(`${UPSTOX_BASE_URL}/order/trades/get-trades-for-day`, {
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.data && response.data.data) {
            const trades = response.data.data;
            const today = new Date().toISOString().split('T')[0];

            const stmt = db.prepare(`
                INSERT INTO trade_history (
                    trade_id, date, instrument_key, trading_symbol, transaction_type, 
                    quantity, average_price, pnl, r_multiple, strategy_tag, 
                    exchange, order_id, exchange_timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(trade_id) DO UPDATE SET
                    quantity=excluded.quantity,
                    average_price=excluded.average_price
            `);

            // Use transaction for bulk insert
            const insertMany = db.transaction((tradesList) => {
                for (const t of tradesList) {
                    stmt.run(
                        t.trade_id || t.exchange_order_id || Math.random().toString(), 
                        today,
                        t.instrument_token || '',
                        t.tradingsymbol || t.trading_symbol || '',
                        t.transaction_type || 'BUY',
                        t.quantity || 0,
                        t.average_price || 0,
                        0, // PNL needs to be calculated later based on pairs
                        0, // R multiple
                        '', // Strategy tag
                        t.exchange || 'NSE',
                        t.order_id || '',
                        t.exchange_timestamp || null
                    );
                }
            });

            insertMany(trades);
            return trades;
        }
    } catch (e) {
        console.error("Error fetching today's trades from Upstox:", e.response?.data || e.message);
        throw e;
    }
    return [];
};
