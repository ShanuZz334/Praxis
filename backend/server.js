import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

// Import all routes
import dashboardRoutes from "./routes/dashboardRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import eventsRoutes from "./routes/eventsRoutes.js";
import foreignMarketRoutes from "./routes/foreignMarketRoutes.js";
import fundamentalsRoutes from "./routes/fundamentalsRoutes.js";
import optionsRoutes from "./routes/optionsRoutes.js";
import pnlRoutes from "./routes/pnlRoutes.js";
import technicalRoutes from "./routes/technicalRoutes.js";
import upstoxRoutes from "./routes/upstoxRoutes.js";

dotenv.config();

const app = express();

// Fix dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// MongoDB Connect
connectDB();

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/events", eventsRoutes);
app.use("/api/v1/foreign", foreignMarketRoutes);
app.use("/api/v1/fundamentals", fundamentalsRoutes);
app.use("/api/v1/options", optionsRoutes);
app.use("/api/v1/pnl", pnlRoutes);
app.use("/api/v1/technical", technicalRoutes);
app.use("/api/v1/upstox", upstoxRoutes);

// Static Uploads Folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
