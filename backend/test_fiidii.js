import 'dotenv/config';
import mongoose from 'mongoose';
import axios from 'axios';

const UPSTOX_BASE_URL = "https://api.upstox.com/v2/market";
const UpstoxAuth = mongoose.models.UpstoxAuth || mongoose.model('UpstoxAuth', new mongoose.Schema({
    accessToken: String,
    updatedAt: Date
}));

const getAuthToken = async () => {
    const auth = await UpstoxAuth.findOne().sort({ updatedAt: -1 });
    if (!auth || !auth.accessToken) throw new Error("No Upstox auth token found");
    return auth.accessToken;
};

async function test() {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI);
    
    try {
        const token = await getAuthToken();
        const headers = { "Accept": "application/json", "Authorization": `Bearer ${token}` };
        const fiiDataTypes = "NSE_EQ|CASH";
        
        console.log("Fetching FII...");
        const fii = await axios.get(`${UPSTOX_BASE_URL}/fii?interval=1D&data_type=${encodeURIComponent(fiiDataTypes)}`, { headers });
        console.log("FII length (cash):", fii.data.data['NSE_EQ|CASH']?.length);
        console.log("First 2 entries:", JSON.stringify(fii.data.data['NSE_EQ|CASH']?.slice(0, 2), null, 2));
    } catch (e) {
        console.log("Error:", e.response?.data?.errors || e.message);
    }
    
    process.exit(0);
}

test();
