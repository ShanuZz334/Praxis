import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const BASE_URL = "https://financialmodelingprep.com/stable";

console.log("=== Testing FMP with New Stable API ===\n");
console.log("API Key:", FMP_API_KEY);
console.log("Base URL:", BASE_URL);

async function testStableAPI() {
    try {
        const url = `${BASE_URL}/profile?symbol=AAPL&apikey=${FMP_API_KEY}`;
        console.log("\nTesting URL:", url);

        const start = Date.now();
        const response = await axios.get(url, { timeout: 5000 });
        const latency = Date.now() - start;

        console.log("\n✓ Status:", response.status);
        console.log("✓ Latency:", latency + "ms");
        console.log("✓ Response:", JSON.stringify(response.data, null, 2).substring(0, 500));

        if (response.data && response.data.length > 0) {
            console.log("\n✅ FMP Stable API is working correctly!");
            console.log("Company:", response.data[0].companyName);
            console.log("Price:", response.data[0].price);
        }
    } catch (error) {
        console.log("\n❌ FMP API Error:");
        console.log("Error message:", error.message);
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        }
    }
}

testStableAPI();
