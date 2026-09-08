import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import AiProvider from './models/AiProvider.js';

async function fix() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Primary OpenRouter - The Heavyweights & Finance Specialists
    await AiProvider.updateOne(
        { providerId: 'openrouter' },
        { $set: { 
            "models.level1_fast": "nvidia/nemotron-3.5-lightning:free",
            "models.level2_standard": "google/gemma-4-31b-it:free",
            "models.level3_advanced": "inclusionai/ling-3.0-flash-fin:free", // Finance MoE
            "models.level4_expert": "poolside/laguna-s-2.1:free", // Top-tier coding/agentic
            "models.level5_reasoner": "nvidia/nemotron-3-ultra-550b-a55b:free", // 550B Titan
            "models.level6_vision": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", // Video/Audio/Image omni
            "models.level7_audio": "deepgram/flux-tts:free"
        }}
    );

    // Secondary OpenRouter2 - The Nex AGI & Nemotron Super Fallbacks
    await AiProvider.updateOne(
        { providerId: 'openrouter_2' },
        { $set: {
            "models.level1_fast": "nex-agi/nex-n2.5-mini:free",
            "models.level2_standard": "google/gemma-4-26b-a4b-it:free",
            "models.level3_advanced": "inclusionai/ling-3.0-flash-fin:free", // Keep finance for advanced
            "models.level4_expert": "nex-agi/nex-n2.5-pro:free", // Strong verified-outcome agent
            "models.level5_reasoner": "nvidia/nemotron-3-super-120b-a12b:free", // 120B reasoning
            "models.level6_vision": "google/gemma-4-31b-it:free", // Gemma 4 handles vision well
            "models.level7_audio": "fish-audio/s2.1-pro-free:free"
        }}
    );

    console.log("Maximizing OpenRouter model roster across both providers!");
    process.exit(0);
}
fix();
