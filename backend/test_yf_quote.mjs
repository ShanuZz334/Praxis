import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
    const symbol = 'TCS.NS';
    try {
        const result = await yahooFinance.quote(symbol);
        console.log("quote:", result);
    } catch (e) {
        console.error(e);
    }
}

test();
