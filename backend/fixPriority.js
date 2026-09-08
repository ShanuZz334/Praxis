import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import AiProvider from './models/AiProvider.js';

async function fixPriority() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Demote Ollama so it stops burning the user's laptop CPU
    await AiProvider.updateOne({ providerId: 'ollama' }, { $set: { priority: 99, isActive: false } });
    
    // Promote the blazing fast cloud APIs
    await AiProvider.updateOne({ providerId: 'openrouter' }, { $set: { priority: 1 } });
    await AiProvider.updateOne({ providerId: 'groq' }, { $set: { priority: 2 } });
    await AiProvider.updateOne({ providerId: 'gemini' }, { $set: { priority: 3 } });
    await AiProvider.updateOne({ providerId: 'openrouter_2' }, { $set: { priority: 4 } });
    await AiProvider.updateOne({ providerId: 'groq_2' }, { $set: { priority: 5 } });

    console.log("Priorities fixed!");
    process.exit(0);
}
fixPriority();
