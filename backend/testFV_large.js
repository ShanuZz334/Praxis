import mongoose from 'mongoose';
import { config } from 'dotenv';
import { runFutureVisionPrediction } from './services/futureVisionService.js';

config();

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");
        
        // Build a HUGE dummy payload similar to the real one
        let payload = "Context:\n";
        for(let i=0; i<100; i++) {
            payload += `Date: 2026-09-0${i}, Open: 100, High: 105, Low: 95, Close: 102, Volume: 123456\n`;
        }
        payload += "Indicators: RSI=55, MACD=1.2, Supertrend=Bullish\n";
        payload += "Fundamentals: PE=20, PB=3\n";
        
        console.log("Payload length:", payload.length);
        const result = await runFutureVisionPrediction(payload, "NSE_EQ|INE123", 7);
        console.log("Result:", result);
    } catch (err) {
        console.error("ERROR:", err.stack);
    } finally {
        mongoose.disconnect();
    }
}

test();
