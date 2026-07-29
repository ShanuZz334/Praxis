import axios from 'axios';
import mongoose from 'mongoose';
import UpstoxAuth from './models/UpstoxAuth.js';

mongoose.connect('mongodb://127.0.0.1:27017/praxis').then(async () => {
    const auth = await UpstoxAuth.findOne().sort({createdAt:-1});
    const h = {headers: {Accept: 'application/json', Authorization: 'Bearer '+auth.accessToken}};
    
    console.log('testing company-profile for TCS');
    try {
        const r1 = await axios.get('https://api.upstox.com/v2/fundamentals/INE467B01029/company-profile', h);
        console.log('company-profile keys:', Object.keys(r1.data.data));
        console.log('company-profile content:', r1.data.data);
    } catch(e) {
        console.log('company-profile error:', e.response?.status, e.response?.data);
    }
    process.exit(0);
});
