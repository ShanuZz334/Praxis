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
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// =============================
// Express App Setup
// =============================
const app = express();
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

// =============================
// Static Files
// =============================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =============================
// Server Start
// =============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
