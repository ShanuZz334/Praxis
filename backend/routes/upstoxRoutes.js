import express from "express";
import axios from "axios";
import UpstoxAuth from "../models/UpstoxAuth.js";
import MarketTick from "../models/MarketTick.js";
import { getCache, setCache } from "../services/cacheService.js";
import db from "../config/localDb.js";

const router = express.Router();

const UPSTOX_BASE_URL = "https://api.upstox.com/v2";

// @route   GET /api/v1/upstox/login
// @desc    Redirects user to Upstox login page for OAuth 2.0
router.get("/login", (req, res) => {
    const { UPSTOX_API_KEY, UPSTOX_REDIRECT_URI } = process.env;
    
    if (!UPSTOX_API_KEY || !UPSTOX_REDIRECT_URI) {
        return res.status(500).json({ error: "Upstox credentials missing in .env" });
    }

    const authUrl = `${UPSTOX_BASE_URL}/login/authorization/dialog?response_type=code&client_id=${UPSTOX_API_KEY}&redirect_uri=${UPSTOX_REDIRECT_URI}`;
    
    // Redirect the client to Upstox
    res.redirect(authUrl);
});

// @route   GET /api/v1/upstox/callback
// @desc    Callback URL for Upstox OAuth 2.0 flow
router.get("/callback", async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
        return res.status(400).send("Authorization code missing from Upstox callback.");
    }

    const { UPSTOX_API_KEY, UPSTOX_API_SECRET, UPSTOX_REDIRECT_URI } = process.env;

    try {
        // Exchange code for access_token
        const params = new URLSearchParams({
            code: code,
            client_id: UPSTOX_API_KEY,
            client_secret: UPSTOX_API_SECRET,
            redirect_uri: UPSTOX_REDIRECT_URI,
            grant_type: "authorization_code"
        });

        const tokenResponse = await axios.post(`${UPSTOX_BASE_URL}/login/authorization/token`, params.toString(), {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        const { access_token } = tokenResponse.data;

        // Store in DB (we only keep one global token for the platform instance for now)
        await UpstoxAuth.deleteMany({}); // Clear old tokens
        const authRecord = new UpstoxAuth({
            accessToken: access_token,
            authCode: code
        });
        await authRecord.save();

        // Redirect back to frontend
        const frontendUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0] : "http://localhost:5173";
        res.redirect(`${frontendUrl}?upstox_auth=success`);

    } catch (error) {
        console.error("Error exchanging Upstox token:", error?.response?.data || error.message);
        res.status(500).send("Failed to exchange authorization code for access token.");
    }
});

