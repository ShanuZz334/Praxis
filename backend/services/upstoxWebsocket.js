import WebSocket from "ws";
import protobuf from "protobufjs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import UpstoxAuth from "../models/UpstoxAuth.js";
import db from "../config/localDb.js";
import { broadcast } from "./socketBroadcast.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let upstoxWs = null;
let FeedResponse = null;

export const initProtobuf = async () => {
    try {
        const protoPath = path.join(process.cwd(), "config", "MarketDataFeedV3.proto");
        const root = await protobuf.load(protoPath);
        FeedResponse = root.lookupType("com.upstox.marketdatafeederv3udapi.rpc.proto.FeedResponse");
        console.log("✅ Upstox Protobuf loaded successfully");
    } catch (error) {
        console.error("❌ Error loading Upstox Protobuf:", error);
    }
};

const decodeProfobuf = (buffer) => {
    if (!FeedResponse) return null;
    try {
        const decodedMessage = FeedResponse.decode(buffer);
        return FeedResponse.toObject(decodedMessage, {
            longs: String,
            enums: String,
            bytes: String,
        });
    } catch (error) {
        console.error("❌ Protobuf decode error:", error);
        return null;
    }
};

// Prepare the SQLite insert statement once for extreme high-frequency performance
const insertTickStmt = db.prepare(`
    INSERT INTO market_ticks (instrument_key, ltp, volume, open_interest, timestamp) 
    VALUES (?, ?, ?, ?, ?)
`);

const insertQuoteWsStmt = db.prepare(`
    INSERT INTO quotes (
        instrument_key, ltp, close, volume, updated_at
    ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(instrument_key) DO UPDATE SET
        ltp=excluded.ltp,
        close=COALESCE(excluded.close, quotes.close),
        volume=excluded.volume,
        updated_at=CURRENT_TIMESTAMP
`);

let tickBatch = [];
const BATCH_SIZE = 500;

// Cache the latest tick for each instrument to instantly serve new frontend connections
const latestQuotesCache = new Map();
const getQuoteStmt = db.prepare(`SELECT ltp, close as cp, volume FROM quotes WHERE instrument_key = ?`);

export const getLatestQuotes = (keys) => {
    const quotes = [];
    keys.forEach(k => {
        let quote = latestQuotesCache.get(k);
        if (quote) {
            quotes.push(quote);
        } else {
            // Fallback to SQLite so the UI gets baseline data instantly even on backend restart!
            try {
                const row = getQuoteStmt.get(k);
                if (row && row.ltp) {
                    quote = {
                        instrumentKey: k,
                        ltp: row.ltp,
                        cp: row.cp,
                        volume: row.volume
                    };
                    latestQuotesCache.set(k, quote);
                    quotes.push(quote);
                }
            } catch (e) {}
        }
    });
    return quotes;
};

const persistTicksLocally = () => {
    if (tickBatch.length === 0) return;
    
    // Create a transaction to bulk insert
    const insertMany = db.transaction((ticks) => {
        for (const tick of ticks) {
            insertTickStmt.run(tick.instrumentKey, tick.ltp, tick.volume, tick.openInterest, tick.timestamp);
            insertQuoteWsStmt.run(tick.instrumentKey, tick.ltp, tick.cp, tick.volume);
        }
    });

    try {
        insertMany(tickBatch);
        tickBatch = []; // clear the batch
    } catch (error) {
        console.error("❌ Local SQLite Batch Insert Error:", error.message);
    }
};

/**
 * Handle incoming market data from websocket.
 * Decode, broadcast, and persist to SQLite.
 */
