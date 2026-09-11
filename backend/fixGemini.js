import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import AiProvider from './models/AiProvider.js';

async function fix() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Update the native Google Gemini provider with the latest Gemini 3.x models
    // Based on the user's quota list
    await AiProvider.updateOne(
        { providerId: 'gemini' },
        { $set: { 
            supportedLevels: ['level1_fast', 'level2_standard', 'level3_advanced', 'level4_expert', 'level5_reasoner', 'level6_vision'],
            "models.level1_fast": "gemini-3.5-flash-lite",
            "models.level2_standard": "gemini-3.5-flash",
            "models.level3_advanced": "gemini-3.5-flash",
            "models.level4_expert": "gemini-3.8-flash",
            "models.level5_reasoner": "gemini-3.8-flash",
            "models.level6_vision": "gemini-3.8-flash"
        }}
    );

    console.log("Updated Google Gemini models and supportedLevels successfully.");
    process.exit(0);
}
fix();