// @route   GET /api/v1/upstox/status
// @desc    Check if the platform has a valid Upstox access token
router.get("/status", async (req, res) => {
    try {
        const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
        if (auth && auth.accessToken) {
            try {
                // Validate token by hitting profile endpoint
                await axios.get(`${UPSTOX_BASE_URL}/user/profile`, {
                    headers: { "Accept": "application/json", "Authorization": `Bearer ${auth.accessToken}` }
                });
                return res.json({ connected: true, lastUpdated: auth.updatedAt });
            } catch (err) {
                // If token is expired or invalid, delete it
                if (err.response && (err.response.status === 401 || err.response.data?.errors?.[0]?.errorCode === 'UDAPI100050')) {
                    await UpstoxAuth.deleteMany({});
                    return res.json({ connected: false });
                }
            }
        }
        res.json({ connected: false });
    } catch (error) {
        console.error("Error fetching Upstox status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route   GET /api/v1/upstox/market-quote
// @desc    Fetch initial market quote for a list of instruments
router.get("/market-quote", async (req, res) => {
    try {
        const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
        if (!auth || !auth.accessToken) {
            return res.status(401).json({ error: "Upstox is not authenticated" });
        }

        const keys = req.query.instruments; // e.g. "NSE_INDEX|Nifty 50,NSE_INDEX|Nifty Bank"
        if (!keys) return res.status(400).json({ error: "No instruments provided" });

        const cacheKey = `quotes_${keys}`;
        const cachedQuotes = getCache(cacheKey);
        if (cachedQuotes) {
            return res.json({ status: "success", data: cachedQuotes, cached: true });
        }

        const url = `${UPSTOX_BASE_URL}/market-quote/quotes?instrument_key=${encodeURIComponent(keys)}`;
        
        const response = await axios.get(url, {
            headers: { "Accept": "application/json", "Authorization": `Bearer ${auth.accessToken}` }
        });

        setCache(cacheKey, response.data?.data, 1); // 1 second TTL

        // Asynchronously save to database
        if (response.data?.data) {
            const ticksToSave = Object.entries(response.data.data).map(([instrumentKey, quote]) => {
                return {
                    timestamp: new Date(),
                    instrument: instrumentKey.replace(':', '|'), // normalize to pipe
                    ltp: quote.last_price,
                    open: quote.ohlc?.open,
                    high: quote.ohlc?.high,
                    low: quote.ohlc?.low,
                    close: quote.ohlc?.close,
                    previousClose: quote.last_price - (quote.net_change || 0),
                    volume: quote.volume,
                    averageTradedPrice: quote.average_price,
                    totalBuyQuantity: quote.total_buy_quantity,
                    totalSellQuantity: quote.total_sell_quantity,
                    openInterest: quote.open_interest,
                    exchangeTimestamp: quote.timestamp ? new Date(quote.timestamp) : new Date()
                };
            });

            // Seed Local SQLite for fast synchronous reads by Technical Engines
            try {
                const insertTick = db.prepare("INSERT INTO market_ticks (instrument_key, ltp, volume, open_interest, timestamp) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)");
                
                const insertQuote = db.prepare(`
                    INSERT INTO quotes (
                        instrument_key, ltp, open, high, low, close, volume, 
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(instrument_key) DO UPDATE SET
                        ltp=excluded.ltp,
                        open=excluded.open,
                        high=excluded.high,
                        low=excluded.low,
                        close=excluded.close,
                        volume=excluded.volume,
                        updated_at=CURRENT_TIMESTAMP
                `);

                const insertManyQuotes = db.transaction((quotesToInsert) => {
                    for (const q of quotesToInsert) {
                        insertTick.run(q.instrument, q.ltp, q.volume || 0, q.openInterest || 0);
                        insertQuote.run(q.instrument, q.ltp, q.open || null, q.high || null, q.low || null, q.close || null, q.volume || 0);
                    }
                });
                insertManyQuotes(ticksToSave);
            } catch (sqliteErr) {
                console.error("Failed to seed SQLite with initial REST data:", sqliteErr.message);
            }

            // Save historical tracking to MongoDB
            MarketTick.insertMany(ticksToSave).catch(err => {
                console.error("Failed to save market ticks to DB:", err.message);
            });
        }

        res.json({ status: "success", data: response.data?.data, cached: false });
    } catch (error) {
        console.error("Error fetching market quote:", error?.response?.data || error.message);
        if (error?.response?.data?.errors?.[0]?.errorCode === 'UDAPI100050' || error?.response?.status === 401) {
            await UpstoxAuth.deleteMany({});
            return res.status(401).json({ error: "Upstox token expired" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route   GET /api/v1/upstox/option-contracts
// @desc    Fetch available expiries for an instrument
router.get("/option-contracts", async (req, res) => {
    try {
        const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
        if (!auth || !auth.accessToken) {
            return res.status(401).json({ error: "Upstox is not authenticated" });
        }

        const instrumentKey = req.query.instrument_key;
        if (!instrumentKey) return res.status(400).json({ error: "instrument_key is required" });

        const url = `${UPSTOX_BASE_URL}/option/contract?instrument_key=${encodeURIComponent(instrumentKey)}`;
        
        const response = await axios.get(url, {
            headers: { "Accept": "application/json", "Authorization": `Bearer ${auth.accessToken}` }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error fetching option contracts:", error?.response?.data || error.message);
        if (error?.response?.data?.errors?.[0]?.errorCode === 'UDAPI100050' || error?.response?.status === 401) {
            await UpstoxAuth.deleteMany({});
            return res.status(401).json({ error: "Upstox token expired" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

import { fetchOptionChain } from "../services/upstoxOptionChain.js";

// @route   GET /api/v1/upstox/option-chain
// @desc    Fetch the full option chain for a given expiry
router.get("/option-chain", async (req, res) => {
    try {
        const { instrument_key, expiry_date } = req.query;
        if (!instrument_key || !expiry_date) {
            return res.status(400).json({ error: "instrument_key and expiry_date are required" });
        }

        const cacheKey = `optionChain_${instrument_key}_${expiry_date}`;
        const cachedChain = getCache(cacheKey);
        if (cachedChain) {
            return res.json({ status: "success", data: cachedChain, cached: true });
        }

        const data = await fetchOptionChain(instrument_key, expiry_date);
        
        setCache(cacheKey, data, 300); // 5 minutes TTL
        
        res.json({ status: "success", data, cached: false });
    } catch (error) {
        console.error("Error fetching option chain:", error?.response?.data || error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route   GET /api/v1/upstox/option-greeks
// @desc    Fetch option greeks for a list of specific instruments using Upstox V3 API
router.get("/option-greeks", async (req, res) => {
    try {
        const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
        if (!auth || !auth.accessToken) {
            return res.status(401).json({ error: "Upstox is not authenticated" });
        }

        const instrumentKeys = req.query.instrument_key; // Comma separated list of exact keys
        if (!instrumentKeys) return res.status(400).json({ error: "instrument_key is required" });

        const encodedKeys = instrumentKeys.split(',').map(k => encodeURIComponent(k)).join(',');
        const url = `https://api.upstox.com/v3/market-quote/option-greek?instrument_key=${encodedKeys}`;
        
        const response = await axios.get(url, {
            headers: { "Accept": "application/json", "Authorization": `Bearer ${auth.accessToken}` }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error fetching option greeks:", error?.response?.data || error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

import { getFundamentals } from "../controllers/fundamentalsController.js";
import { getTechnicalIndicators } from "../controllers/technicalsController.js";

// @route   GET /api/v1/upstox/fundamentals
// @desc    Fetch combined fundamental data (ratios, income, balance sheet, cash flow, holdings) using Upstox V2 API
router.get("/fundamentals", getFundamentals);

// @route   GET /api/v1/upstox/technicals
// @desc    Fetch and calculate technical indicators from Upstox historical OHLC
router.get("/technicals", getTechnicalIndicators);

export default router;
