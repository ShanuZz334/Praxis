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

console.log("Testing with token mode:", auth.mode);

// 1. FII / DII
try {
    const fiiRes = await axios.get("https://api.upstox.com/v2/market/fii?interval=1D&data_type=NSE_FO%7CINDEX_FUTURES%2CNSE_FO%7CSTOCK_FUTURES%2CNSE_FO%7CINDEX_OPTIONS%2CNSE_FO%7CSTOCK_OPTIONS%2CNSE_EQ%7CCASH", { headers });
    console.log("✅ FII API:", fiiRes.status, Object.keys(fiiRes.data?.data || {}));
} catch (e) {
    console.log("❌ FII API Error:", e.response?.status, e.response?.data || e.message);
}

// 2. Smartlist Options
try {
    const slRes = await axios.get("https://api.upstox.com/v2/market/smartlist/options?asset_type=INDEX&category=OI_GAINERS&page_number=1&page_size=20", { headers });
    console.log("✅ Smartlist Options:", slRes.status, slRes.data?.data?.smartlist?.length);
} catch (e) {
    console.log("❌ Smartlist Options Error:", e.response?.status, e.response?.data || e.message);
}

// 3. Sector Quotes
try {
    const secRes = await axios.get("https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_INDEX%7CNifty%20Bank%2CNSE_INDEX%7CNifty%20IT", { headers });
    console.log("✅ Sector Quotes:", secRes.status, Object.keys(secRes.data?.data || {}));
} catch (e) {
    console.log("❌ Sector Quotes Error:", e.response?.status, e.response?.data || e.message);
}

// 4. News
try {
    const newsRes = await axios.get("https://api.upstox.com/v2/news?category=market&page_size=10", { headers });
    console.log("✅ News Market:", newsRes.status, newsRes.data);
} catch (e) {
    console.log("❌ News Market Error:", e.response?.status, e.response?.data || e.message);
}

// 5. Option Contracts
try {
    const optRes = await axios.get("https://api.upstox.com/v2/option/contract?instrument_key=NSE_INDEX%7CNifty%2050", { headers });
    console.log("✅ Option Contracts:", optRes.status, optRes.data?.data?.length);
} catch (e) {
    console.log("❌ Option Contracts Error:", e.response?.status, e.response?.data || e.message);
}

// 6. Historical Data (Technical Chart)
try {
    const histRes = await axios.get("https://api.upstox.com/v2/historical-candle/NSE_INDEX%7CNifty%2050/day/2026-08-02/2026-07-01", { headers });
    console.log("✅ Historical Day Candles:", histRes.status, histRes.data?.data?.candles?.length);
} catch (e) {
    console.log("❌ Historical Day Candles Error:", e.response?.status, e.response?.data || e.message);
}

await mongoose.disconnect();
