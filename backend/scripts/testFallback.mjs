import mongoose from "mongoose";
import dotenv from "dotenv";
import { executeWithFallback } from "../ai-gateway/fallbackChain.js";
import { providerCache } from "../ai-gateway/cache/providerCache.js";
import { getRouteForTask } from "../ai-gateway/modelRouter.js";
import * as groq from "../ai-gateway/providers/groqProvider.js";
import * as gemini from "../ai-gateway/providers/geminiProvider.js";
import * as openrouter from "../ai-gateway/providers/openrouterProvider.js";
import * as ollama from "../ai-gateway/providers/ollamaProvider.js";

dotenv.config();

const providers = { groq, gemini, openrouter, openrouter_2: openrouter, ollama };

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("Testing getRouteForTask(level1_fast)...");
    const routePlan = await getRouteForTask('level1_fast', 'alert_context');
    console.log("Route Plan:", routePlan);

    console.log("\nTesting executeWithFallback...");
    const requestConfig = {
        level: 'level1_fast',
        messages: [{ role: 'user', content: 'Say "hello world" in JSON format: {"msg": "hello world"}' }],
        jsonMode: true
    };
    
    const result = await executeWithFallback(routePlan, providers, requestConfig);
    console.log("\nFallback Result:");
    console.log(result.text ? "Success!" : "Failed!");
    console.log(result);

    await mongoose.disconnect();
}
run();
