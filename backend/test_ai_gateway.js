import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

import aiGateway from './ai-gateway/index.js';

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Test");

    console.log("\n=== Testing Tier 1 Task (First Call - Potential Cold Start) ===");
    const res1 = await aiGateway.process({
        taskType: 'per_card_insight',
        prompt: 'Generate a 1-sentence insight about a P/E ratio of 25 when the sector average is 15.',
        data: { currentPE: 25, sectorPE: 15 },
        jsonMode: true,
        schema: { "insight": "string" }
    });
    console.log({ provider: res1.provider, model: res1.model, latency: res1.latencyMs });

    console.log("\n=== Testing Tier 1 Task (Second Call - Should be warm) ===");
    const res2 = await aiGateway.process({
        taskType: 'per_card_insight',
        prompt: 'Generate a 1-sentence insight about a P/E ratio of 10 when the sector average is 18.',
        data: { currentPE: 10, sectorPE: 18 },
        jsonMode: true,
        schema: { "insight": "string" }
    });
    console.log({ provider: res2.provider, model: res2.model, latency: res2.latencyMs });

    console.log("\n=== Testing Tier 3 Task (First Call - Potential Cold Start) ===");
    const res3 = await aiGateway.process({
        taskType: 'stock_narrative',
        prompt: 'Generate a short stock narrative based on these metrics.',
        data: { revenueGrowth: 25, margins: "expanding" },
        jsonMode: false
    });
    console.log({ provider: res3.provider, model: res3.model, latency: res3.latencyMs });

    console.log("\n=== Testing Tier 3 Task (Second Call - Should be warm) ===");
    const res4 = await aiGateway.process({
        taskType: 'stock_narrative',
        prompt: 'Generate another short stock narrative based on new metrics.',
        data: { revenueGrowth: 15, margins: "contracting" },
        jsonMode: false
    });
    console.log({ provider: res4.provider, model: res4.model, latency: res4.latencyMs });

    process.exit(0);
}

test().catch(console.error);
