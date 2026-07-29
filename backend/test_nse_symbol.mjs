import { NseIndia } from "stock-nse-india";
const nseIndia = new NseIndia();

async function test() {
    try {
        console.log("Fetching symbol info for TCS...");
        const info = await nseIndia.getEquitySymbolInfo("TCS");
        console.log(info);
    } catch (err) {
        console.error(err);
    }
}
test();
