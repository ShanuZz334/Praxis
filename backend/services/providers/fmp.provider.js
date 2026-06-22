import axios from "axios";
import BaseProvider from "./baseProvider.js";

const BASE_URL = "https://financialmodelingprep.com/stable";

export default class FMPProvider extends BaseProvider {
    constructor() {
        super("FMP");
    }

    /**
     * @override
     */
    async healthCheck() {
        try {
            const start = Date.now();
            // Use profile endpoint which is available on free tier
            const res = await axios.get(`${BASE_URL}/profile?symbol=AAPL&apikey=${this.apiKey}`, {
                timeout: 5000
            });
            const latency = Date.now() - start;

            if (res.status === 200 && res.data && res.data.length > 0) {
                return { status: "UP", latency };
            }
            return { status: "DOWN", latency, error: `HTTP ${res.status}` };
        } catch (err) {
            return { status: "DOWN", latency: 0, error: err.message };
        }
    }

    /**
     * @override
     * Fetch Company Profile (Fundamentals)
     */
    async fetchFundamentals(symbol) {
        if (!this.isInitialized) throw new Error("FMP Provider not initialized");

        try {
            const res = await axios.get(`${BASE_URL}/profile?symbol=${symbol}&apikey=${this.apiKey}`);
            const data = res.data[0];

            if (!data) return null;

            return {
                symbol: data.symbol,
                name: data.companyName,
                price: data.price,
                mcap: data.mktCap,
                pe: data.priceEarningsRatio || null, // Handle missing data gracefully
                beta: data.beta,
                volAvg: data.volAvg,
                description: data.description,
                sector: data.sector,
                website: data.website,
                source: "FMP"
            };
        } catch (err) {
            console.error(`[FMP] Error fetching fundamentals for ${symbol}:`, err.message);
            throw err;
        }
    }

    /**
     * @override
     * Fetch Realtime Quote (Simple fallback)
     */
    async fetchRealtimeQuotes(symbols) {
        if (!this.isInitialized) throw new Error("FMP Provider not initialized");


        try {
            // FMP quote-short is lighter and often freer
            const symbolStr = symbols.join(',');
            const res = await axios.get(`${BASE_URL}/quote-short?symbol=${symbolStr}&apikey=${this.apiKey}`);

            return res.data.map(q => ({
                symbol: q.symbol,
                ltp: q.price,
                // quote-short doesn't give change/volume, but it's better than nothing if quote fails
                // We'll leave change/volume as 0 or undefined if not present
                change: 0,
                changePct: 0,
                volume: q.volume || 0,
                ts: Date.now()
            }));
        } catch (err) {
            console.error(`[FMP] Error fetching quotes:`, err.message);
            throw err;
        }
    }
}
