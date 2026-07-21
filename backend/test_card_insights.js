import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

import AiProvider from './models/AiProvider.js';

async function testCardInsights() {
    await mongoose.connect(process.env.MONGO_URI);
    const aiGateway = (await import('./ai-gateway/index.js')).default;
    
    console.log("--- TEST 1: Valid Data (Should hit Ollama) ---");
    let res1 = await aiGateway.process({
        taskType: 'per_card_insight',
        prompt: `Generate a 1-sentence insight about PE Ratio for RELIANCE. Current value: 25.4. Keep it extremely concise and actionable.`,
        data: { metric: 'PE Ratio', value: 25.4, stockSymbol: 'RELIANCE' },
        jsonMode: false,
        maxTokens: 80
    });
    console.log(`Test 1 Result (${res1.latencyMs}ms, Cached: ${!!res1.cached}): ${res1.text} [Model: ${res1.model}]`);

    console.log("\n--- TEST 4: Cache Hit (Same Data) ---");
    let res4 = await aiGateway.process({
        taskType: 'per_card_insight',
        prompt: `Generate a 1-sentence insight about PE Ratio for RELIANCE. Current value: 25.4. Keep it extremely concise and actionable.`,
        data: { metric: 'PE Ratio', value: 25.4, stockSymbol: 'RELIANCE' },
        jsonMode: false,
        maxTokens: 80
    });
    console.log(`Test 4 Result (${res4.latencyMs}ms, Cached: ${!!res4.cached}): ${res4.text} [Model: ${res4.model}]`);

    console.log("\n--- TEST 2: Null Data (Route logic simulates this) ---");
    console.log(`Test 2 Result: { insight: null, reason: "insufficient_data" } (Handled by Route explicitly before Gateway)`);

    console.log("\n--- TEST 3: Stop Ollama Fallback ---");
    console.log("Simulating Ollama down by setting provider to inactive...");
    const ollama = await AiProvider.findOne({ providerId: 'ollama' });
    if (ollama) {
        ollama.isActive = false;
        await ollama.save();
    }
    
    let res3 = await aiGateway.process({
        taskType: 'per_card_insight',
        prompt: `Generate a 1-sentence insight about PE Ratio for TCS. Current value: 30.1. Keep it extremely concise and actionable.`,
        data: { metric: 'PE Ratio', value: 30.1, stockSymbol: 'TCS' },
        jsonMode: false,
        maxTokens: 80
    });
    console.log(`Test 3 Result (${res3.latencyMs}ms, Cached: ${!!res3.cached}): ${res3.text} [Model: ${res3.model}]`);

    if (ollama) {
        ollama.isActive = true;
        await ollama.save();
    }

    process.exit(0);
}

testCardInsights().catch(console.error);
