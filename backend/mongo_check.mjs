import mongoose from 'mongoose';

async function checkMongo() {
    const uri = "mongodb://localhost:27017/praxis"; // Check praxis db
    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        
        console.log('--- aiCardPrompts ---');
        const prompts = await db.collection('aiCardPrompts').find({ cardId: 'fno_ban' }).toArray();
        if (prompts.length > 0) {
            console.log(`Found ${prompts.length} entry/entries for fno_ban in aiCardPrompts`);
        } else {
            console.log('No entries found for fno_ban in aiCardPrompts');
        }

        console.log('\n--- aiChatThreads ---');
        const threads = await db.collection('aiChatThreads').find({ 
            $or: [
                { cardId: 'fno_ban' },
                { "messages.content": { $regex: /f\&o ban|fo ban|fno_ban|mwpl/i } }
            ]
        }).toArray();
        
        if (threads.length > 0) {
            console.log(`Found ${threads.length} chat thread(s) associated with fno_ban or mentioning F&O Ban`);
            threads.forEach(t => console.log(`  - Thread ID: ${t._id}, Title: ${t.title || 'Untitled'}`));
        } else {
            console.log('No entries found for fno_ban in aiChatThreads');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkMongo();
