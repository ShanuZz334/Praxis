import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import mongoose from "mongoose";
import UpstoxAuth from "./models/UpstoxAuth.js";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, ".env") });

console.log("Connecting to MongoDB:", process.env.MONGO_URI ? "URI exists" : "NO URI");

try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected successfully!");

    const auths = await UpstoxAuth.find().sort({ createdAt: -1 });
    console.log("UpstoxAuth records found:", auths.length);
    auths.forEach((a, idx) => {
        console.log(`[${idx}] Mode: ${a.mode}, Created: ${a.createdAt}, Updated: ${a.updatedAt}, TokenPrefix: ${a.accessToken ? a.accessToken.substring(0, 15) + '...' : 'none'}`);
    });

    if (auths.length > 0) {
        const latest = auths[0];
        console.log(`\nTesting Latest Auth (mode: ${latest.mode}):`);

        // Test 1: Market Quotes (Live API)
        try {
            const qRes = await axios.get("https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_INDEX%7CNifty%2050", {
                headers: { "Accept": "application/json", "Authorization": `Bearer ${latest.accessToken}` }
            });
            console.log("✅ Quotes API Test: SUCCESS! Nifty 50 LTP =", qRes.data?.data?.['NSE_INDEX:Nifty 50']?.last_price);
        } catch (qErr) {
            console.log("❌ Quotes API Test: FAILED!", qErr.response?.status, qErr.response?.data || qErr.message);
        }

        // Test 2: WS Feed Auth (Live API)
        try {
            const wsAuthRes = await axios.get("https://api.upstox.com/v3/feed/market-data-feed/authorize", {
                headers: { "Accept": "application/json", "Authorization": `Bearer ${latest.accessToken}` }
            });
            console.log("✅ WebSocket Auth Test: SUCCESS! Redirect URI =", wsAuthRes.data?.data?.authorized_redirect_uri?.substring(0, 30));
        } catch (wsErr) {
            console.log("❌ WebSocket Auth Test: FAILED!", wsErr.response?.status, wsErr.response?.data || wsErr.message);
        }

        // Test 3: Sandbox Orders if mode is sandbox
        if (latest.mode === 'sandbox') {
            try {
                const sOrders = await axios.get("https://api-sandbox.upstox.com/v2/order/trades/get-trades-for-day", {
                    headers: { "Accept": "application/json", "Authorization": `Bearer ${latest.accessToken}` }
                });
                console.log("✅ Sandbox Orders Test: SUCCESS!", sOrders.data);
            } catch (sErr) {
                console.log("❌ Sandbox Orders Test:", sErr.response?.status, sErr.response?.data || sErr.message);
            }
        }
    }

    await mongoose.disconnect();
} catch (e) {
    console.error("Diagnostic failed:", e.message);
}
