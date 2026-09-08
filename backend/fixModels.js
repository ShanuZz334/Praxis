import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import AiProvider from './models/AiProvider.js';

async function fix() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Fix OpenRouter
    await AiProvider.updateOne(
        { providerId: 'openrouter' },
        { $set: { 
            "models.level2_standard": "google/gemini-2.5-flash",
            "models.level3_advanced": "google/gemini-2.5-pro",
            "models.level4_expert": "anthropic/claude-3.5-sonnet",
            "models.level5_reasoner": "deepseek/deepseek-r1"
        }}
    );

    // Fix OpenRouter 2
    await AiProvider.updateOne(
        { providerId: 'openrouter_2' },
        { $set: {
            "models.level2_standard": "google/gemini-2.5-flash",
            "models.level3_advanced": "meta-llama/llama-3.3-70b-instruct",
            "models.level5_reasoner": "deepseek/deepseek-r1"
        }}
    );
    
    // Fix Groq
    await AiProvider.updateOne(
        { providerId: 'groq' },
        { $set: {
            "models.level1_fast": "llama-3.1-8b-instant",
            "models.level2_standard": "llama-3.3-70b-versatile",
            "models.level3_advanced": "llama-3.1-70b-versatile",
            "models.level4_expert": "llama-3.3-70b-versatile",
            "models.level7_audio": "whisper-large-v3-turbo"
        }}
    );
    
    console.log("Fixed DB models.");
    process.exit(0);
}
fix();
