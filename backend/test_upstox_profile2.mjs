import axios from 'axios';
import localDb from './config/localDb.js';

async function run() {
    try {
        // Need to fetch from MongoDB actually for UpstoxAuth
        const mongoose = (await import('mongoose')).default;
        await mongoose.connect('mongodb://127.0.0.1:27017/praxis');
        const UpstoxAuth = (await import('./models/UpstoxAuth.js')).default;
        const auth = await UpstoxAuth.findOne().sort({createdAt:-1});
        const h = {headers: {Accept: 'application/json', Authorization: 'Bearer '+auth.accessToken}};
        
        console.log('testing company-profile');
        try {
            const r1 = await axios.get('https://api.upstox.com/v2/fundamentals/INE466L01038/company-profile', h);
            console.log('company-profile keys:', Object.keys(r1.data.data));
            console.log('company-profile data:', r1.data.data);
        } catch(e) {
            console.log('company-profile error:', e.response?.status, e.response?.data);
        }
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
