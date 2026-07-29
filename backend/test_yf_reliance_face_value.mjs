import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
    const symbol = 'RELIANCE.NS';
    try {
        const result = await yahooFinance.fundamentalsTimeSeries(symbol, {
            module: 'all',
            type: 'annual',
            period1: '2023-01-01',
            period2: '2026-07-01'
        });
        const latest = result[0]; // Wait, result is an array of objects representing years
        if (latest) {
            const capitalStock = latest.capitalStock;
            const ordinaryShares = latest.ordinarySharesNumber;
            console.log("RELIANCE Capital Stock:", capitalStock);
            console.log("RELIANCE Ordinary Shares:", ordinaryShares);
            if (capitalStock && ordinaryShares) {
                console.log("Calculated Face Value:", capitalStock / ordinaryShares);
            }
        }
    } catch (e) {
        console.error(e.message);
    }
}
test();
