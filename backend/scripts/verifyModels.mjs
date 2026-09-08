import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { decrypt } from "../utils/encryption.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const AiProvider = mongoose.connection.db.collection("aiproviders");
    
    // Check Groq
    const groq = await AiProvider.findOne({ providerId: "groq" });
    if (groq && groq.apiKey) {
        const key = decrypt(groq.apiKey);
        console.log("Checking Groq with actual key...");
        const res = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: "Bearer " + key } });
        if (res.ok) {
            const data = await res.json();
            console.log("Groq valid models:", data.data.map(m => m.id).join(", "));
        } else {
            console.log("Groq API Key Error:", await res.text());
        }
    }

    // Check OpenRouter
    const or = await AiProvider.findOne({ providerId: "openrouter" });
    if (or && or.apiKey) {
        console.log("\nChecking OpenRouter free models...");
        const res = await fetch("https://openrouter.ai/api/v1/models");
        if (res.ok) {
            const data = await res.json();
            const freeModels = data.data.filter(m => m.pricing && m.pricing.prompt === "0" && m.pricing.completion === "0").map(m => m.id);
            console.log("Free OpenRouter Deepseek models:", freeModels.filter(m => m.includes("deepseek")).join(", "));
            console.log("Free OpenRouter Llama models:", freeModels.filter(m => m.includes("llama")).join(", "));
            console.log("Is deepseek/deepseek-r1:free available?", freeModels.includes("deepseek/deepseek-r1:free"));
            console.log("Is meta-llama/llama-3.3-70b-instruct:free available?", freeModels.includes("meta-llama/llama-3.3-70b-instruct:free"));
        }
    }

    await mongoose.disconnect();
}
run().catch(console.error);
