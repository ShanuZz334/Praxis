import express from "express";
import { NseIndia } from "stock-nse-india";
import db from "../config/localDb.js";

const router = express.Router();
const nse = new NseIndia();

const BREADTH_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

// Prepared statements for SQLite breadth persistence
const upsertBreadthSql = db.prepare(`
    INSERT INTO market_broadcast_cache (cache_key, payload_json, fetched_at)
    VALUES ('breadth', ?, CURRENT_TIMESTAMP)
    ON CONFLICT(cache_key) DO UPDATE SET payload_json = excluded.payload_json, fetched_at = CURRENT_TIMESTAMP
`);
const getBreadthSql = db.prepare(`SELECT payload_json, fetched_at FROM market_broadcast_cache WHERE cache_key = 'breadth'`);

// Seed in-memory cache from SQLite on startup — zero-restart-flash
let breadthCache = null;
let lastBreadthFetchTime = 0;

try {
    const row = getBreadthSql.get();
    if (row && row.payload_json) {
        breadthCache = JSON.parse(row.payload_json);
        lastBreadthFetchTime = new Date(row.fetched_at).getTime();
        console.log("✅ Market breadth cache seeded from SQLite");
    }
} catch (e) {
    console.warn("⚠️ Could not seed breadth cache from SQLite:", e.message);
}

router.get("/breadth", async (req, res) => {
    // Serve from memory cache if within TTL
    if (breadthCache && (Date.now() - lastBreadthFetchTime < BREADTH_CACHE_TTL_MS)) {
        return res.json({ status: "success", cached: true, data: breadthCache });
    }

    try {
        const [indices, highs, lows] = await Promise.all([
            nse.getAllIndices().catch(() => null),
            nse.getDataByEndpoint('/api/live-analysis-52Week?index=high').catch(() => null),
            nse.getDataByEndpoint('/api/live-analysis-52Week?index=low').catch(() => null)
        ]);

        let advances = 0;
        let declines = 0;

        if (indices && indices.data) {
            const n500 = indices.data.find(d => d.indexSymbol === 'NIFTY 500');
            if (n500) {
                advances = parseInt(n500.advances) || 0;
                declines = parseInt(n500.declines) || 0;
            } else {
                const n50 = indices.data.find(d => d.indexSymbol === 'NIFTY 50');
                if (n50) {
                    advances = parseInt(n50.advances) || 0;
                    declines = parseInt(n50.declines) || 0;
                }
            }
        }

        let newHighs = 0;
        let newLows = 0;

        if (highs) {
            newHighs = (highs.dataLtpGreater20?.length || 0) + (highs.dataLtpLess20?.length || 0);
        }
        if (lows) {
            newLows = (lows.dataLtpGreater20?.length || 0) + (lows.dataLtpLess20?.length || 0);
        }

        const freshData = {
            advances,
            declines,
            netAdvances: advances - declines,
            breadthRatio: declines > 0 ? (advances / declines) : null,
            newHighs,
            newLows,
            nhnlRatio: newLows > 0 ? (newHighs / newLows) : null
        };

        // Update memory cache
        breadthCache = freshData;
        lastBreadthFetchTime = Date.now();

        // Persist to SQLite (survives server restarts)
        try { upsertBreadthSql.run(JSON.stringify(freshData)); } catch (dbErr) {
            console.warn("⚠️ Could not persist breadth cache to SQLite:", dbErr.message);
        }

        res.json({ status: "success", cached: false, data: freshData });
    } catch (e) {
        console.error("Failed to fetch market breadth:", e.message);

        // Stale fallback — return whatever we have (in-memory or SQLite)
        if (breadthCache) {
            return res.json({ status: "success", cached: "stale", data: breadthCache });
        }
        try {
            const row = getBreadthSql.get();
            if (row && row.payload_json) {
                return res.json({ status: "success", cached: "stale_db", data: JSON.parse(row.payload_json) });
            }
        } catch (dbErr) {}

        res.status(500).json({ status: "error", message: e.message });
    }
});

export default router;
