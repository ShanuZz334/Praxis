import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

import AiProvider from './models/AiProvider.js';

async function fixGeminiToLatest() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const gemini = await AiProvider.findOne({ providerId: 'gemini' });
    if (gemini) {
        gemini.models.tier1_simple = 'gemini-3.1-flash-lite';
        gemini.models.tier2_medium = 'gemini-3.5-flash';
        gemini.models.tier3_complex = 'gemini-3.5-flash';
        gemini.models.tier4_vision = 'gemini-3.5-flash';
        await gemini.save();
        console.log('Fixed Gemini model strings to the latest 3.x series in DB.');
    }
    process.exit(0);
}

fixGeminiToLatest().catch(console.error);
