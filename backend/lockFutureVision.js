import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import AiRouting from './models/AiRouting.js';

async function fixRouting() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Switch from 550B Nemotron (which is timing out after 2 mins)
    // to Ling Flash Fin (Finance-specific fast MoE model).
    await AiRouting.findOneAndUpdate(
        { isSingleton: true },
        { $set: { 
            "futureVision": {
                providerId: 'openrouter',
                modelId: 'inclusionai/ling-3.0-flash-fin:free'
            }
        }},
        { upsert: true }
    );

    console.log("Future Vision successfully locked to OpenRouter Ling Flash Fin (Fast)!");
    process.exit(0);
}
fixRouting();
