import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import AiProvider from './models/AiProvider.js';

async function setupGroq() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // First, let's get the existing Groq provider to grab its base settings and API key
    const existingGroq = await AiProvider.findOne({ providerId: 'groq' }).lean();
    
    // Setup Primary Groq Provider (Optimized for High Throughput)
    await AiProvider.updateOne(
        { providerId: 'groq' },
        { $set: { 
            "models.level1_fast": "groq/compound-mini",        // High TPM limit (70K)
            "models.level2_standard": "groq/compound",         // High TPM limit (70K)
            "models.level3_advanced": "openai/gpt-oss-20b",    // Solid 20B reasoning
            "models.level4_expert": "qwen/qwen3.8-27b",        // Qwen is excellent at coding/logic
            "models.level5_reasoner": "openai/gpt-oss-120b",   // Massive 120B model for deep thinking
            "models.level7_audio": "whisper-large-v3-turbo"    // Blazing fast audio transcription
        }}
    );

    // Create a Secondary Groq Provider (groq_2) to double the effective rate limits!
    const groq2Exists = await AiProvider.findOne({ providerId: 'groq_2' });
    
    const secondaryModels = {
        "level1_fast": "groq/compound-mini",
        "level2_standard": "groq/compound",
        "level3_advanced": "qwen/qwen3.6-27b",               // Alternate 27B model to balance load
        "level4_expert": "openai/gpt-oss-20b",               // Alternate expert route
        "level5_reasoner": "openai/gpt-oss-120b",
        "level7_audio": "whisper-large-v3"                   // High-quality audio (non-turbo)
    };

    if (groq2Exists) {
        await AiProvider.updateOne(
            { providerId: 'groq_2' },
            { $set: { models: secondaryModels } }
        );
    } else {
        await AiProvider.create({
            providerId: 'groq_2',
            displayName: 'Groq 2 (Load Balancer)',
            baseUrl: existingGroq ? existingGroq.baseUrl : 'https://api.groq.com/openai/v1',
            apiKey: existingGroq ? existingGroq.apiKey : '', // Cloned key, user can edit if they get a 2nd one
            purpose: 'Secondary limits & Load Balancing',
            status: 'active',
            models: secondaryModels
        });
    }

    console.log("Successfully mapped Groq models and created secondary load balancer!");
    process.exit(0);
}
setupGroq();
