import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
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
import userRoutes from "./routes/userRoutes.js";
import brokerRoutes from "./routes/brokerRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

const app = express();

// Fix dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
// Middleware
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.CLIENT_URL
            ? process.env.CLIENT_URL.split(",").map(url => url.trim())
            : ["*"];

        // Allow requests with no origin (like mobile apps or curl requests)
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

// MongoDB Connect
connectDB().then(() => {
    // Verify SMTP Connection on Startup
    import("./utils/mailer.js").then(({ mailer }) => {
        mailer.verify((error, success) => {
            if (error) {
                console.error("❌ SMTP Connection Error:", error);
            } else {
                console.log("✅ SMTP Configuration Verified - Ready to send emails");
            }
        });
    });
});

// Health Check Route
app.get("/", (req, res) => {
    res.send("Stocky API v2.0 is running...");
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/events", eventsRoutes);
app.use("/api/v1/foreign", foreignMarketRoutes);
app.use("/api/v1/fundamentals", fundamentalsRoutes);
app.use("/api/v1/options", optionsRoutes);
app.use("/api/v1/pnl", pnlRoutes);
app.use("/api/v1/technical", technicalRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/broker", brokerRoutes);
app.use("/api/v1/journal", journalRoutes);
app.use("/api/v1/messages", messageRoutes);

// Static Uploads Folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
