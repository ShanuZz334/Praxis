import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const FMP_API_KEY = process.env.FMP_API_KEY;

console.log("=== Testing FMP API (Browser Test Confirmed Working) ===\n");

async function testExactBrowserURL() {
    try {
        // Exact URL that worked in browser
        const url = `https://financialmodelingprep.com/stable/profile?symbol=AAPL&apikey=${FMP_API_KEY}`;

        console.log("Testing URL:", url);
        console.log("\nMaking request...");

        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json'
            }
        });

        console.log("\n✅ SUCCESS!");
        console.log("Status:", response.status);
        console.log("Company:", response.data[0].companyName);
        console.log("Price:", response.data[0].price);
        console.log("Market Cap:", response.data[0].marketCap);

    } catch (error) {
        console.log("\n❌ FAILED");
        console.log("Error:", error.message);
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        }
        if (error.code) {
            console.log("Error Code:", error.code);
        }
    }
}

testExactBrowserURL();
