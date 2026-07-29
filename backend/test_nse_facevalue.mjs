import { NseIndia } from "stock-nse-india";

const nseIndia = new NseIndia();

async function test() {
    try {
        console.log("Fetching equity details for TCS...");
        const details = await nseIndia.getEquityDetails("TCS");
        console.log("Keys available in equity details:");
        console.log(Object.keys(details));
        
        console.log("\nTrying to find Face Value...");
        if (details.securityInfo && details.securityInfo.faceValue) {
            console.log("Found faceValue in securityInfo:", details.securityInfo.faceValue);
        } else if (details.metadata && details.metadata.faceValue) {
            console.log("Found faceValue in metadata:", details.metadata.faceValue);
        } else if (details.priceInfo && details.priceInfo.faceValue) {
            console.log("Found faceValue in priceInfo:", details.priceInfo.faceValue);
        } else {
            console.log("Could not find 'faceValue' at the top levels. Let's dump the JSON:");
            console.log(JSON.stringify(details, null, 2));
        }

    } catch (err) {
        console.error("Error fetching from stock-nse-india:", err);
    }
}

test();
