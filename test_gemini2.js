import dotenv from 'dotenv';
dotenv.config();

import { call } from './backend/ai-gateway/providers/geminiProvider.js';
import mongoose from 'mongoose';
import { connectDB } from './backend/config/db.js';

async function run() {
    await connectDB();
    try {
        const res = await call({
            model: 'gemini-1.5-flash',
            messages: [{ role: 'user', content: 'What is the news today?' }],
            enableWebSearch: true
        });
        console.log("Success:");
        console.log(res);
    } catch (e) {
        console.error("Error:", e);
    }
    mongoose.disconnect();
}
run();
