import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import AiProvider from './models/AiProvider.js';

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const ollama = await AiProvider.findOne({ providerId: 'ollama' }).lean();
    console.log("Ollama Models:");
    console.log(JSON.stringify(ollama.models, null, 2));
    process.exit(0);
}
check();
