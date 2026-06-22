import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const BASE_URL = "https://financialmodelingprep.com/api/v3";

console.log("=== Testing FMP API Connection ===\n");
console.log("API Key:", FMP_API_KEY);
console.log("Base URL:", BASE_URL);

async function testFMPConnection() {
    try {
        const startTime = Date.now();

        // Test the quote endpoint (used in health check)
        const url = `${BASE_URL}/quote/AAPL?apikey=${FMP_API_KEY}`;
        console.log("\nTesting URL:", url);

        const response = await axios.get(url, { timeout: 5000 });
        const latency = Date.now() - startTime;

        console.log("\n✓ Status:", response.status);
        console.log("✓ Latency:", latency + "ms");
        console.log("✓ Response:", JSON.stringify(response.data, null, 2));

        if (response.data && response.data.length > 0) {
            console.log("\n✅ FMP API is working correctly!");
        } else {
            console.log("\n⚠️  FMP API returned empty data");
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

testFMPConnection();
