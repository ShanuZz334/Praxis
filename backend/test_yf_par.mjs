import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

const modules = [
  "assetProfile", "balanceSheetHistory", "balanceSheetHistoryQuarterly", "calendarEvents", 
  "cashflowStatementHistory", "cashflowStatementHistoryQuarterly", "defaultKeyStatistics", 
  "earnings", "earningsHistory", "earningsTrend", "financialData", "fundOwnership", 
  "fundPerformance", "fundProfile", "incomeStatementHistory", "incomeStatementHistoryQuarterly", 
  "indexTrend", "industryTrend", "insiderHolders", "insiderTransactions", "institutionOwnership", 
  "majorDirectHolders", "majorHoldersBreakdown", "netSharePurchaseActivity", "price", 
  "quoteType", "recommendationTrend", "secFilings", "sectorTrend", "summaryDetail", 
  "summaryProfile", "topHoldings", "upgradeDowngradeHistory"
];

async function test() {
    const symbol = 'TCS.NS';
    try {
        const result = await yahooFinance.quoteSummary(symbol, { modules });
        
        let foundKeys = [];
        
        function searchObj(obj, path) {
            if (obj && typeof obj === 'object') {
                for (const key in obj) {
                    const currentPath = path ? `${path}.${key}` : key;
                    if (key.toLowerCase().includes('face') || key.toLowerCase().includes('par')) {
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
