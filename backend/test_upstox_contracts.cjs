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
    console.log("Token:", token.substring(0, 10) + "...");
    
    try {
        const url = 'https://api.upstox.com/v2/option/contract?instrument_key=NSE_INDEX%7CNifty%2050';
        console.log("Fetching from:", url);
        const res = await axios.get(url, {
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        console.log("SUCCESS:");
        console.log(JSON.stringify(res.data).substring(0, 500));
    } catch (e) {
        console.log("ERROR:");
        console.log(e.response ? e.response.data : e.message);
    }
    process.exit(0);
}
test();
