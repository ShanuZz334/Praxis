import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join('C:', 'project', 'ALLBACKUP', 'Praxis', 'backend', '.env') });

async function deleteMongo() {
    const uri = process.env.MONGO_URI; 
    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        
        console.log('Connected to Atlas.');
        const result = await db.collection('aiCardPrompts').deleteOne({ cardId: 'fno_ban' });
        console.log(`Deleted ${result.deletedCount} aiCardPrompt(s)`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

deleteMongo();
