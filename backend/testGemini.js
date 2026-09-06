import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "c:/project/ALLBACKUP/Praxis/backend/.env" });
import * as gemini from "./ai-gateway/providers/geminiProvider.js";

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const res = await gemini.call({
            model: "gemini-3.5-flash",
            messages: [{ role: "user", content: "Hello, reply with exactly the word OK" }],
            jsonMode: false,
            maxTokens: 50,
            temperature: 0.1
        });
        console.log("SUCCESS:", res.text);
    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        process.exit(0);
    }
}
run();
