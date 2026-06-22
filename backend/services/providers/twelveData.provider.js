import axios from "axios";
import BaseProvider from "./baseProvider.js";

const BASE_URL = "https://api.twelvedata.com";

export default class TwelveDataProvider extends BaseProvider {
    constructor() {
        super("TWELVEDATA");
    }

    /**
     * @override
     */
    async healthCheck() {
        try {
            const start = Date.now();
            // Simple quote check
            const res = await axios.get(`${BASE_URL}/quote?symbol=AAPL&apikey=${this.apiKey}`);
            const latency = Date.now() - start;

            if (res.data && res.data.symbol === 'AAPL') {
                return { status: "UP", latency };
            }
            return { status: "DOWN", latency, error: res.data.message || "Unknown Error" };
        } catch (err) {
            return { status: "DOWN", latency: 0, error: err.message };
        }
    }

    /**
     * @override
     * Fetch Realtime Quote
     */
    async fetchRealtimeQuotes(symbols) {
        if (!this.isInitialized) throw new Error("TwelveData Provider not initialized");

        try {
            const symStr = symbols.join(',');
            const res = await axios.get(`${BASE_URL}/quote?symbol=${symStr}&apikey=${this.apiKey}`);

            // TwelveData returns object with symbol keys if multiple, or single object if one
            const data = symbols.length === 1 ? { [symbols[0]]: res.data } : res.data;

            return Object.values(data).map(q => ({
                symbol: q.symbol,
                ltp: parseFloat(q.close),
                change: parseFloat(q.change),
                changePct: parseFloat(q.percent_change),
                volume: parseInt(q.volume || 0),
                ts: parseInt(q.timestamp) * 1000
            }));
        } catch (err) {
            console.error(`[TwelveData] Error fetching quotes:`, err.message);
            throw err;
        }
    }

    /**
    * @override
    * Fetch OHLC (Time Series)
    */
    async fetchOHLC(symbol, interval = '1day', outputsize = 30) {
        if (!this.isInitialized) throw new Error("TwelveData Provider not initialized");

        try {
            const res = await axios.get(`${BASE_URL}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${this.apiKey}`);

            if (res.data.status === 'error') {
                throw new Error(res.data.message);
            }

            return res.data.values.map(c => ({
                symbol: symbol,
                timeframe: interval,
                open: parseFloat(c.open),
                high: parseFloat(c.high),
                low: parseFloat(c.low),
                close: parseFloat(c.close),
                volume: parseInt(c.volume),
                ts: new Date(c.datetime).getTime()
            }));

        } catch (err) {
            console.error(`[TwelveData] Error fetching OHLC:`, err.message);
            throw err;
        }
    }
}
