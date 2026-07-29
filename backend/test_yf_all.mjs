import YahooFinance from 'yahoo-finance2';
import fs from 'fs';
const yahooFinance = new YahooFinance();

async function test() {
    const symbol = 'TCS.NS';
    try {
        const result = await yahooFinance.quoteSummary(symbol, { modules: ['all'] });
        fs.writeFileSync('yf_all_modules.json', JSON.stringify(result, null, 2));
        console.log("Written to yf_all_modules.json");
    } catch (e) {
        console.error(e);
    }
}

test();
