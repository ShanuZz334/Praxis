import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

function decrypt(encryptedText) {
    if (!encryptedText) return null;
    const parts = encryptedText.split(":");
    if (parts.length !== 2) return encryptedText; // not encrypted
    const iv = Buffer.from(parts[0], "hex");
    const encryptedTextBuffer = Buffer.from(parts[1], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(process.env.ENCRYPTION_SECRET, "hex"), iv);
    let decrypted = decipher.update(encryptedTextBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const AiProvider = mongoose.connection.db.collection("aiproviders");
    
    const groq = await AiProvider.findOne({ providerId: "groq" });
    if (groq && groq.apiKey) {
        const key = decrypt(groq.apiKey);
        console.log("Checking Groq models...");
        const res = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: "Bearer " + key } });
        if (res.ok) {
            const data = await res.json();
            console.log(data.data.map(m => m.id).filter(m => m.includes("llama")).join(", "));
        } else {
            console.log("Groq Error", await res.text());
        }
    }

    const or = await AiProvider.findOne({ providerId: "openrouter" });
    if (or && or.apiKey) {
        const key = decrypt(or.apiKey);
        console.log("\nChecking OpenRouter free models...");
        const res = await fetch("https://openrouter.ai/api/v1/models");
        if (res.ok) {
            const data = await res.json();
            const freeModels = data.data.filter(m => m.pricing && m.pricing.prompt === "0" && m.pricing.completion === "0").map(m => m.id);
            console.log("Free Deepseek models:", freeModels.filter(m => m.includes("deepseek")).join(", "));
            console.log("Free Llama models:", freeModels.filter(m => m.includes("llama")).join(", "));
        }
    }
    await mongoose.disconnect();
}
run().catch(console.error);
