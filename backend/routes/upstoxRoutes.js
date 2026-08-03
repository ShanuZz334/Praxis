import express from "express";
import axios from "axios";
import UpstoxAuth from "../models/UpstoxAuth.js";
import MarketTick from "../models/MarketTick.js";
import { getCache, setCache } from "../services/cacheService.js";
import db from "../config/localDb.js";
import { getUpstoxLiveToken, getUpstoxAuthForMode } from "../utils/upstoxAuthHelper.js";

const router = express.Router();

const UPSTOX_BASE_URL = "https://api.upstox.com/v2";

// Helper to get correct base URL
const getUpstoxBaseUrl = (mode) => {
    return mode === 'sandbox' ? "https://api-sandbox.upstox.com/v2" : "https://api.upstox.com/v2";
};

// @route   GET /api/v1/upstox/login
// @desc    Redirects user to Upstox login page for OAuth 2.0 (or bypasses for Sandbox)
router.get("/login", async (req, res) => {
    const mode = req.query.mode === 'sandbox' ? 'sandbox' : 'live';
    
    // Sandbox Bypass: If a static Sandbox Access Token is provided in .env, skip OAuth entirely
    if (mode === 'sandbox' && process.env.UPSTOX_SANDBOX_ACCESS_TOKEN) {
        try {
            await UpstoxAuth.deleteMany({ mode: 'sandbox' });
            const authRecord = new UpstoxAuth({
                accessToken: process.env.UPSTOX_SANDBOX_ACCESS_TOKEN,
                authCode: 'STATIC_SANDBOX_TOKEN',
                mode: 'sandbox'
            });
            await authRecord.save();
            
            const frontendUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0] : "http://localhost:5173";
            return res.redirect(`${frontendUrl}/dashboard/admin?upstox_auth=success&mode=sandbox`);
        } catch (err) {
            console.error("Failed to save static sandbox token:", err);
            return res.status(500).json({ error: "Failed to save sandbox token" });
        }
    }

    const apiKey = mode === 'sandbox' ? process.env.UPSTOX_SANDBOX_API_KEY : process.env.UPSTOX_API_KEY;
    const redirectUri = process.env.UPSTOX_REDIRECT_URI;
    
    if (!apiKey || !redirectUri) {
        return res.status(500).json({ error: `Upstox ${mode} credentials missing in .env` });
    }

    const baseUrl = getUpstoxBaseUrl(mode);
    // Pass mode in the state parameter so we know which keys to use in the callback
    const authUrl = `${baseUrl}/login/authorization/dialog?response_type=code&client_id=${apiKey}&redirect_uri=${redirectUri}&state=${mode}`;
    
    // Redirect the client to Upstox
    res.redirect(authUrl);
});

import { connectUpstoxWebsocket } from "../services/upstoxWebsocket.js";
import { forceMarketDataPoll } from "../services/upstoxMarketData.js";

// @route   GET /api/v1/upstox/instrument/:key
// @desc    Get instrument details from local DB (including lot_size)
router.get("/instrument/:key", async (req, res) => {
    try {
        const { key } = req.params;
        const result = db.prepare("SELECT * FROM instruments WHERE instrument_key = ?").get(key);
        if (result) {
            return res.json({ status: "success", data: result });
        } else {
            return res.status(404).json({ error: "Instrument not found" });
        }
    } catch (err) {
        console.error("Error fetching instrument:", err);
        return res.status(500).json({ error: err.message });
    }
});

