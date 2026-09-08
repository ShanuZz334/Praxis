import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { runFutureVisionPrediction } from './services/futureVisionService.js';

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const res = await runFutureVisionPrediction("Provide a mock prediction for Reliance for 7 bars. Current price is 1294.", "NSE_EQ|INE002A01018", 7);
        console.log("Prediction output:", JSON.stringify(res, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}
test();