const handleMarketData = (dataBuffer) => {
    const decoded = decodeProfobuf(dataBuffer);
    if (!decoded) return;

    if (decoded.type === "market_info") {
        broadcast("marketStatus:update", decoded.marketInfo);
        return;
    }

    if (decoded.type === "live_feed" || decoded.type === "snapshot") {
        if (!decoded.feeds) return;

        const currentTs = parseInt(decoded.currentTs || Date.now());

        // Iterate through all feeds
        for (const [instrumentKey, feedData] of Object.entries(decoded.feeds)) {
            let tickObj = {
                instrumentKey: instrumentKey,
                ltp: null,
                cp: null,
                volume: 0,
                openInterest: 0,
                optionGreeks: null,
                iv: null,
                timestamp: new Date(currentTs).toISOString()
            };

            if (feedData.fullFeed || feedData.ff) {
                const ff = feedData.fullFeed || feedData.ff;
                
                if (ff.indexFF) {
                    tickObj.ltp = ff.indexFF.ltpc?.ltp;
                    tickObj.cp = ff.indexFF.ltpc?.cp;
                } else if (ff.marketFF) {
                    tickObj.ltp = ff.marketFF.ltpc?.ltp;
                    tickObj.cp = ff.marketFF.ltpc?.cp;
                    tickObj.volume = ff.marketFF.vtt || 0;
                    tickObj.openInterest = ff.marketFF.oi || 0;
                    if (ff.marketFF.optionGreeks) {
                        tickObj.optionGreeks = ff.marketFF.optionGreeks;
                        tickObj.iv = ff.marketFF.iv;
                    }
                }
            } else if (feedData.firstLevelWithGreeks) {
                const flwg = feedData.firstLevelWithGreeks;
                tickObj.ltp = flwg.ltpc?.ltp;
                tickObj.cp = flwg.ltpc?.cp;
                tickObj.volume = flwg.vtt || 0;
                tickObj.openInterest = flwg.oi || 0;
                tickObj.optionGreeks = flwg.optionGreeks;
                tickObj.iv = flwg.iv;
            } else if (feedData.ltpc) {
                tickObj.ltp = feedData.ltpc.ltp;
                tickObj.cp = feedData.ltpc.cp;
            }

            if (tickObj.ltp !== null && tickObj.ltp !== undefined) {
                tickBatch.push(tickObj);
            }
            
            // Cache it in memory for instant delivery to new sockets
            // Merge with existing so we don't lose 'cp' if a subsequent tick only has 'ltp'
            const existing = latestQuotesCache.get(instrumentKey) || {};
            if (tickObj.ltp === null || tickObj.ltp === undefined) tickObj.ltp = existing.ltp;
            if (tickObj.cp === null || tickObj.cp === undefined) tickObj.cp = existing.cp;
            latestQuotesCache.set(instrumentKey, tickObj);
            
            // Broadcast if we have LTP OR Option Greeks
            if ((tickObj.ltp !== null && tickObj.ltp !== undefined) || tickObj.optionGreeks) {
                broadcast("market:update", { instrumentKey, data: tickObj });
            }
        }

        // Flush batch if size reached
        if (tickBatch.length >= BATCH_SIZE) {
            persistTicksLocally();
        }

        // Flush batch every second regardless of size to keep UI snappy
        if (!global.tickInterval) {
            global.tickInterval = setInterval(persistTicksLocally, 1000);
        }

        broadcast("upstox-market-data", decoded);
    }
};

import { getNifty50Keys } from "../utils/nifty50.js";

// Queue for subscriptions requested before WS connects
let pendingSubscriptions = new Set([
    "NSE_INDEX|Nifty 50", 
    "NSE_INDEX|Nifty Bank", 
    "NSE_INDEX|India VIX",
    "GLOBAL_INDICATOR|USDINR",
    "GLOBAL_INDICATOR|BZUSD",
    ...getNifty50Keys()
]);

export const connectUpstoxWebsocket = async () => {
    if (!FeedResponse) await initProtobuf();

    try {
        const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
        if (!auth || !auth.accessToken) {
            console.log("⚠️ No Upstox access token found in DB. Please authenticate.");
            return;
        }

        const apiUrl = "https://api.upstox.com/v3/feed/market-data-feed/authorize";
        const authHeaders = {
            "Accept": "application/json",
            "Authorization": `Bearer ${auth.accessToken}`
        };

        const response = await axios.get(apiUrl, { headers: authHeaders });
        const wsUrl = response.data.data.authorized_redirect_uri;
        console.log("Got wsUrl from Upstox:", wsUrl);

        if (!wsUrl) throw new Error("Did not receive a valid WebSocket URL from Upstox.");

        console.log("🔌 Connecting to Upstox Market Data Feed V3...");
        
        if (upstoxWs) {
            upstoxWs.removeAllListeners();
            upstoxWs.close();
        }

        upstoxWs = new WebSocket(wsUrl, {
            followRedirects: true
        });

        upstoxWs.on("open", () => {
            console.log("✅ Connected to Upstox Market Data Feed V3");
            if (pendingSubscriptions.size > 0) {
                const keys = Array.from(pendingSubscriptions);
                subscribeToInstruments(keys, "full");
            }
        });

        upstoxWs.on("message", (data) => {
            handleMarketData(data);
        });

        upstoxWs.on("error", (error) => {
            console.error("❌ Upstox WebSocket Error:", error.message);
        });

        upstoxWs.on("close", (code, reason) => {
            console.log(`❌ Upstox WebSocket Closed: ${code} - ${reason.toString()}`);
            setTimeout(() => connectUpstoxWebsocket(), 5000);
        });

    } catch (error) {
        console.error("❌ Upstox WebSocket Connection Failed:", error?.response?.data || error.message);
    }
};

export const subscribeToInstruments = (instrumentKeys, mode = "full") => {
    // Add to pending subscriptions
    instrumentKeys.forEach(k => pendingSubscriptions.add(k));

    if (!upstoxWs || upstoxWs.readyState !== WebSocket.OPEN) {
        console.warn(`⚠️ Cannot send subscription immediately (WS not open). Queued ${instrumentKeys.length} instruments.`);
        return;
    }

    const request = {
        guid: "praxis_" + Date.now().toString(),
        method: "sub",
        data: {
            mode: mode,
            instrumentKeys: instrumentKeys
        }
    };

    upstoxWs.send(Buffer.from(JSON.stringify(request)));
    console.log(`📡 Sent subscription for ${instrumentKeys.length} instruments [${mode}]`);
};
