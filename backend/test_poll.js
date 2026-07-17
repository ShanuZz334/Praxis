import 'dotenv/config';
import mongoose from 'mongoose';
import { fetchFiiDiiFlow, fetchSmartlist } from './services/upstoxMarketData.js';

async function test() {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI);
    
    try {
        console.log("Fetching FII/DII flow...");
        const flowData = await fetchFiiDiiFlow();
        console.log("FII/DII data keys:", Object.keys(flowData || {}));
        
        console.log("Fetching Smartlists...");
        const [optOiGainers, optIvSurge, futPremium] = await Promise.all([
            fetchSmartlist("INDEX", "OI_GAINER", "options"),
            fetchSmartlist("INDEX", "IV_SURGE", "options"),
            fetchSmartlist("INDEX", "PREMIUM", "futures")
        ]);
        console.log("Smartlists fetched successfully");
    } catch (e) {
        console.error("Test error:", e.message);
    }
    
    process.exit(0);
}

test();
