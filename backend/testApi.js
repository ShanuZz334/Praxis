import axios from 'axios';
async function run() {
    try {
        const res = await axios.get('http://localhost:5000/api/v1/upstox/technicals?instrument_key=NSE_EQ%7CINE002A01018');
        console.log("Status:", res.status);
    } catch(err) {
        console.log("Error status:", err.response?.status);
        console.log("Error data:", err.response?.data);
    }
}
run();
