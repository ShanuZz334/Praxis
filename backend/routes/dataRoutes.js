import express from "express";
import axios from "axios";
import { yahooFinanceService } from "../services/yahooFinanceService.js";
import { fredApiService } from "../services/fredApiService.js";

const router = express.Router();

// Memory Cache
let globalCache = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 1 * 60 * 1000; // 1 minute

// Map of our internal IDs to Yahoo Finance symbols
const SYMBOL_MAP = {
    // Currency
    "dxy": "DX-Y.NYB",
    "eurusd": "EURUSD=X",
    "usdjpy": "JPY=X",
    "usd_inr": "USDINR=X",

    // Global Indices
    "sp_futures": "ES=F",
    "nasdaq_futures": "NQ=F",
    "dow_futures": "YM=F",
    "nikkei": "^N225",
    "ftse": "^FTSE",
    "dax": "^GDAXI",
    "hangseng": "^HSI",
    "shanghai": "000001.SS",
    "cac40": "^FCHI",
    "eurostoxx": "^STOXX50E",

    // Commodities
    "gold": "GC=F",
    "silver": "SI=F",
    "crude": "CL=F",
    "copper": "HG=F",
    "natgas": "NG=F",
    "wheat": "ZW=F",
    "aluminum": "ALI=F",

    // Crypto
    "bitcoin": "BTC-USD",
    "ethereum": "ETH-USD",
    "solana": "SOL-USD",

    // Macro/Volatility
    "vix": "^VIX",
    "india_vix": "^INDIAVIX",
    "us_10y_yield": "^TNX",
    "move": "^MOVE"
};

// Generic headers to avoid blocking
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'application/json',
};

router.get("/global", async (req, res) => {
    // Return cached data if within TTL
    if (globalCache && (Date.now() - lastFetchTime < CACHE_TTL_MS)) {
        return res.json({ status: "success", cached: true, data: globalCache });
    }

    try {
        const results = {};
        
        const symbolsArray = Object.values(SYMBOL_MAP);
        const sparkResp = [];
        
        // Yahoo limits spark requests to 20 symbols maximum
        for (let i = 0; i < symbolsArray.length; i += 20) {
            const chunk = symbolsArray.slice(i, i + 20);
            const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(chunk.join(","))}&range=1d&interval=1d`;
            try {
                const response = await axios.get(url, { headers, timeout: 8000 });
                if (response.data?.spark?.result) {
                    sparkResp.push(...response.data.spark.result);
                }
            } catch (chunkErr) {
                console.error("Error fetching Yahoo chunk:", chunkErr.message);
            }
        }

        // Map responses back to our internal IDs — extract price + 52-week range for auto-calibration
        for (const [internalId, yahooSymbol] of Object.entries(SYMBOL_MAP)) {
            const dataItem = sparkResp.find(s => s.symbol === yahooSymbol);
            if (dataItem && dataItem.response && dataItem.response[0] && dataItem.response[0].meta) {
                const meta = dataItem.response[0].meta;
                results[internalId] = {
                    value: meta.regularMarketPrice ?? null,
                    hi52:  meta.fiftyTwoWeekHigh  ?? null,
                    lo52:  meta.fiftyTwoWeekLow   ?? null,
                };
            } else {
                results[internalId] = { value: null, hi52: null, lo52: null };
            }
        }

        // Add specific fallbacks for things Yahoo might miss (crypto)
        if (!results["bitcoin"]?.value) {
            try {
                const { data } = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd", { timeout: 3000 });
                if (data.bitcoin?.usd) results["bitcoin"] = { value: data.bitcoin.usd, hi52: null, lo52: null };
                if (data.ethereum?.usd) results["ethereum"] = { value: data.ethereum.usd, hi52: null, lo52: null };
                if (data.solana?.usd)   results["solana"]   = { value: data.solana.usd,   hi52: null, lo52: null };
            } catch(e) {}
        }

        // Fetch FRED Macro Data
        try {
            const gdp = await fredApiService.getGDPGrowth();
            results["gdp"] = { value: gdp, hi52: null, lo52: null };
        } catch(e) {
            console.error("FRED API Error:", e.message);
        }

        // Update Cache
        globalCache = results;
        lastFetchTime = Date.now();

        res.json({ status: "success", cached: false, data: results });
    } catch (error) {
        console.error("Error fetching global data:", error.response?.data || error.message);
        // If it fails, fallback to cache if we have it, even if expired
        if (globalCache) {
            return res.json({ status: "success", cached: "stale", data: globalCache });
        }
        res.status(500).json({ error: "Failed to fetch live macro data" });
    }
});


export default router;
