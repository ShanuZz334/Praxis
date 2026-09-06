import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { providerCache } from './cache/providerCache.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/praxis').then(async () => {
    try {
        const p = await providerCache.getProvider('gemini');
        console.log("Gemini Provider:", p ? { ...p, apiKey: p.apiKey ? 'SET' : 'MISSING' } : 'Not found');
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
