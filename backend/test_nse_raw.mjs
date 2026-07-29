import { NseIndia } from "stock-nse-india";
const nseIndia = new NseIndia();

async function checkConnection() {
    try {
        console.log("Fetching raw endpoint for AMBUJACEM...");
        const raw = await nseIndia.getDataByEndpoint('/api/quote-equity?symbol=AMBUJACEM');
        console.log(JSON.stringify(raw.securityInfo, null, 2));
    } catch (err) {
        console.error("Connection check failed:", err.message);
    }
}

checkConnection();
