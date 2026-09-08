import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import AiProvider from './models/AiProvider.js';

async function fix() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Restore Groq to the user's specific enterprise/beta tier models
    await AiProvider.updateOne(
        { providerId: 'groq' },
        { $set: {
            "models.level1_fast": "qwen/qwen3.8-27b",
            "models.level2_standard": "openai/gpt-oss-20b",
            "models.level3_advanced": "openai/gpt-oss-20b",
            "models.level4_expert": "openai/gpt-oss-120b",
            "models.level5_reasoner": "openai/gpt-oss-120b",
            "models.level7_audio": "whisper-large-v3-turbo"
        }}
    );
    
    // Restore OpenRouter to robust free models 
    // (OpenRouter recently renamed some of their free tags, let's use the most reliable ones)
    await AiProvider.updateOne(
        { providerId: 'openrouter' },
        { $set: { 
            "models.level1_fast": "google/gemini-2.0-pro-exp-0205:free",
            "models.level2_standard": "google/gemini-2.0-pro-exp-0205:free",
            "models.level3_advanced": "deepseek/deepseek-r1:free",
            "models.level4_expert": "deepseek/deepseek-r1:free",
            "models.level5_reasoner": "deepseek/deepseek-r1:free"
        }}
    );

    console.log("Restored specific account models.");
    process.exit(0);
}
fix();
