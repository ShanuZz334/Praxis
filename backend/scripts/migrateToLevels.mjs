import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const AiProvider = mongoose.connection.db.collection("aiproviders");

    const providers = await AiProvider.find({}).toArray();
    for (let p of providers) {
        let newModels = {
            level1_fast: "",
            level2_standard: "",
            level3_advanced: "",
            level4_expert: "",
            level5_reasoner: "",
            level6_vision: "",
            level7_audio: ""
        };

        if (p.providerId === "groq") {
            newModels.level2_standard = "openai/gpt-oss-20b";
            newModels.level3_advanced = "qwen/qwen3.8-27b";
            newModels.level4_expert = "openai/gpt-oss-120b";
            newModels.level5_reasoner = "groq/compound";
            newModels.level7_audio = "whisper-large-v3-turbo";
        } else if (p.providerId === "openrouter") {
            newModels.level2_standard = "z-ai/glm-5.2:free";
            newModels.level3_advanced = "cohere/north-mini-code:free";
            newModels.level4_expert = "nvidia/nemotron-3-super-120b-a12b:free";
        } else if (p.providerId === "openrouter_2") {
            newModels.level2_standard = "minimax/minimax-m2.7:free";
            newModels.level3_advanced = "deepseek/deepseek-r1-distill-llama-70b";
            newModels.level5_reasoner = "deepseek/deepseek-r1-distill-llama-70b";
        } else if (p.providerId === "gemini") {
            newModels.level1_fast = "gemini-3.5-flash";
            newModels.level6_vision = "gemini-3.5-flash";
        } else if (p.providerId === "ollama") {
            newModels.level1_fast = "qwen2.5:3b";
            newModels.level2_standard = "qwen2.5:7b";
        }

        // Apply migration
        await AiProvider.updateOne({ _id: p._id }, { $set: { models: newModels, supportedLevels: Object.keys(newModels).filter(k => newModels[k] !== "") } });
        await AiProvider.updateOne({ _id: p._id }, { $unset: { supportedTiers: "" } });
        console.log(`Migrated ${p.providerId} to 7 levels.`);
    }

    // Also migrate AiRouting if it explicitly sets tier models. We will just clear them so they fall back to Auto
    const AiRouting = mongoose.connection.db.collection("airoutings");
    await AiRouting.updateMany({}, { $set: { 
        "cardInsight.modelId": "",
        "headerInsight.modelId": "",
        "pageInsight.modelId": "",
        "manualChat.modelId": "",
        "futureVision.modelId": ""
    } });
    
    console.log("Migration complete!");
    await mongoose.disconnect();
}
run();
