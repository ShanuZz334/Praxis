import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const AiProvider = mongoose.connection.db.collection("aiproviders");

    await AiProvider.updateOne(
        { providerId: "groq" },
        { $set: { "models.tier2_medium": "openai/gpt-oss-20b", "models.tier3_complex": "qwen/qwen3.8-27b" } }
    );
    await AiProvider.updateOne(
        { providerId: "openrouter" },
        { $set: { "models.tier2_medium": "z-ai/glm-5.2:free", "models.tier3_complex": "nvidia/nemotron-3-super-120b-a12b:free" } }
    );
    await AiProvider.updateOne(
        { providerId: "openrouter_2" },
        { $set: { "models.tier2_medium": "minimax/minimax-m2.7:free", "models.tier3_complex": "deepseek/deepseek-r1-distill-llama-70b" } }
    );
    console.log("Restored original DB models");
    await mongoose.disconnect();
}
run();
