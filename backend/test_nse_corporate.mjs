import { NseIndia } from "stock-nse-india";
const nseIndia = new NseIndia();

async function test() {
    try {
        console.log("Fetching corporate info for TCS...");
        const details = await nseIndia.getEquityCorporateInfo("TCS");
        console.log(JSON.stringify(details, null, 2));
    } catch (err) {
        console.error(err);
    }
}
test();
