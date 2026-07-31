import express from "express";
import db from "../config/localDb.js";
import { fetchMarketHolidays, fetchTodayTrades } from "../services/upstoxTradeService.js";

const router = express.Router();

/**
 * GET /api/v1/journal/holidays?year=2026
 * Fetches market holidays.
 */
router.get("/holidays", async (req, res) => {
    try {
        const holidays = await fetchMarketHolidays();
        res.json({ status: "success", data: holidays });
    } catch (error) {
        console.error("Error fetching holidays:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch holidays" });
    }
});

/**
 * GET /api/v1/journal/notes?date=YYYY-MM-DD
 * Fetch journal notes for a specific date.
 */
router.get("/notes", (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: "Date parameter is required" });

        const stmt = db.prepare(`SELECT * FROM journal_notes WHERE date = ?`);
        const note = stmt.get(date);

        if (note) {
            res.json({ status: "success", data: note });
        } else {
            res.json({ status: "success", data: null });
        }
    } catch (error) {
        console.error("Error fetching journal note:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch journal note" });
    }
});

/**
 * POST /api/v1/journal/notes
 * Create or update journal notes for a specific date.
 */
router.post("/notes", (req, res) => {
    try {
        const { date, premarket, inmarket, postmarket, lessons, mood, tags, compliance_score, ai_insights, images } = req.body;
        
        if (!date) return res.status(400).json({ error: "Date is required in body" });

        const stmt = db.prepare(`
            INSERT INTO journal_notes (date, premarket, inmarket, postmarket, lessons, mood, tags, compliance_score, ai_insights, images)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
                premarket=excluded.premarket,
                inmarket=excluded.inmarket,
                postmarket=excluded.postmarket,
                lessons=excluded.lessons,
                mood=excluded.mood,
                tags=excluded.tags,
                compliance_score=excluded.compliance_score,
                ai_insights=excluded.ai_insights,
                images=excluded.images,
                updated_at=CURRENT_TIMESTAMP
        `);

        stmt.run(
            date, 
            premarket || '', 
            inmarket || '', 
            postmarket || '', 
            lessons || '', 
            mood || '', 
            tags || '[]', 
            compliance_score || '', 
            ai_insights || '', 
            images || '[]'
        );

        res.json({ status: "success", message: "Journal saved successfully" });
    } catch (error) {
        console.error("Error saving journal note:", error);
        res.status(500).json({ status: "error", message: "Failed to save journal note" });
    }
});

/**
 * GET /api/v1/journal/trades?date=YYYY-MM-DD
 * Fetch executed trades for a specific date from local DB.
 */
router.get("/trades", (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: "Date parameter is required" });

        const stmt = db.prepare(`SELECT * FROM trade_history WHERE date = ?`);
        const trades = stmt.all(date);

        res.json({ status: "success", data: trades });
    } catch (error) {
        console.error("Error fetching trades:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch trades" });
    }
});

/**
 * GET /api/v1/journal/summary?year=YYYY
 * Fetch per-day P&L summary for the calendar map, filtered by year.
 */
router.get("/summary", (req, res) => {
    try {
        const year = req.query.year || new Date().getFullYear();
        const stmt = db.prepare(`
            SELECT 
                date, 
                SUM(pnl)   AS pnl, 
                COUNT(*)   AS tradesCount 
            FROM trade_history 
            WHERE date LIKE ?
            GROUP BY date
            ORDER BY date ASC
        `);
        const summaries = stmt.all(`${year}%`);
        res.json({ status: "success", data: summaries });
    } catch (error) {
        console.error("Error fetching summary:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch summary" });
    }
});

/**
 * GET /api/v1/journal/stats?year=YYYY
 * Institutional-grade aggregate statistics for the header KPI cards.
 * Computed directly in SQL for maximum accuracy.
 */
router.get("/stats", (req, res) => {
    try {
        const year = req.query.year || new Date().getFullYear();
        
        // Per-day aggregates — the foundational data
        const daysStmt = db.prepare(`
            SELECT 
                date,
                SUM(pnl)   AS dayPnl,
                COUNT(*)   AS dayTrades
            FROM trade_history
            WHERE date LIKE ?
            GROUP BY date
            ORDER BY date ASC
        `);
        const days = daysStmt.all(`${year}%`);

        // Early return if no data
        if (!days.length) {
            return res.json({ status: "success", data: { hasData: false, days: [] } });
        }

        // Institutional scalar aggregates via SQL
        const aggStmt = db.prepare(`
            SELECT
                SUM(pnl)                                           AS netPnl,
                COUNT(DISTINCT date)                               AS activeDays,
                COUNT(*)                                           AS totalTrades,
                SUM(CASE WHEN pnl > 0 THEN pnl   ELSE 0 END)      AS grossProfit,
                SUM(CASE WHEN pnl < 0 THEN ABS(pnl) ELSE 0 END)   AS grossLoss,
                MAX(pnl)                                           AS maxTradePnl,
                MIN(pnl)                                           AS minTradePnl,
                AVG(CASE WHEN pnl > 0 THEN pnl   ELSE NULL END)    AS avgWinTrade,
                AVG(CASE WHEN pnl < 0 THEN ABS(pnl) ELSE NULL END) AS avgLossTrade,
                COUNT(CASE WHEN pnl > 0 THEN 1 END)                AS winTrades,
                COUNT(CASE WHEN pnl < 0 THEN 1 END)                AS lossTrades
            FROM trade_history
            WHERE date LIKE ?
        `);
        const agg = aggStmt.get(`${year}%`);

        res.json({ 
            status: "success", 
            data: { 
                hasData: true, 
                agg, 
                days 
            } 
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch stats" });
    }
});

/**
 * POST /api/v1/journal/sync-trades
 * Triggers a manual sync of today's trades from Upstox API.
 */
router.post("/sync-trades", async (req, res) => {
    try {
        const trades = await fetchTodayTrades();
        res.json({ status: "success", message: `Synced ${trades.length} trades for today` });
    } catch (error) {
        console.error("Error syncing trades:", error);
        res.status(500).json({ status: "error", message: "Failed to sync trades" });
    }
});

export default router;
