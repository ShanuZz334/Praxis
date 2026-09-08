import mongoose from "mongoose";
import dotenv from "dotenv";
import { decrypt } from "./ai-gateway/utils/encryption.js";
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const AiProvider = mongoose.connection.db.collection("aiproviders");
    const groq = await AiProvider.findOne({ providerId: "groq" });
    if (groq && groq.apiKey) {
        const key = decrypt(groq.apiKey);
        const res = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: "Bearer " + key } });
        if (res.ok) {
            const data = await res.json();
            console.log("All Groq valid models:", data.data.map(m => m.id).join("\n"));
        } else {
            console.log("Groq API Key Error:", await res.text());
        }
    }
    await mongoose.disconnect();
}
run();
