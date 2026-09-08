import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import AiProvider from './models/AiProvider.js';

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const providers = await AiProvider.find().sort('priority');
    providers.forEach(p => console.log(`${p.priority}: ${p.providerId} (Active: ${p.isActive})`));
    process.exit(0);
}
check();
