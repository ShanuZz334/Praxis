import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { providerCache } from './cache/providerCache.js';

async function run() {
    await connectDB();
    try {
        const p = await providerCache.getProvider('gemini');
        console.log("Gemini Provider Cache:", p);
    } catch (e) {
        console.error("Error:", e);
    }
    mongoose.disconnect();
}
run();
