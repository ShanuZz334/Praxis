/**
 * @file server.js
 * @purpose Main entry point for the Stocky backend API server.
 * @responsibilities
 * - Initializes Express application with middleware (CORS, JSON parsing).
 * - Connects to MongoDB database.
 * - Registers API routes for authentication, user management, and broker integration.
 * - Serves static uploads folder.
 * - Starts HTTP server on configured port.
 * @key_exports
 * - Express app instance (implicit via app.listen)
 * @dependencies
 * - express - Web framework
 * - cors - Cross-origin resource sharing
 * - dotenv - Environment variables
 * - ./config/db.js - MongoDB connection
 * - ./routes/* - API route handlers
 * @lifecycle
 * - Entry point: node server.js or npm start
 * - Connects to MongoDB on startup
 * - Listens on PORT from env or 5000
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================

import "dotenv/config";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import { checkConnection } from "./config/postgres.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chartRoutes from "./routes/chartRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import optionsRoutes from "./routes/optionsRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import collectorRoutes from "./routes/collectorRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import oauthRoutes from "./routes/oauthRoutes.js";


// =============================
// Express App Setup
// =============================

const app = express();
app.set("trust proxy", 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Enable pre-flight for all routes
app.options(/.*/, cors());

app.use(express.json());

// =============================
// Database Connection
// =============================

connectDB();
checkConnection();

// =============================
// Routes
// =============================

app.get("/", (req, res) => {
    res.send("Stocky API v2.0 is running...");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/charts", chartRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/options", optionsRoutes);
app.use("/api/v1/journal", journalRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/collect", collectorRoutes);
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/oauth", oauthRoutes);



// =============================
// Static Files
// =============================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =============================
// Server Start
// =============================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
