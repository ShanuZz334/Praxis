import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const BASE_URL = "https://financialmodelingprep.com/api/v3";

console.log("=== Testing FMP Endpoints ===\n");
console.log("API Key:", FMP_API_KEY);

async function testEndpoints() {
    const endpoints = [
        { name: "quote-short (health check)", url: `${BASE_URL}/quote-short/SPY?apikey=${FMP_API_KEY}` },
        { name: "quote", url: `${BASE_URL}/quote/AAPL?apikey=${FMP_API_KEY}` },
        { name: "profile", url: `${BASE_URL}/profile/AAPL?apikey=${FMP_API_KEY}` }
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`\nTesting: ${endpoint.name}`);
            console.log(`URL: ${endpoint.url}`);

            const start = Date.now();
            const response = await axios.get(endpoint.url, { timeout: 5000 });
            const latency = Date.now() - start;

            console.log(`✓ Status: ${response.status}`);
            console.log(`✓ Latency: ${latency}ms`);
            console.log(`✓ Data:`, JSON.stringify(response.data).substring(0, 200));
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Data:`, error.response.data);
            }
        }
    }
}

testEndpoints();
