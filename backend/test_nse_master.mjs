import { NseIndia } from "stock-nse-india";
const nseIndia = new NseIndia();

async function test() {
    try {
        console.log("Fetching equity master...");
        const master = await nseIndia.getEquityMaster();
        console.log(Object.keys(master));
    } catch (err) {
        console.error(err);
    }
}
test();
