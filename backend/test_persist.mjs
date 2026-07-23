import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import connectDB from './config/db.js';
import AiCardPrompt from './models/AiCardPrompt.js';

async function run() {
    await connectDB();
    
    console.log('--- Step 1: Saving custom prompt for praxis_composite_header ---');
    await AiCardPrompt.findOneAndUpdate(
        { targetId: 'praxis_composite_header' },
        { 
            systemInstruction: 'This is a custom test prompt for the Master Dashboard Header',
            displayName: 'Master Dashboard Header',
            page: 'Master',
            isDefault: false
        },
        { upsert: true, new: true }
    );
    console.log('Saved successfully.');

    console.log('--- Step 2: Simulating hard refresh (fetching from DB) ---');
    const p = await AiCardPrompt.findOne({ targetId: 'praxis_composite_header' });
    console.log('Fetched Instruction:', p.systemInstruction);
    
    console.log('--- Step 3: Cleaning up test data ---');
    await AiCardPrompt.deleteOne({ targetId: 'praxis_composite_header' });
    console.log('Done.');
    process.exit(0);
}

run().catch(console.error);
