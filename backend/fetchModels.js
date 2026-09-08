import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import AiProvider from './models/AiProvider.js';
import { decrypt } from './utils/encryption.js';

async function fetchGroq() {
    await mongoose.connect(process.env.MONGO_URI);
    const p = await AiProvider.findOne({ providerId: 'groq' });
    const key = decrypt(p.apiKey);
    
    const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` }
    });
    const data = await res.json();
    console.log(data.data.map(m => m.id));
    
    const p2 = await AiProvider.findOne({ providerId: 'openrouter' });
    const key2 = decrypt(p2.apiKey);
    const res2 = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${key2}` }
    });
    const data2 = await res2.json();
    console.log("OpenRouter models count:", data2.data ? data2.data.length : data2);
    
    process.exit(0);
}
fetchGroq();
