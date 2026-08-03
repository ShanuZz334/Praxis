/**
 * @file portfolioRoutes.js
 * @purpose Exposes Upstox portfolio data (funds, holdings, positions, order/trade book).
 * @routes
 * - GET /api/v1/portfolio/funds       → Upstox /v2/user/fund-and-margin
 * - GET /api/v1/portfolio/holdings    → Upstox /v2/portfolio/long-term-holdings (+ SQLite sync)
 * - GET /api/v1/portfolio/positions   → Upstox /v2/portfolio/short-term-positions (+ SQLite fallback)
 * - GET /api/v1/portfolio/order-book  → Upstox /v2/order/retrieve-all
 * - GET /api/v1/portfolio/trade-book  → Upstox /v2/order/trades/get-trades-for-day
 */

import express from "express";
import axios from "axios";
import db from "../config/localDb.js";
import { getUpstoxAuthForMode } from "../utils/upstoxAuthHelper.js";
import { syncHoldings } from "../services/upstoxPortfolio.js";

import UpstoxAuth from "../models/UpstoxAuth.js";

const router = express.Router();
const UPSTOX_V2 = "https://api.upstox.com/v2";

/** Helper — determines active mode and returns headers and baseUrl */
const getActiveHeaders = async () => {
    const liveAuth = await UpstoxAuth.findOne({ mode: 'live' }).sort({ createdAt: -1 });
    const sandboxAuth = await UpstoxAuth.findOne({ mode: 'sandbox' }).sort({ createdAt: -1 });
    
    let activeAuth = liveAuth;
    if (liveAuth && sandboxAuth) {
        activeAuth = liveAuth.updatedAt > sandboxAuth.updatedAt ? liveAuth : sandboxAuth;
    } else if (sandboxAuth && !liveAuth) {
        activeAuth = sandboxAuth;
    }
    
    if (!activeAuth?.accessToken) throw new Error("Upstox token not available");
    
    return {
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${activeAuth.accessToken}`
        },
        baseUrl: activeAuth.mode === 'sandbox' ? "https://api-sandbox.upstox.com/v2" : "https://api.upstox.com/v2"
    };
};

// ─── GET /api/v1/portfolio/funds ─────────────────────────────────────────────
router.get("/funds", async (req, res) => {
    try {
        const { headers, baseUrl } = await getActiveHeaders();
        const { data } = await axios.get(`${baseUrl}/user/fund-and-margin`, { headers });
        res.json({ success: true, data: data?.data || {} });
    } catch (err) {
        console.error("[Portfolio/funds]", err.response?.data || err.message);
        res.status(200).json({ success: false, data: {}, message: err.message });
    }
});

// ─── GET /api/v1/portfolio/holdings ──────────────────────────────────────────
router.get("/holdings", async (req, res) => {
    try {
        // Sync fresh data from Upstox into SQLite, then serve from SQLite
        await syncHoldings();
        const rows = db.prepare("SELECT * FROM holdings ORDER BY pnl DESC").all();
        res.json({ success: true, data: rows, stale: false });
    } catch (err) {
        console.error("[Portfolio/holdings] Upstox fetch failed, using SQLite cache:", err.message);
        try {
            const rows = db.prepare("SELECT * FROM holdings ORDER BY pnl DESC").all();
            res.json({ success: true, data: rows, stale: true });
        } catch (dbErr) {
            res.status(200).json({ success: false, data: [], message: dbErr.message });
        }
    }
});

// ─── GET /api/v1/portfolio/positions ─────────────────────────────────────────
router.get("/positions", async (req, res) => {
    try {
        const { headers, baseUrl } = await getActiveHeaders();
        const { data } = await axios.get(`${baseUrl}/portfolio/short-term-positions`, { headers });
        const positions = data?.data || [];
        res.json({ success: true, data: positions, stale: false });
    } catch (err) {
        console.error("[Portfolio/positions] Upstox fetch failed, using SQLite cache:", err.message);
        try {
            const rows = db.prepare("SELECT * FROM positions ORDER BY unrealized_pnl DESC").all();
            res.json({ success: true, data: rows, stale: true });
        } catch (dbErr) {
            res.status(200).json({ success: false, data: [], message: dbErr.message });
        }
    }
});

// ─── GET /api/v1/portfolio/order-book ────────────────────────────────────────
router.get("/order-book", async (req, res) => {
    try {
        const { headers, baseUrl } = await getActiveHeaders();
        
        const regularPromise = axios.get(`${baseUrl}/order/retrieve-all`, { headers }).catch(e => ({ data: { data: [] } }));
        
        const v3BaseUrl = baseUrl.replace('/v2', '/v3');
        const getV3 = axios.get(`${v3BaseUrl}/order/gtt`, { headers }).catch(e => {
            console.error("[GTT Fetch Error]", e.response?.data || e.message);
            return { data: { data: [] } };
        });
        
        const [regularRes, gttRes] = await Promise.all([regularPromise, getV3]);
        
        const regularOrders = regularRes.data?.data || [];
        const gttOrdersRaw = gttRes.data?.data || [];
        
        const gttOrders = gttOrdersRaw.map(g => ({
            ...g,
            order_id: g.gtt_order_id,
            order_type: "GTT",
            price: g.rules?.[0]?.trigger_price || 0,
            transaction_type: g.rules?.[0]?.transaction_type || "",
            status: g.rules?.[0]?.status || g.status || "",
            created_at: g.created_at || g.updated_at
        }));
        
        const allOrders = [...regularOrders, ...gttOrders].sort((a, b) => {
            const timeA = new Date(a.created_at || a.exchange_timestamp || 0).getTime();
            const timeB = new Date(b.created_at || b.exchange_timestamp || 0).getTime();
            return timeB - timeA;
        });

        res.json({ success: true, data: allOrders });
    } catch (err) {
        console.error("[Portfolio/order-book]", err.response?.data || err.message);
        res.status(200).json({ success: false, data: [], message: err.message });
    }
});

// ─── GET /api/v1/portfolio/trade-book ────────────────────────────────────────
router.get("/trade-book", async (req, res) => {
    try {
        const { headers, baseUrl } = await getActiveHeaders();
        const { data } = await axios.get(`${baseUrl}/order/trades/get-trades-for-day`, { headers });
        res.json({ success: true, data: data?.data || [] });
    } catch (err) {
        console.error("[Portfolio/trade-book] Upstox failed, falling back to journal:", err.message);
        try {
            const today = new Date().toISOString().split('T')[0];
            const rows = db.prepare(
                "SELECT * FROM trade_history WHERE date = ? ORDER BY exchange_timestamp DESC"
            ).all(today);
            res.json({ success: true, data: rows, stale: true });
        } catch (dbErr) {
            res.status(200).json({ success: false, data: [], message: dbErr.message });
        }
    }
});

export default router;