// @route   GET /api/v1/upstox/callback
// @desc    Callback URL for Upstox OAuth 2.0 flow
router.get("/callback", async (req, res) => {
    const { code, state } = req.query;
    const mode = state === 'sandbox' ? 'sandbox' : 'live';
    
    if (!code) {
        return res.status(400).send("Authorization code missing from Upstox callback.");
    }

    const apiKey = mode === 'sandbox' ? process.env.UPSTOX_SANDBOX_API_KEY : process.env.UPSTOX_API_KEY;
    const apiSecret = mode === 'sandbox' ? process.env.UPSTOX_SANDBOX_API_SECRET : process.env.UPSTOX_API_SECRET;
    const redirectUri = process.env.UPSTOX_REDIRECT_URI;
    const baseUrl = getUpstoxBaseUrl(mode);

    try {
        // Exchange code for access_token
        const params = new URLSearchParams({
            code: code,
            client_id: apiKey,
            client_secret: apiSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code"
        });

        const tokenResponse = await axios.post(`${baseUrl}/login/authorization/token`, params.toString(), {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        const { access_token } = tokenResponse.data;

        // Delete old token for THIS mode and save the new one
        await UpstoxAuth.deleteMany({ mode }); 
        const authRecord = new UpstoxAuth({
            accessToken: access_token,
            authCode: code,
            mode: mode
        });
        await authRecord.save();

        // If we just connected Live mode, instantly reconnect websockets
        if (mode === 'live') {
            try {
                connectUpstoxWebsocket();
                forceMarketDataPoll();
            } catch (wsErr) {
                console.error("Failed to re-initialize websocket or polling after login", wsErr);
            }
        }

        // Redirect back to frontend
        const frontendUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0] : "http://localhost:5173";
        res.redirect(`${frontendUrl}/dashboard/admin?upstox_auth=success&mode=${mode}`);

    } catch (error) {
        console.error("Error exchanging Upstox token:", error?.response?.data || error.message);
        res.status(500).send("Failed to exchange authorization code for access token.");
    }
});

// @route   GET /api/v1/upstox/status
// @desc    Check if the platform has a valid Upstox access token
router.get("/status", async (req, res) => {
    try {
        const liveAuth = await UpstoxAuth.findOne({ mode: 'live' }).sort({ createdAt: -1 });
        const sandboxAuth = await UpstoxAuth.findOne({ mode: 'sandbox' }).sort({ createdAt: -1 });

        let isLiveValid = false;
        if (liveAuth && liveAuth.accessToken) {
            try {
                await axios.get("https://api.upstox.com/v2/user/profile", {
                    headers: { "Accept": "application/json", "Authorization": `Bearer ${liveAuth.accessToken}` }
                });
                isLiveValid = true;
            } catch (err) {
                if (err.response && (err.response.status === 401 || err.response.data?.errors?.[0]?.errorCode === 'UDAPI100050')) {
                    await UpstoxAuth.deleteOne({ _id: liveAuth._id });
                }
            }
        }

        const isSandboxValid = Boolean(sandboxAuth && sandboxAuth.accessToken);

        if (isLiveValid || isSandboxValid) {
            let activeAuth;
            if (isLiveValid && isSandboxValid) {
                activeAuth = liveAuth.updatedAt > sandboxAuth.updatedAt ? liveAuth : sandboxAuth;
            } else {
                activeAuth = isLiveValid ? liveAuth : sandboxAuth;
            }
            
            return res.json({ 
                connected: true, 
                liveConnected: isLiveValid,
                sandboxConnected: isSandboxValid,
                lastUpdated: activeAuth.updatedAt, 
                mode: activeAuth.mode 
            });
        }

        res.json({ connected: false, liveConnected: false, sandboxConnected: false });
    } catch (error) {
        console.error("Error fetching Upstox status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route   GET /api/v1/upstox/news
// @desc    Fetch news for given instrument keys
router.get("/news", async (req, res) => {
    try {
        const { keys } = req.query;
        if (!keys) return res.status(400).json({ error: "Missing keys parameter" });

        let token;
        try {
            token = await getUpstoxLiveToken();
        } catch (e) {
            return res.status(401).json({ error: "Upstox not authenticated" });
        }

        const url = `${UPSTOX_BASE_URL}/news?category=instrument_keys&instrument_keys=${encodeURIComponent(keys)}`;
        const response = await axios.get(url, {
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error fetching Upstox news:", error?.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch news" });
    }
});

// @route   GET /api/v1/upstox/market-quote
// @desc    Fetch initial market quote for a list of instruments
router.get("/market-quote", async (req, res) => {
    try {
        let token;
        try {
            token = await getUpstoxLiveToken();
        } catch (e) {
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
            headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
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

        let responseData = response.data?.data || {};

        // SQLite Fallback for missing keys (e.g. market closed)
        try {
            const keysArray = keys.split(',');
            const missingKeys = keysArray.filter(k => !responseData[k]);
            
            if (missingKeys.length > 0) {
                const placeholders = missingKeys.map(() => '?').join(',');
                const fallbackQuotes = db.prepare(`SELECT * FROM quotes WHERE instrument_key IN (${placeholders})`).all(...missingKeys);
                
                fallbackQuotes.forEach(row => {
                    responseData[row.instrument_key] = {
                        instrument_token: row.instrument_key,
                        last_price: row.ltp,
                        net_change: row.ltp - (row.close || row.ltp),
                        ohlc: {
                            open: row.open,
                            high: row.high,
                            low: row.low,
                            close: row.close
                        },
                        volume: row.volume,
                        timestamp: row.updated_at
                    };
                });
            }
        } catch (fbErr) {
            console.error("SQLite fallback failed:", fbErr.message);
        }

        res.json({ status: "success", data: responseData, cached: false });
    } catch (error) {
        console.error("Error fetching market quote:", error?.response?.data || error.message);
        const isAuthError = error?.response?.data?.errors?.[0]?.errorCode === 'UDAPI100050' || error?.response?.status === 401;

        if (isAuthError) {
            await UpstoxAuth.deleteMany({});
            // Don't return 401 immediately; try fallback first.
        }
        
        // Full SQLite Fallback on API Error
        try {
            const keysArray = req.query.instruments ? req.query.instruments.split(',') : [];
            if (keysArray.length > 0) {
                const placeholders = keysArray.map(() => '?').join(',');
                const fallbackQuotes = db.prepare(`SELECT * FROM quotes WHERE instrument_key IN (${placeholders})`).all(...keysArray);
                
                if (fallbackQuotes.length > 0) {
                    const responseData = {};
                    fallbackQuotes.forEach(row => {
                        responseData[row.instrument_key] = {
                            instrument_token: row.instrument_key,
                            last_price: row.ltp,
                            net_change: row.ltp - (row.close || row.ltp),
                            ohlc: {
                                open: row.open,
                                high: row.high,
                                low: row.low,
                                close: row.close
                            },
                            volume: row.volume,
                            timestamp: row.updated_at
                        };
                    });
                    return res.json({ status: "success", data: responseData, cached: false, fallback: true });
                }
            }
        } catch (fbErr) {
             console.error("Full SQLite fallback failed:", fbErr.message);
        }

        if (isAuthError) {
            return res.status(401).json({ error: "Upstox token expired" });
        }
        res.status(500).json({ 
            error: "Upstox API returned an error and no local fallback data was available.", 
            details: error?.response?.data || error.message 
        });
    }
});

// @route   GET /api/v1/upstox/option-contracts
// @desc    Fetch available expiries for an instrument
router.get("/option-contracts", async (req, res) => {
    try {
        let token;
        try {
            token = await getUpstoxLiveToken();
        } catch (e) {
            return res.status(401).json({ error: "Upstox is not authenticated" });
        }

        const instrumentKey = req.query.instrument_key;
        if (!instrumentKey) return res.status(400).json({ error: "instrument_key is required" });

        const url = `${UPSTOX_BASE_URL}/option/contract?instrument_key=${encodeURIComponent(instrumentKey)}`;
        
        const response = await axios.get(url, {
            headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
        });

        // --- SQLITE DB WRITE ---
        try {
            db.prepare(`
                INSERT INTO options_data (instrument_key, raw_json, updated_at) 
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(instrument_key) DO UPDATE SET 
                    raw_json=excluded.raw_json, 
                    updated_at=CURRENT_TIMESTAMP
            `).run(`contracts_${instrumentKey}`, JSON.stringify(response.data));
        } catch (dbErr) {
            console.error("Failed to save option contracts to SQLite:", dbErr.message);
        }

        res.json(response.data);
    } catch (error) {
        console.error("Error fetching option contracts:", error?.response?.data || error.message);
        
        // --- SQLITE FALLBACK ---
        try {
            const instrumentKey = req.query.instrument_key;
            const row = db.prepare("SELECT raw_json FROM options_data WHERE instrument_key = ?").get(`contracts_${instrumentKey}`);
            if (row && row.raw_json) {
                console.log(`Using SQLite Fallback for option contracts: ${instrumentKey}`);
                const payload = JSON.parse(row.raw_json);
                return res.json(payload);
            }
        } catch (dbErr) {
            console.error("SQLite Fallback failed for option contracts:", dbErr.message);
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

        // --- SQLITE DB WRITE ---
        try {
            db.prepare(`
                INSERT INTO options_data (instrument_key, raw_json, updated_at) 
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(instrument_key) DO UPDATE SET 
                    raw_json=excluded.raw_json, 
                    updated_at=CURRENT_TIMESTAMP
            `).run(`chain_${instrument_key}_${expiry_date}`, JSON.stringify(data));
        } catch (dbErr) {
            console.error("Failed to save option chain to SQLite:", dbErr.message);
        }
        
        res.json({ status: "success", data, cached: false });
    } catch (error) {
        console.error("Error fetching option chain:", error?.response?.data || error.message);

        // --- SQLITE FALLBACK ---
        try {
            const { instrument_key, expiry_date } = req.query;
            const row = db.prepare("SELECT raw_json FROM options_data WHERE instrument_key = ?").get(`chain_${instrument_key}_${expiry_date}`);
            if (row && row.raw_json) {
                console.log(`Using SQLite Fallback for option chain: ${instrument_key} @ ${expiry_date}`);
                const payload = JSON.parse(row.raw_json);
                return res.json({ status: "success", data: payload, cached: false, fallback: true });
            }
        } catch (dbErr) {
            console.error("SQLite Fallback failed for option chain:", dbErr.message);
        }

        res.status(500).json({ error: "Internal server error" });
    }
});

// @route   GET /api/v1/upstox/option-greeks
// @desc    Fetch option greeks for a list of specific instruments using Upstox V3 API
router.get("/option-greeks", async (req, res) => {
    try {
        let token;
        try {
            token = await getUpstoxLiveToken();
        } catch (e) {
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
import { getTechnicalIndicators, getCandles } from "../controllers/technicalsController.js";
import { fetchFiiDiiFlow } from "../services/upstoxMarketData.js";
import { getBackfillStatus } from "../services/backfillEngine.js";

// @route   GET /api/v1/upstox/inst-flow
// @desc    Fetch FII/DII net flow from Upstox API
router.get("/inst-flow", async (req, res) => {
    try {
        const data = await fetchFiiDiiFlow();
        res.json({ status: "success", data });
    } catch (error) {
        console.error("Error fetching inst flow:", error?.response?.data || error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route   GET /api/v1/upstox/fundamentals
// @desc    Fetch combined fundamental data (ratios, income, balance sheet, cash flow, holdings) using Upstox V2 API
router.get("/fundamentals", getFundamentals);

// @route   GET /api/v1/upstox/technicals
// @desc    Fetch and calculate technical indicators from Upstox historical OHLC
router.get("/technicals", getTechnicalIndicators);

// @route   GET /api/v1/upstox/candles
// @desc    Fetch historical raw candlestick data from Upstox (via SQLite cache)
router.get("/candles", getCandles);

// @route   GET /api/v1/upstox/candles/backfill-status
// @desc    Returns current backfill progress for a given instrument+timeframe
router.get("/candles/backfill-status", (req, res) => {
    try {
        const { instrument, timeframe = 'day' } = req.query;
        if (!instrument) return res.status(400).json({ success: false, error: "instrument is required" });
        const status = getBackfillStatus(instrument, timeframe);
        res.json({ success: true, ...status });
    } catch (err) {
        console.error("Backfill status error:", err.message);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});

export default router;
