import 'dotenv/config';
import { runFutureVisionPrediction } from './services/futureVisionService.js';
import mongoose from 'mongoose';

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const payload = `TEST PAYLOAD`;
        const result = await runFutureVisionPrediction(payload, 'NSE_EQ|INE123', 7);
        console.log(result);
    } catch(e) {
        console.error(e.message);
    } finally {
        process.exit(0);
    }
})();
