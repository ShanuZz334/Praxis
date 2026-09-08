import { semanticCache } from "../ai-gateway/cache/semanticCache.js";
import { responseCache } from "../ai-gateway/cache/responseCache.js";
import { providerCache } from "../ai-gateway/cache/providerCache.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("--- Testing Provider Cache (Thundering Herd Memoize) ---");
    // Trigger 5 concurrent refreshes
    const p1 = providerCache.getProviders();
    const p2 = providerCache.getProviders();
    const p3 = providerCache.getProviders();
    await Promise.all([p1, p2, p3]);
    console.log("SUCCESS: 3 concurrent requests completed. If you saw only ONE 'Refreshed provider cache' log, the lock works.");

    console.log("\n--- Testing Response Cache (Stable Hashing) ---");
    const req1 = { taskType: "test", prompt: "Hello", data: { a: 1, b: 2 } };
    const req2 = { taskType: "test", prompt: "Hello", data: { b: 2, a: 1 } };
    
    responseCache.set(req1, { result: "Success" });
    const hit = responseCache.get(req2);
    if (hit) {
        console.log("SUCCESS: Response cache hashing is stable. Key order did not matter.");
    } else {
        console.log("FAILED: Hashing is still unstable.");
    }

    await mongoose.disconnect();
}
run();
