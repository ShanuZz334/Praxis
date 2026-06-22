import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const BASE_URL = "https://financialmodelingprep.com/stable";

console.log("=== Testing FMP API with Different Auth Methods ===\n");
console.log("API Key:", FMP_API_KEY);

async function testAuthMethods() {
    // Method 1: Query parameter
    console.log("\n1. Testing with query parameter:");
    try {
        const url = `${BASE_URL}/profile?symbol=AAPL&apikey=${FMP_API_KEY}`;
        const response = await axios.get(url, { timeout: 5000 });
        console.log("✅ Query parameter works! Status:", response.status);
    } catch (error) {
        console.log("❌ Query parameter failed:", error.response?.status, error.response?.data?.['Error Message']);
    }

    // Method 2: Header authorization
    console.log("\n2. Testing with header authorization:");
    try {
        const url = `${BASE_URL}/profile?symbol=AAPL`;
        const response = await axios.get(url, {
            headers: { 'apikey': FMP_API_KEY },
            timeout: 5000
        });
        console.log("✅ Header authorization works! Status:", response.status);
    } catch (error) {
        console.log("❌ Header authorization failed:", error.response?.status, error.response?.data?.['Error Message']);
    }

    // Method 3: Try the old v3 endpoint
    console.log("\n3. Testing old v3 endpoint:");
    try {
        const url = `https://financialmodelingprep.com/api/v3/profile/AAPL?apikey=${FMP_API_KEY}`;
        const response = await axios.get(url, { timeout: 5000 });
        console.log("✅ V3 endpoint works! Status:", response.status);
    } catch (error) {
        console.log("❌ V3 endpoint failed:", error.response?.status, error.response?.data?.['Error Message']);
    }
}

testAuthMethods();
