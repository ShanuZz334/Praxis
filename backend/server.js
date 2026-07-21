/**
 * @file server.js
 * @purpose Main entry point for the Praxis backend API server.
 * @date 2026-07-11
 */

// =============================
// dotenv MUST be first — explicit path so it works from any CWD
// =============================
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, ".env") });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// =============================
// Imports
// =============================
import express from "express"; // trigger restart
import dotenv from "dotenv";
import cors from "cors";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import upstoxRoutes from "./routes/upstoxRoutes.js";
import snapshotRoutes from "./routes/snapshotRoutes.js";
import intelligenceRoutes from "./routes/intelligenceRoutes.js";
import flowRoutes from "./routes/flowRoutes.js";
import catalystRoutes from "./routes/catalystRoutes.js";
import aiSettingsRoutes from "./routes/aiSettingsRoutes.js";
import aiPromptsRoutes from "./routes/aiPromptsRoutes.js";

// =============================
// Express App Setup
// =============================
import { initLocalDb } from "./config/localDb.js";
import connectDB from "./config/db.js";

const app = express();

// Initialize Local SQLite
initLocalDb();

app.set("trust proxy", 1);

// =============================
// Middleware
// =============================
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.CLIENT_URL
            ? process.env.CLIENT_URL.split(",").map(url => url.trim())
            : ["*"];
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-signup-token"]
}));

app.options(/.*/, cors());
app.use(express.json());

// =============================
// Database Connection
// =============================
connectDB();

// =============================
// Routes
// =============================
app.get("/", (req, res) => {
    res.send("Praxis API v1.0 is running...");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/upstox", upstoxRoutes);
app.use("/api/v1/snapshots", snapshotRoutes);
app.use("/api/v1/intelligence", intelligenceRoutes);
app.use("/api/v1/catalysts", catalystRoutes);
app.use("/api/v1/ai-settings", aiSettingsRoutes);
app.use("/api/v1/ai-prompts", aiPromptsRoutes);

app.use("/api/flow", flowRoutes);

// =============================
// Static Files
// =============================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =============================
// Socket.io & Server Start
// =============================
import { createServer } from "http";
import { Server } from "socket.io";
import { connectUpstoxWebsocket } from "./services/upstoxWebsocket.js";
import { startMarketDataPolling, cachedFlowData, cachedSmartlists, cachedSectors, cachedNews } from "./services/upstoxMarketData.js";
import { initSocketBroadcaster } from "./services/socketBroadcast.js";
import { initInstrumentCron } from "./services/upstoxInstrument.js";
import { initIntelligenceCrons } from "./services/intelligenceCron.js";

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(url => url.trim()) : ["*"],
        methods: ["GET", "POST"]
    }
});

// Initialize centralized socket broadcaster
initSocketBroadcaster(io);

// Initialize daily cron jobs
initInstrumentCron();
initIntelligenceCrons();

io.on("connection", (socket) => {
    console.log(`🔌 Client connected to Socket.io: ${socket.id}`);
    
    socket.on("subscribe:instruments", async ({ keys, mode }) => {
        if (keys && keys.length > 0) {
            const { subscribeToInstruments, getLatestQuotes } = await import("./services/upstoxWebsocket.js");
            
            // 1. Immediately send down any cached data we have for these keys so the UI populates instantly
            const cachedQuotes = getLatestQuotes(keys);
            const validKeys = new Set();
            
            if (cachedQuotes.length > 0) {
                // Send it to this specific socket
                cachedQuotes.forEach(quote => {
                    socket.emit("market:update", { instrumentKey: quote.instrumentKey, data: quote });
                    if (quote.cp != null) validKeys.add(quote.instrumentKey);
                });
            }

            // 2. Add them to the upstream subscription
            subscribeToInstruments(keys, mode || "full");

            // 3. For any keys that don't have a valid close price (cp) yet, fetch them via REST API
            const keysToFetch = keys.filter(k => !validKeys.has(k));
            if (keysToFetch.length > 0) {
                const { fetchQuotes } = await import("./services/upstoxQuote.js");
                fetchQuotes(keysToFetch).then(async quotesData => {
                    const { broadcast } = await import("./services/socketBroadcast.js");
                    for (const [k, q] of Object.entries(quotesData)) {
                        const payload = {
                            instrumentKey: k,
                            ltp: q.last_price,
                            cp: q.ohlc?.close,
                            volume: q.volume
                        };
                        // Broadcast globally so all sockets get the true close price
                        broadcast("market:update", { instrumentKey: k, data: payload });
                        
                        // We also directly update the SQLite cache by virtue of fetchQuotes() already doing it,
                        // so future getLatestQuotes() will load it natively.
                    }
                }).catch(console.error);
            }
        }
    });
    
    // Hydrate frontend with cached data immediately upon connection
    if (cachedFlowData) {
        socket.emit("market:fiidii", cachedFlowData);
    }
    if (cachedSmartlists) {
        socket.emit("market:smartlists", cachedSmartlists);
    }
    if (cachedSectors) {
        socket.emit("market:sectors", cachedSectors);
    }
    if (cachedNews) {
        socket.emit("market:news", cachedNews);
    }
    
    socket.on("request:hydration", () => {
        if (cachedFlowData) socket.emit("market:fiidii", cachedFlowData);
        if (cachedSmartlists) socket.emit("market:smartlists", cachedSmartlists);
        if (cachedSectors) socket.emit("market:sectors", cachedSectors);
        if (cachedNews) socket.emit("market:news", cachedNews);
    });

    socket.on("disconnect", () => {
        console.log(`🔌 Client disconnected from Socket.io: ${socket.id}`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    // Start the Upstox Market Data Feed V3 service
    connectUpstoxWebsocket().catch(e => console.error(e));
    // Start periodic polling for FII/DII and Smartlists to broadcast over socket
    startMarketDataPolling();
});
