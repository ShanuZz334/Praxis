import { NseIndia } from "stock-nse-india";
const nseIndia = new NseIndia();

async function checkConnection() {
    try {
        console.log("Checking connection with AMBUJACEM...");
        const details = await nseIndia.getEquityDetails("AMBUJACEM");
        
        console.log(JSON.stringify(details.securityInfo, null, 2));
    } catch (err) {
        console.error("Connection check failed:", err.message);
    }
}

checkConnection();
