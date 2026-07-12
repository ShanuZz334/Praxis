const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.useDb('praxis');
    const auths = await db.collection('upstoxauths').find().sort({createdAt: -1}).toArray();
    if (auths.length === 0) {
        console.log("No auth found");
        process.exit(1);
    }
    const token = auths[0].accessToken;
    
    try {
        const localChainUrl = 'http://localhost:3001/api/v1/upstox/option-chain?instrument_key=NSE_INDEX%7CNifty%2050';
        const chainRes = await axios.get(localChainUrl);
        let chainArray = chainRes.data.data || chainRes.data || [];
        
        let keys = [];
        for (let i = 0; i < chainArray.length && keys.length < 5; i++) {
            if (chainArray[i].call_options && chainArray[i].call_options.instrument_key) {
                keys.push(chainArray[i].call_options.instrument_key);
            }
        }
        
        const encodedKeys = keys.map(k => encodeURIComponent(k)).join(',');
        const url = `https://api.upstox.com/v3/market-quote/option-greek?instrument_key=${encodedKeys}`;
        console.log("Fetching from:", url);
        const res = await axios.get(url, {
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        console.log("SUCCESS:");
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log("ERROR:");
        console.log(e.response ? e.response.data : e.message);
    }
    process.exit(0);
}
test();
