import mongoose from "mongoose";
import dotenv from "dotenv";
import { decrypt } from "./ai-gateway/utils/encryption.js";
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const AiProvider = mongoose.connection.db.collection("aiproviders");
    const providers = await AiProvider.find({}).toArray();
    for (const p of providers) {
        if (p.apiKey) {
            try {
                const key = decrypt(p.apiKey);
                console.log(p.providerId, "Key decrypted successfully (length " + key.length + ")");
            } catch (e) {
                console.log(p.providerId, "Key decryption FAILED:", e.message);
            }
        } else {
            console.log(p.providerId, "No API key configured");
        }
    }

    console.log("\nChecking Groq with actual key...");
    const groq = providers.find(p => p.providerId === "groq");
    if (groq && groq.apiKey) {
        const key = decrypt(groq.apiKey);
        const res = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: "Bearer " + key } });
        if (res.ok) {
            const data = await res.json();
            console.log("Groq valid models:", data.data.map(m => m.id).filter(m => m.includes("llama")).join(", "));
        } else {
            console.log("Groq API Key Error:", await res.text());
        }
    }

    console.log("\nChecking OpenRouter with actual key...");
    const or = providers.find(p => p.providerId === "openrouter");
    if (or && or.apiKey) {
        const key = decrypt(or.apiKey);
        const res = await fetch("https://openrouter.ai/api/v1/models", { headers: { Authorization: "Bearer " + key } });
        if (res.ok) {
            const data = await res.json();
            const freeModels = data.data.filter(m => m.pricing && m.pricing.prompt === "0" && m.pricing.completion === "0").map(m => m.id);
            console.log("Free OpenRouter Deepseek models:", freeModels.filter(m => m.includes("deepseek")).join(", "));
        } else {
            console.log("OpenRouter API Key Error:", await res.text());
        }
    }

    await mongoose.disconnect();
}
run();
