import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import AiProvider from '../models/AiProvider.js';

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const providers = await AiProvider.find().lean();
    console.log("--- AiProviders Collection ---");
    console.log(JSON.stringify(providers.map(p => ({ ...p, apiKey: p.apiKey ? "********" : "" })), null, 2));
    process.exit(0);
}
check();
