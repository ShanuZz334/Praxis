import 'dotenv/config';
import mongoose from 'mongoose';
import AiProvider from './models/AiProvider.js';

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const providers = await AiProvider.find().lean();
        console.log(JSON.stringify(providers.map(p => ({
            id: p.providerId,
            active: p.isActive,
            tier3: p.models?.tier3_complex
        })), null, 2));
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
})();
