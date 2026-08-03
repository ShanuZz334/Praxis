import 'dotenv/config';
import axios from "axios";
import UpstoxAuth from "./models/UpstoxAuth.js";
import mongoose from "mongoose";

const UPSTOX_BASE_URL = "https://api.upstox.com/v2";

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const auth = await UpstoxAuth.findOne({ mode: 'live' }).sort({ createdAt: -1 });
    if (!auth) return console.log("No auth");

    const url = `${UPSTOX_BASE_URL}/option/chain?instrument_key=NSE_INDEX%7CNifty%2050&expiry_date=2026-08-06`;
    try {
        const response = await axios.get(url, {
            headers: { "Accept": "application/json", "Authorization": `Bearer ${auth.accessToken}` }
        });
        const chainData = response.data?.data || [];
        if (chainData.length > 0) {
            console.log("MARKET DATA CE:", JSON.stringify(chainData[Math.floor(chainData.length/2)].call_options.market_data, null, 2));
        }
    } catch (e) {
        console.error(e.response?.data || e.message);
    }
    process.exit(0);
}

run();
