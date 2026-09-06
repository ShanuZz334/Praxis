import express from "express";
import axios from "axios";
import { yahooFinanceService } from "../services/yahooFinanceService.js";
import { fredApiService } from "../services/fredApiService.js";
import db from "../config/localDb.js";

const router = express.Router();

// Prepared statements for global_cache persistence
const upsertGlobal = db.prepare(`
    INSERT INTO global_cache (symbol_id, value, hi_52, lo_52, pct_change, source, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(symbol_id) DO UPDATE SET
        value = excluded.value, hi_52 = excluded.hi_52, lo_52 = excluded.lo_52,
        pct_change = excluded.pct_change, source = excluded.source, fetched_at = CURRENT_TIMESTAMP
`);
const getAllGlobal = db.prepare(`SELECT symbol_id, value, hi_52, lo_52, pct_change FROM global_cache`);

// Memory Cache (still used for intra-request speed)
let globalCache = null;
let lastFetchTime = 0;

// Seed memory cache from SQLite on startup so data is available immediately
try {
    const rows = getAllGlobal.all();
    if (rows.length > 0) {
        globalCache = {};
        for (const row of rows) {
            globalCache[row.symbol_id] = { value: row.value, hi52: row.hi_52, lo52: row.lo_52, pctChange: row.pct_change };
        }
        console.log(`✅ Global cache seeded from SQLite (${rows.length} symbols)`);
    }
} catch (e) {
    console.warn("⚠️ Could not seed global cache from SQLite:", e.message);
}
const CACHE_TTL_MS = 1 * 60 * 1000; // 1 minute
const STALE_FALLBACK_MS = 24 * 60 * 60 * 1000; // 24 hours — serve stale rather than failing


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

    // If stale but within 24h, serve it while we try fresh fetch in background
    const isStaleButUsable = globalCache && (Date.now() - lastFetchTime < STALE_FALLBACK_MS);

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
                const prev = meta.chartPreviousClose || meta.previousClose || null;
                const curr = meta.regularMarketPrice ?? null;
                const pctChange = (prev && curr && prev > 0) ? parseFloat(((curr - prev) / prev * 100).toFixed(3)) : null;
                results[internalId] = {
                    value: curr,
                    hi52:  meta.fiftyTwoWeekHigh  ?? null,
                    lo52:  meta.fiftyTwoWeekLow   ?? null,
                    pctChange
                };
            } else {
                results[internalId] = { value: null, hi52: null, lo52: null, pctChange: null };
            }
        }

        // Add specific fallbacks for things Yahoo might miss (crypto)
        if (!results["bitcoin"]?.value) {
            try {
                const { data } = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true", { timeout: 3000 });
                if (data.bitcoin?.usd) results["bitcoin"] = { value: data.bitcoin.usd, hi52: null, lo52: null, pctChange: data.bitcoin.usd_24h_change ?? null };
                if (data.ethereum?.usd) results["ethereum"] = { value: data.ethereum.usd, hi52: null, lo52: null, pctChange: data.ethereum.usd_24h_change ?? null };
                if (data.solana?.usd)   results["solana"]   = { value: data.solana.usd, hi52: null, lo52: null, pctChange: data.solana.usd_24h_change ?? null };
            } catch(e) {}
        }

        // Fetch FRED Macro Data
        try {
            const gdp = await fredApiService.getGDPGrowth();
            results["gdp"] = { value: gdp, hi52: null, lo52: null, pctChange: null };
        } catch(e) {
            console.error("FRED API Error:", e.message);
        }

        // Update Memory Cache
        globalCache = results;
        lastFetchTime = Date.now();

        // Persist to SQLite so data survives backend restarts
        try {
            const persistAll = db.transaction((data) => {
                for (const [symbolId, item] of Object.entries(data)) {
                    if (item.value !== null && item.value !== undefined) {
                        upsertGlobal.run(symbolId, item.value, item.hi52 ?? null, item.lo52 ?? null, item.pctChange ?? null, "yahoo");
                    }
                }
            });
            persistAll(results);
        } catch (e) {
            console.warn("⚠️ Could not persist global cache to SQLite:", e.message);
        }

        res.json({ status: "success", cached: false, data: results });
    } catch (error) {
        console.error("Error fetching global data:", error.response?.data || error.message);
        // Serve stale data (in-memory or SQLite) instead of 500
        if (globalCache) {
            return res.json({ status: "success", cached: "stale", data: globalCache });
        }
        res.status(500).json({ error: "Failed to fetch live macro data" });
    }
});


export default router;

