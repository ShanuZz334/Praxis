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
            "models.level1_fast": "gemini-3.5-flash-lite",
            "models.level2_standard": "gemini-3.5-flash",
            "models.level3_advanced": "gemini-3.8-flash",
            "models.level4_expert": "gemini-3.8-flash",
            "models.level5_reasoner": "gemini-3.8-flash",
            "models.level6_vision": "gemini-3.8-flash"
        }}
    );

    console.log("Restored Google Gemini to Gemini 3.5/3.8 models.");
    process.exit(0);
}
fix();
