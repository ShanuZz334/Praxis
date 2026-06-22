import axios from "axios";
import BaseProvider from "./baseProvider.js";

const BASE_URL = "https://api.upstox.com/v2";

export default class UpstoxProvider extends BaseProvider {
    constructor() {
        super("UPSTOX");
        this.accessToken = null;
    }

    /**
     * @override
     */
    async init(credentials) {
        await super.init(credentials);
        // Upstox requires an access_token generated via OAuth
        // We expect this to be stored in the 'extra' JSON field
        if (this.extra && this.extra.access_token) {
            this.accessToken = this.extra.access_token;
        } else {
            console.warn("[Upstox] No access_token found in credentials. Realtime calls will fail.");
        }
    }

    /**
     * @override
     */
    async healthCheck() {
        if (!this.accessToken) {
            return { status: "DOWN", latency: 0, error: "Missing Access Token" };
        }

        try {
            const start = Date.now();
            // Fetch User Profile as a lightweight check
            const res = await axios.get(`${BASE_URL}/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/json'
                }
            });
            const latency = Date.now() - start;

            if (res.status === 200 && res.data.status === 'success') {
                return { status: "UP", latency };
            }
            return { status: "DOWN", latency, error: "API Error" };
        } catch (err) {
            // Handle 401 Unauthorized specifically
            if (err.response && err.response.status === 401) {
                return { status: "DOWN", latency: 0, error: "Token Expired/Invalid" };
            }
            return { status: "DOWN", latency: 0, error: err.message };
        }
    }

    /**
     * @override
     * Fetch Realtime Quote (LTP)
     */
    async fetchRealtimeQuotes(symbols) {
        if (!this.accessToken) throw new Error("Upstox Access Token missing");

        try {
            // Upstox Format: NSE_EQ|INE002A01018
            // We assume symbols are passed in a compatible format or mapped
            // For now, passing raw symbols provided
            const symbolStr = symbols.join(',');
            const res = await axios.get(`${BASE_URL}/market-quote/ltp?instrument_key=${symbolStr}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/json'
                }
            });

            if (res.data.status !== 'success') {
                throw new Error("Failed to fetch quotes");
            }

            // Map response
            // Upstox response: { "data": { "NSE_EQ:Reliance": { "last_price": 2500, ... } } }
            return Object.entries(res.data.data).map(([key, val]) => ({
                symbol: key,
                ltp: val.last_price,
                ts: Date.now() // Upstox LTP endpoint doesn't always return TS, using current
            }));

        } catch (err) {
            console.error(`[Upstox] Error fetching quotes:`, err.message);
            throw err;
        }
    }
}
