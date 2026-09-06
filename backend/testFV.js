import mongoose from 'mongoose';
import { config } from 'dotenv';
import { runFutureVisionPrediction } from './services/futureVisionService.js';

config();

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");
        
        const payload = "Test payload for context";
        const result = await runFutureVisionPrediction(payload, "NSE_EQ|INE123", 7);
        console.log("Result:", result);
    } catch (err) {
        console.error("ERROR:", err.stack);
    } finally {
        mongoose.disconnect();
    }
}

test();
