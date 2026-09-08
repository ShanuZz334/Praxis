import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { syncCandlesIfStale } from './services/upstoxHistorical.js';

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        await syncCandlesIfStale('NSE_EQ|INE002A01018', 'day');
        console.log("Sync complete");
    } catch (e) {
        console.error("Sync error:", e);
    }
    process.exit(0);
}
test();
