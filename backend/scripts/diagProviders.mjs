import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

// List ALL collections
const colls = await db.listCollections().toArray();
console.log('=== Collections in DB ===');
colls.forEach(function(c) { console.log(' -', c.name); });

// Find provider documents in whichever collection they live
for (const c of colls) {
    const docs = await db.collection(c.name).find({ providerId: 1 }).toArray();
    // Try with a broader query
    const docs2 = await db.collection(c.name).findOne({ isActive: true });
    if (docs2 && docs2.providerId) {
        const all = await db.collection(c.name).find({}).toArray();
        console.log('\n=== Providers in collection [' + c.name + '] ===');
        all.forEach(function(p) {
            if (p.providerId) {
                var t2 = p.models && p.models.tier2_medium ? p.models.tier2_medium : '-';
                var t3 = p.models && p.models.tier3_complex ? p.models.tier3_complex : '-';
                console.log(' ', p.providerId, '[active=' + p.isActive + '] baseUrl=' + (p.baseUrl || 'default') + ' t2=' + t2 + ' t3=' + t3);
            }
        });
    }
}

await mongoose.disconnect();
