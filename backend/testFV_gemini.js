import mongoose from 'mongoose';
import { config } from 'dotenv';
import { runFutureVisionPrediction } from './services/futureVisionService.js';
import AiRouting from './models/AiRouting.js';

config();

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");
        
        // Mock routing explicitly to Gemini Pro
        await AiRouting.findOneAndUpdate({ isSingleton: true }, {
            $set: { futureVision: { providerId: 'gemini', modelId: 'gemini-1.5-pro' } }
        }, { upsert: true });

        const payload = "Test payload for context. Just return a neutral prediction.";
        const result = await runFutureVisionPrediction(payload, "NSE_EQ|INE123", 7);
        console.log("Result:", result);
    } catch (err) {
        console.error("ERROR:", err.stack);
    } finally {
        mongoose.disconnect();
    }
}

test();
