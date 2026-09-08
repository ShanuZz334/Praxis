import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import AiProvider from './models/AiProvider.js';

async function fix() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Fix OpenRouter to use 100% FREE models so it doesn't fail on 0 credits
    await AiProvider.updateOne(
        { providerId: 'openrouter' },
        { $set: { 
            "models.level1_fast": "google/gemini-2.0-flash-lite-preview-02-05:free",
            "models.level2_standard": "google/gemini-2.0-flash-exp:free",
            "models.level3_advanced": "meta-llama/llama-3.3-70b-instruct:free",
            "models.level4_expert": "google/gemini-2.0-pro-exp-0205:free",
            "models.level5_reasoner": "deepseek/deepseek-r1:free"
        }}
    );

    await AiProvider.updateOne(
        { providerId: 'openrouter_2' },
        { $set: {
            "models.level1_fast": "google/gemini-2.0-flash-lite-preview-02-05:free",
            "models.level2_standard": "google/gemini-2.0-flash-exp:free",
            "models.level3_advanced": "nvidia/llama-3.1-nemotron-70b-instruct:free",
            "models.level4_expert": "google/gemini-2.0-pro-exp-0205:free",
            "models.level5_reasoner": "deepseek/deepseek-r1:free"
        }}
    );
    
    // Fix Groq to use valid globally available models
    await AiProvider.updateOne(
        { providerId: 'groq' },
        { $set: {
            "models.level1_fast": "llama-3.1-8b-instant",
            "models.level2_standard": "llama-3.1-70b-versatile",
            "models.level3_advanced": "llama-3.1-70b-versatile",
            "models.level4_expert": "llama-3.1-70b-versatile",
            "models.level5_reasoner": "llama-3.1-70b-versatile",
            "models.level7_audio": "whisper-large-v3-turbo"
        }}
    );
    
    console.log("Fixed DB models to 100% free and globally accessible endpoints.");
    process.exit(0);
}
fix();
