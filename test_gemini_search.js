import { call } from './backend/ai-gateway/providers/geminiProvider.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/praxis').then(async () => {
    console.log("Connected to DB");
    try {
        const res = await call({
            model: "gemini-1.5-pro",
            messages: [{ role: "user", content: "latest price of reliance" }],
            maxTokens: 500,
            temperature: 0.2,
            jsonMode: false,
            enableWebSearch: true
        });
        console.log("RESPONSE:", res.text);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
