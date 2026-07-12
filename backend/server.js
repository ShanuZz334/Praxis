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
            const { subscribeToInstruments } = await import("./services/upstoxWebsocket.js");
            subscribeToInstruments(keys, mode || "full");
        }
    });
    
    socket.on("disconnect", () => {
        console.log(`🔌 Client disconnected from Socket.io: ${socket.id}`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    // Start the Upstox Market Data Feed V3 service
    connectUpstoxWebsocket();
});
