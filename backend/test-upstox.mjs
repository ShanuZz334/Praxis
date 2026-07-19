
import axios from 'axios';
import mongoose from 'mongoose';
await mongoose.connect('mongodb://127.0.0.1:27017/praxis');
import UpstoxAuth from './models/UpstoxAuth.js';
const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
const res = await axios.get('https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_INDEX|Nifty 50,NSE_INDEX|Nifty Bank', { headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + auth.accessToken } });
console.log(JSON.stringify(res.data.data, null, 2));
process.exit(0);

