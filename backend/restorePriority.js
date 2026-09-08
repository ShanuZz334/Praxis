import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import AiProvider from './models/AiProvider.js';

async function restorePriority() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Restore Ollama to Priority 1 and activate it
    await AiProvider.updateOne({ providerId: 'ollama' }, { $set: { priority: 1, isActive: true } });
    
    // Restore other priorities
    await AiProvider.updateOne({ providerId: 'gemini' }, { $set: { priority: 2 } });
    await AiProvider.updateOne({ providerId: 'openrouter' }, { $set: { priority: 3 } });
    await AiProvider.updateOne({ providerId: 'openrouter_2' }, { $set: { priority: 4 } });
    await AiProvider.updateOne({ providerId: 'groq' }, { $set: { priority: 5 } });
    await AiProvider.updateOne({ providerId: 'groq_2' }, { $set: { priority: 10 } });

    console.log("Priorities successfully restored to original state!");
    process.exit(0);
}
restorePriority();
