import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import mongoose from "mongoose";
import UpstoxAuth from "./models/UpstoxAuth.js";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, ".env") });

await mongoose.connect(process.env.MONGO_URI);
const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
const token = auth.accessToken;
const headers = { "Accept": "application/json", "Authorization": `Bearer ${token}` };

// Test with valid equity keys (e.g. Reliance NSE_EQ|INE002A01018, HDFC NSE_EQ|INE040A01034, etc.)
const testKeys = ["NSE_EQ|INE002A01018", "NSE_EQ|INE040A01034", "NSE_EQ|INE009A01021"];
try {
    const url = `https://api.upstox.com/v2/news?category=instrument_keys&instrument_keys=${encodeURIComponent(testKeys.join(','))}&page_size=20`;
    const res = await axios.get(url, { headers });
    console.log("✅ News with equity instrument_keys: SUCCESS! Count =", Object.keys(res.data?.data || {}).length);
    console.log("Sample:", JSON.stringify(res.data?.data).substring(0, 300));
} catch (e) {
    console.log("❌ News with equity keys error:", e.response?.status, e.response?.data || e.message);
}

await mongoose.disconnect();
