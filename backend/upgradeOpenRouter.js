import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import AiProvider from './models/AiProvider.js';

async function fix() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Set OpenRouter to the absolute best contextual free models for Praxis (Finance App)
    const bestOpenRouterModels = {
        // Fast/Lightning tasks: Nvidia's specialized lightning model
        "models.level1_fast": "nvidia/nemotron-3.5-lightning:free",
        
        // Standard/Finance tasks: Ling 3.0 Flash Fin is a Mixture-of-Experts built explicitly for investment workflows!
        "models.level2_standard": "inclusionai/ling-3.0-flash-fin:free",
        "models.level3_advanced": "inclusionai/ling-3.0-flash-fin:free",
        
        // Expert/Deep Reasoning: Nvidia's massive 120B model and Nex's Pro agent
        "models.level4_expert": "nex-agi/nex-n2.5-pro:free",
        "models.level5_reasoner": "nvidia/nemotron-3-super-120b-a12b:free"
    };

    await AiProvider.updateOne(
        { providerId: 'openrouter' },
        { $set: bestOpenRouterModels }
    );

    await AiProvider.updateOne(
        { providerId: 'openrouter_2' },
        { $set: bestOpenRouterModels }
    );

    console.log("Upgraded OpenRouter to optimal finance and reasoning free models.");
    process.exit(0);
}
fix();
