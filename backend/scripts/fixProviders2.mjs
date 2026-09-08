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

    // Fix openrouter_2 tier3: deepseek-r1-distill-llama-70b (paid) -> deepseek/deepseek-r1:free
    const o2 = await AiProvider.findOneAndUpdate(
        { providerId: "openrouter_2", "models.tier3_complex": "deepseek/deepseek-r1-distill-llama-70b" },
        { $set: { "models.tier3_complex": "meta-llama/llama-3.3-70b-instruct:free" } },
        { new: true }
    );
    console.log("openrouter_2 tier3:", o2 ? "deepseek-r1-distill-llama-70b -> meta-llama/llama-3.3-70b-instruct:free OK" : "no match");

    // Fix groq tier3: llama-3.3-70b-versatile returning 404 -> try llama-3.1-70b-versatile
    // llama-3.1-8b-instant works (confirmed by PAI chat), so also set tier2 as safe fallback
    // Use mixtral-8x7b-32768 which is stable and definitely supports JSON mode
    const g3 = await AiProvider.findOneAndUpdate(
        { providerId: "groq", "models.tier3_complex": "llama-3.3-70b-versatile" },
        { $set: { "models.tier3_complex": "llama-3.1-70b-versatile" } },
        { new: true }
    );
    console.log("groq tier3:", g3 ? "llama-3.3-70b-versatile -> llama-3.1-70b-versatile OK" : "no match");

    // Print final state
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
