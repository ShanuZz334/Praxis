import mongoose from 'mongoose';
import { fetchHistoricalCandles } from './services/upstoxHistorical.js';

const run = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/praxis', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to Mongo");
        await fetchHistoricalCandles('NSE_EQ|INE674K01013', '1minute', '2026-03-03', '2026-02-01', false);
        console.log("Success!");
    } catch (e) {
        console.error("Failed:", e?.response?.data || e.message);
    } finally {
        mongoose.disconnect();
    }
};
run();
