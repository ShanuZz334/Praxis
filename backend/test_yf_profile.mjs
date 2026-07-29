import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
    const symbol = 'TCS.NS';
    try {
        const result = await yahooFinance.quoteSummary(symbol, { modules: ['assetProfile', 'summaryProfile', 'balanceSheetHistory'] });
        console.log("assetProfile:", result.assetProfile);
        console.log("summaryProfile:", result.summaryProfile);
    } catch (e) {
        console.error(e);
    }
}

test();
