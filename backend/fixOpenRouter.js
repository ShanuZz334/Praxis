import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import AiProvider from './models/AiProvider.js';

async function fix() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // OpenRouter has completely removed Gemini and DeepSeek from the free tier.
    // Setting to the actual currently verified zero-cost models on OpenRouter:
    const freeOpenRouter = {
        "models.level1_fast": "nvidia/nemotron-3.5-lightning:free",
        "models.level2_standard": "google/gemma-4-31b-it:free",
        "models.level3_advanced": "nvidia/nemotron-3-super-120b-a12b:free",
        "models.level4_expert": "nvidia/nemotron-3-super-120b-a12b:free",
        "models.level5_reasoner": "nvidia/nemotron-3-super-120b-a12b:free"
    };

    await AiProvider.updateOne(
        { providerId: 'openrouter' },
        { $set: freeOpenRouter }
    );

    await AiProvider.updateOne(
        { providerId: 'openrouter_2' },
        { $set: freeOpenRouter }
    );

    console.log("Restored OpenRouter to verified zero-cost models.");
    process.exit(0);
}
fix();
