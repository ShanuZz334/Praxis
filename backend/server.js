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
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import brokerRoutes from "./routes/brokerRoutes.js";

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
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-signup-token"]
}));

app.use(express.json());

// =============================
// Database Connection
// =============================

connectDB();

// =============================
// Routes
// =============================

app.get("/", (req, res) => {
    res.send("Stocky API v2.0 is running...");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/broker", brokerRoutes);

// =============================
// Static Files
// =============================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =============================
// Server Start
// =============================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
