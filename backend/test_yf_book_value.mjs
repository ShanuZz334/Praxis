import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
    const symbol = 'TCS.NS';
    try {
        const defaultKeyStats = await yahooFinance.quoteSummary(symbol, { modules: ['defaultKeyStatistics', 'financialData', 'summaryDetail', 'price'] });
        console.log("defaultKeyStatistics:", defaultKeyStats.defaultKeyStatistics);
        console.log("financialData:", defaultKeyStats.financialData);
        console.log("summaryDetail:", defaultKeyStats.summaryDetail);
        console.log("price:", defaultKeyStats.price);
    } catch (e) {
        console.error(e);
    }
}

test();
