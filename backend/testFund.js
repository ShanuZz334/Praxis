import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { getFundamentals } from './controllers/fundamentalsController.js';

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    const req = { query: { instrument_key: 'NSE_EQ|INE002A01018' } };
    const res = {
        status: (code) => {
            console.log("STATUS:", code);
            return { json: (obj) => console.log("JSON:", obj) };
        },
        json: (obj) => console.log("SUCCESS JSON:", obj)
    };
    await getFundamentals(req, res);
    process.exit(0);
}
test();
