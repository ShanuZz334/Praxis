import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

console.log("=== Testing All Provider API Keys ===\n");

async function testProviders() {
    const results = [];

    // Test FMP
    try {
        const fmpKey = process.env.FMP_API_KEY;
        const fmpUrl = `https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=${fmpKey}`;
        await axios.get(fmpUrl, { timeout: 5000 });
        results.push({ provider: "FMP", status: "✅ WORKING", key: fmpKey });
    } catch (err) {
        results.push({ provider: "FMP", status: `❌ FAILED: ${err.response?.status || err.message}`, key: process.env.FMP_API_KEY });
    }

    // Test Twelve Data
    try {
        const twelveKey = process.env.TWELVEDATA_API_KEY;
        const twelveUrl = `https://api.twelvedata.com/time_series?symbol=AAPL&interval=1min&apikey=${twelveKey}`;
        await axios.get(twelveUrl, { timeout: 5000 });
        results.push({ provider: "Twelve Data", status: "✅ WORKING", key: twelveKey });
    } catch (err) {
        results.push({ provider: "Twelve Data", status: `❌ FAILED: ${err.response?.status || err.message}`, key: process.env.TWELVEDATA_API_KEY });
    }

    // Test Alpha Vantage
    try {
        const avKey = process.env.ALPHAVANTAGE_API_KEY;
        const avUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${avKey}`;
        await axios.get(avUrl, { timeout: 5000 });
        results.push({ provider: "Alpha Vantage", status: "✅ WORKING", key: avKey });
    } catch (err) {
        results.push({ provider: "Alpha Vantage", status: `❌ FAILED: ${err.response?.status || err.message}`, key: process.env.ALPHAVANTAGE_API_KEY });
    }

    // Test Polygon
    try {
        const polyKey = process.env.POLYGON_API_KEY;
        const polyUrl = `https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apiKey=${polyKey}`;
        await axios.get(polyUrl, { timeout: 5000 });
        results.push({ provider: "Polygon", status: "✅ WORKING", key: polyKey });
    } catch (err) {
        results.push({ provider: "Polygon", status: `❌ FAILED: ${err.response?.status || err.message}`, key: process.env.POLYGON_API_KEY });
    }

    // Test FRED
    try {
        const fredKey = process.env.FRED_API_KEY;
        const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=GDP&api_key=${fredKey}&file_type=json`;
        await axios.get(fredUrl, { timeout: 5000 });
        results.push({ provider: "FRED", status: "✅ WORKING", key: fredKey });
    } catch (err) {
        results.push({ provider: "FRED", status: `❌ FAILED: ${err.response?.status || err.message}`, key: process.env.FRED_API_KEY });
    }

    // Test NewsAPI
    try {
        const newsKey = process.env.NEWSAPI_API_KEY;
        const newsUrl = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${newsKey}`;
        await axios.get(newsUrl, { timeout: 5000 });
        results.push({ provider: "NewsAPI", status: "✅ WORKING", key: newsKey });
    } catch (err) {
        results.push({ provider: "NewsAPI", status: `❌ FAILED: ${err.response?.status || err.message}`, key: process.env.NEWSAPI_API_KEY });
    }

    console.table(results);
}

testProviders();
