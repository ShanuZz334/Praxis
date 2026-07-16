import axios from "axios";
import UpstoxAuth from "../models/UpstoxAuth.js";

const UPSTOX_BASE_URL = "https://api.upstox.com/v2/market";

const getAuthToken = async () => {
    const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
    if (!auth || !auth.accessToken) throw new Error("Upstox is not authenticated");
    return auth.accessToken;
};

export const fetchFiiDiiFlow = async () => {
    try {
        const token = await getAuthToken();
        const headers = { "Accept": "application/json", "Authorization": `Bearer ${token}` };

        // Fetch FII Cash Data
        const fiiPromise = axios.get(`${UPSTOX_BASE_URL}/fii?data_type=NSE_EQ|CASH&interval=1D`, { headers })
            .then(res => res.data?.data?.["NSE_EQ|CASH"]?.[0])
            .catch(err => null);

        // Fetch DII Cash Data
        const diiPromise = axios.get(`${UPSTOX_BASE_URL}/dii?data_type=NSE_EQ|CASH&interval=1D`, { headers })
            .then(res => res.data?.data?.["NSE_EQ|CASH"]?.[0])
            .catch(err => null);

        const [fiiData, diiData] = await Promise.all([fiiPromise, diiPromise]);

        let fiiNet = 0;
        let diiNet = 0;
        let lastUpdated = null;

        if (fiiData) {
            fiiNet = (fiiData.buy_amount || 0) - (fiiData.sell_amount || 0);
            lastUpdated = fiiData.time_stamp;
        }

        if (diiData) {
            diiNet = (diiData.buy_amount || 0) - (diiData.sell_amount || 0);
            if (diiData.time_stamp && (!lastUpdated || diiData.time_stamp > lastUpdated)) {
                lastUpdated = diiData.time_stamp;
            }
        }
        
        // Return net flow
        return {
            fii_cash: fiiNet,
            dii_cash: diiNet,
            net_flow: fiiNet + diiNet,
            timestamp: lastUpdated
        };

    } catch (error) {
        console.error("❌ Failed to fetch FII/DII data:", error?.message);
        throw error;
    }
};
