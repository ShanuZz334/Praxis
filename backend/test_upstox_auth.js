import mongoose from 'mongoose';
import UpstoxAuth from './models/UpstoxAuth.js';
import axios from 'axios';

mongoose.connect('mongodb://localhost:27017/praxis').then(async () => {
    const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
    if (!auth) {
        console.log("No auth found in mongo");
        process.exit(1);
    }
    
    try {
        const r = await axios.get('https://api.upstox.com/v2/fundamentals/INE467B01029/key-ratios', {
            headers: {
                'Authorization': 'Bearer ' + auth.accessToken,
                'Accept': 'application/json'
            }
        });
        console.log("SUCCESS:", r.data);
    } catch(e) {
        console.log("ERROR:", e.response ? e.response.data : e.message);
    }
    process.exit(0);
});
