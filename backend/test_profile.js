import axios from 'axios';
import mongoose from 'mongoose';
import UpstoxAuth from './models/UpstoxAuth.js';

mongoose.connect('mongodb://127.0.0.1:27017/praxis').then(async () => {
    const auth = await UpstoxAuth.findOne().sort({createdAt:-1});
    const h = {headers: {Accept: 'application/json', Authorization: 'Bearer '+auth.accessToken}};
    
    console.log('testing company-profile');
    try {
        const r1 = await axios.get('https://api.upstox.com/v2/fundamentals/INE002A01018/company-profile', h);
        console.log('company-profile success:', r1.data.data.market_cap !== undefined);
        console.log('company-profile keys:', Object.keys(r1.data.data));
    } catch(e) {
        console.log('company-profile error:', e.response?.status, e.response?.data);
    }
    
    console.log('testing profile');
    try {
        const r2 = await axios.get('https://api.upstox.com/v2/fundamentals/INE002A01018/profile', h);
        console.log('profile success:', Object.keys(r2.data.data));
    } catch(e) {
        console.log('profile error:', e.response?.status, e.response?.data);
    }
    
    process.exit(0);
});
