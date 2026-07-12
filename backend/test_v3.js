import axios from 'axios';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

async function testV3() {
    try {
        await mongoose.connect('mongodb://localhost:27017/praxis');
        const UpstoxAuth = mongoose.model('UpstoxAuth', new mongoose.Schema({ accessToken: String }, { strict: false }));
        const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
        
        if (!auth) throw new Error("No auth");

        const headers = { "Accept": "application/json", "Authorization": `Bearer ${auth.accessToken}` };
        
        // Try v3
        const res = await axios.get('https://api.upstox.com/v3/fundamentals/INE467B01029/key-ratios', { headers });
        console.log("V3 key-ratios success!");
        console.log(res.data);
    } catch (e) {
        console.error("V3 error:", e.response?.status, e.response?.data || e.message);
    } finally {
        mongoose.disconnect();
    }
}

testV3();
