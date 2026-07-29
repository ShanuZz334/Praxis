import { NseIndia } from "stock-nse-india";
const nseIndia = new NseIndia();

async function checkConnection() {
    try {
        console.log("Checking connection with RELIANCE...");
        const details = await nseIndia.getEquityDetails("RELIANCE");
        
        console.log("\n--- RELIANCE Live Data ---");
        console.log(`Company Name: ${details.info.companyName}`);
        console.log(`Last Price: ₹${details.priceInfo.lastPrice}`);
        console.log(`Day High: ₹${details.priceInfo.intraDayHighLow.max}`);
        console.log(`Day Low: ₹${details.priceInfo.intraDayHighLow.min}`);
        console.log(`52 Week High: ₹${details.priceInfo.weekHighLow.max}`);
        console.log(`Total Traded Volume: ${details.preOpenMarket.totalTradedVolume}`);
        console.log(`Last Update Time: ${details.metadata.lastUpdateTime}`);
        console.log(`Status: ${details.securityInfo.tradingStatus}`);

        // Let's also test historical data fetching
        console.log("\n--- Testing Historical Data (Last 5 Days) ---");
        const range = {
            start: new Date(new Date().setDate(new Date().getDate() - 5)),
            end: new Date()
        };
        const historical = await nseIndia.getEquityHistoricalData("RELIANCE", range);
        if (historical && historical.length > 0) {
            console.log(`Successfully fetched ${historical.length} days of historical data.`);
            console.log("Latest historical record:", historical[0]);
        } else {
            console.log("Could not fetch historical data (might be empty or weekend).");
        }
        
    } catch (err) {
        console.error("Connection check failed:", err.message);
    }
}

checkConnection();
