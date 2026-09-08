import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const schema = new mongoose.Schema({}, { strict: false });
const AiProvider = mongoose.model("AiProvider", schema, "aiproviders");

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected\n");

    const g2 = await AiProvider.findOneAndUpdate(
        { providerId: "groq", "models.tier2_medium": "openai/gpt-oss-20b" },
        { $set: { "models.tier2_medium": "llama-3.1-8b-instant" } },
        { new: true }
    );
    console.log("groq tier2:", g2 ? "openai/gpt-oss-20b -> llama-3.1-8b-instant OK" : "no match");

    const g3 = await AiProvider.findOneAndUpdate(
        { providerId: "groq", "models.tier3_complex": "qwen/qwen3.8-27b" },
        { $set: { "models.tier3_complex": "llama-3.3-70b-versatile" } },
        { new: true }
    );
    console.log("groq tier3:", g3 ? "qwen/qwen3.8-27b -> llama-3.3-70b-versatile OK" : "no match");

    const o1 = await AiProvider.findOneAndUpdate(
        { providerId: "openrouter", "models.tier3_complex": "nvidia/nemotron-3-super-120b-a12b:free" },
        { $set: { "models.tier3_complex": "deepseek/deepseek-r1:free" } },
        { new: true }
    );
    console.log("openrouter tier3:", o1 ? "nemotron -> deepseek/deepseek-r1:free OK" : "no match");

    const all = await AiProvider.find({}).lean();
    console.log("\n--- Final state ---");
    all.forEach(function(p) {
        var t2 = p.models && p.models.tier2_medium ? p.models.tier2_medium : "-";
        var t3 = p.models && p.models.tier3_complex ? p.models.tier3_complex : "-";
        console.log(p.providerId + " [" + (p.isActive ? "ON" : "OFF") + "] t2=" + t2 + " t3=" + t3);
    });

    await mongoose.disconnect();
    console.log("\nDone");
}

run().catch(function(e) { console.error(e.message); process.exit(1); });
