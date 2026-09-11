import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    // Change OpenRouter's level2_standard to a much more stable model than gemma-4-free
    await db.collection('aiproviders').updateOne(
        { providerId: 'openrouter' },
        { $set: { 'models.level2_standard': 'meta-llama/llama-3.3-70b-instruct:free' } }
    );
    
    // Change OpenRouter 2's level2_standard to a stable model
    await db.collection('aiproviders').updateOne(
        { providerId: 'openrouter_2' },
        { $set: { 'models.level2_standard': 'microsoft/phi-3-medium-128k-instruct:free' } }
    );

    console.log('Updated DB models');
    process.exit(0);
}
run();
