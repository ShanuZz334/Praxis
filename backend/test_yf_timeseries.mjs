import YahooFinance from 'yahoo-finance2';
import fs from 'fs';
const yahooFinance = new YahooFinance();

async function test() {
    const symbol = 'TCS.NS';
    try {
        const result = await yahooFinance.fundamentalsTimeSeries(symbol, {
            module: 'all',
            type: 'annual',
            period1: '2023-01-01',
            period2: '2026-07-01'
        });
        
        let foundKeys = [];
        function searchObj(obj, path) {
            if (obj && typeof obj === 'object') {
                for (const key in obj) {
                    const currentPath = path ? `${path}.${key}` : key;
                    if (key.toLowerCase().includes('face') || key.toLowerCase().includes('par') || key.toLowerCase().includes('capital') || key.toLowerCase().includes('share')) {
                        foundKeys.push({path: currentPath, val: obj[key]});
                    }
                    searchObj(obj[key], currentPath);
                }
            }
        }
        searchObj(result, '');
        console.log("Found keys:", foundKeys);
    } catch (e) {
        console.error(e.message);
    }
}
test();
