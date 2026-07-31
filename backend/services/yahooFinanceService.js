import axios from 'axios';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/**
 * Service for fetching data from the unofficial Yahoo Finance API.
 * Uses query1.finance.yahoo.com v8 chart and v11 quoteSummary endpoints.
 */

const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com';

// Generic headers to avoid blocking
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
};

/**
 * Fetch a single quote from the chart endpoint (for prices/indices).
 */
async function fetchChartLtp(symbol) {
    try {
        const url = `${YAHOO_BASE_URL}/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
        const response = await axios.get(url, { headers });
        const result = response.data?.chart?.result?.[0];
        if (result && result.meta && result.meta.regularMarketPrice) {
            return result.meta.regularMarketPrice;
        }
        return null;
    } catch (error) {
        console.error(`Yahoo Finance Error fetching ${symbol}:`, error.message);
        throw error;
    }
}

/**
 * Fetch detailed fundamentals from quoteSummary endpoint.
 */
async function fetchQuoteSummary(symbol, modules) {
    try {
        const url = `${YAHOO_BASE_URL}/v11/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`;
        const response = await axios.get(url, { headers });
        return response.data?.quoteSummary?.result?.[0];
    } catch (error) {
        console.error(`Yahoo Finance Error fetching summary for ${symbol}:`, error.message);
        throw error;
    }
}

export const yahooFinanceService = {
    /**
     * Resolves an ISIN to a Yahoo Finance Symbol
     */
    async searchByIsin(isin) {
        try {
            if (!isin) return null;
            const result = await yahooFinance.search(isin);
            if (result && result.quotes && result.quotes.length > 0) {
                return result.quotes[0].symbol;
            }
            return null;
        } catch (error) {
            console.error(`Yahoo Finance Error searching by ISIN ${isin}:`, error.message);
            return null;
        }
    },

    // --- MARKET DATA ---
    
    // --- FUNDAMENTALS ---
    
    async getForwardPE(symbol) {
        try {
            let cleanSymbol = symbol.split('-')[0];
            if (cleanSymbol === 'HDFC') cleanSymbol = 'HDFCBANK';
            const formattedSymbol = cleanSymbol.endsWith('.NS') ? cleanSymbol : `${cleanSymbol}.NS`;
            const summary = await yahooFinance.quoteSummary(formattedSymbol, { modules: ['defaultKeyStatistics'] });
            return summary?.defaultKeyStatistics?.forwardPE || null;
        } catch (error) {
            console.error(`Yahoo Finance Error fetching Forward PE for ${symbol}:`, error.message);
            return null;
        }
    },

    async getInterestCoverage(symbol) {
        // Simplified fallback as yahoo-finance2 incomeStatementHistory differs slightly
        return null;
    },

    async getBeta(symbol) {
        try {
            let cleanSymbol = symbol.split('-')[0];
            if (cleanSymbol === 'HDFC') cleanSymbol = 'HDFCBANK';
            const formattedSymbol = cleanSymbol.endsWith('.NS') ? cleanSymbol : `${cleanSymbol}.NS`;
            const summary = await yahooFinance.quoteSummary(formattedSymbol, { modules: ['defaultKeyStatistics'] });
            return summary?.defaultKeyStatistics?.beta || null;
        } catch (error) {
            console.error(`Yahoo Finance Error fetching Beta for ${symbol}:`, error.message);
            return null;
        }
    },

    async getAnalystConsensus(symbol) {
        try {
            let cleanSymbol = symbol.split('-')[0];
            if (cleanSymbol === 'HDFC') cleanSymbol = 'HDFCBANK';
            const formattedSymbol = cleanSymbol.endsWith('.NS') || cleanSymbol.endsWith('.BO') ? cleanSymbol : `${cleanSymbol}.NS`;
            const result = await yahooFinance.quoteSummary(formattedSymbol, { modules: ['financialData'] });
            
            if (result?.financialData) {
                return {
                    consensus: result.financialData.recommendationKey || null,
                    targetPrice: result.financialData.targetMeanPrice || null,
                    analysts: result.financialData.numberOfAnalystOpinions || null
                };
            }
        } catch (error) {
            console.error(`yahoo-finance2 Error fetching analyst consensus for ${symbol}:`, error.message);
        }
        return null;
    },

    async getDividendYield(symbol) {
        try {
            if (!symbol) return null;
            const yfSymbol = symbol.endsWith('.NS') || symbol.endsWith('.BO') ? symbol : `${symbol}.NS`;
            const result = await yahooFinance.quoteSummary(yfSymbol, { modules: ['summaryDetail'] });
            if (result && result.summaryDetail) {
                if (result.summaryDetail.dividendYield !== undefined && result.summaryDetail.dividendYield !== null) {
                    return result.summaryDetail.dividendYield * 100;
                } else if (result.summaryDetail.trailingAnnualDividendYield !== undefined && result.summaryDetail.trailingAnnualDividendYield !== null && result.summaryDetail.trailingAnnualDividendYield > 0) {
                    return result.summaryDetail.trailingAnnualDividendYield * 100;
                } else {
                    // Company doesn't pay dividends or data missing, return null to show '--' in UI
                    return null;
                }
            }
            return null;
        } catch (error) {
            console.error(`Yahoo getDividendYield failed for ${symbol}:`, error.message);
            return null;
        }
    },

    async getEarningsMetrics(symbol) {
        try {
            if (!symbol) return null;
            const yfSymbol = symbol.endsWith('.NS') || symbol.endsWith('.BO') ? symbol : `${symbol}.NS`;
            const result = await yahooFinance.quoteSummary(yfSymbol, { modules: ['defaultKeyStatistics', 'financialData'] });
            
            const metrics = {
                trailingEps: null,
                forwardEps: null,
                profitMargin: null,
            };

            if (result && result.defaultKeyStatistics) {
                metrics.trailingEps = result.defaultKeyStatistics.trailingEps;
                metrics.forwardEps = result.defaultKeyStatistics.forwardEps;
            }
            if (result && result.financialData) {
                if (result.financialData.profitMargins !== undefined) {
                    metrics.profitMargin = result.financialData.profitMargins * 100;
                }
            }
            return metrics;
        } catch (error) {
            console.error(`Yahoo getEarningsMetrics failed for ${symbol}:`, error.message);
            return null;
        }
    },

    async getMarketCap(symbol) {
        try {
            if (!symbol) return null;
            const yfSymbol = symbol.endsWith('.NS') || symbol.endsWith('.BO') ? symbol : `${symbol}.NS`;
            const result = await yahooFinance.quoteSummary(yfSymbol, { modules: ['summaryDetail'] });
            if (result && result.summaryDetail && result.summaryDetail.marketCap !== undefined) {
                return result.summaryDetail.marketCap / 10000000; // Convert to Crores
            }
            return null;
        } catch (error) {
            console.error(`Yahoo getMarketCap failed for ${symbol}:`, error.message);
            return null;
        }
    },

    async getBookValue(symbol) {
        try {
            if (!symbol) return null;
            const yfSymbol = symbol.endsWith('.NS') || symbol.endsWith('.BO') ? symbol : `${symbol}.NS`;
            const result = await yahooFinance.quoteSummary(yfSymbol, { modules: ['defaultKeyStatistics'] });
            if (result && result.defaultKeyStatistics && result.defaultKeyStatistics.bookValue !== undefined) {
                return result.defaultKeyStatistics.bookValue;
            }
            return null;
        } catch (error) {
            console.error(`Yahoo getBookValue failed for ${symbol}:`, error.message);
            return null;
        }
    },

    async getCashConversionCycle(symbol) {
        try {
            if (!symbol) return null;
            const yfSymbol = symbol.endsWith('.NS') || symbol.endsWith('.BO') ? symbol : `${symbol}.NS`;
            const result = await yahooFinance.fundamentalsTimeSeries(yfSymbol, { period1: '2023-01-01', module: 'all', type: 'annual' });
            if (result && result.length > 0) {
                const latest = result[result.length - 1];
                
                let inventoryDays = null;
                let receivableDays = null;
                let payableDays = null;

                const cogs = latest.costOfRevenue;
                const revenue = latest.totalRevenue;

                if (cogs && cogs > 0 && latest.inventory !== undefined) {
                    inventoryDays = (latest.inventory / cogs) * 365;
                }
                if (revenue && revenue > 0 && latest.accountsReceivable !== undefined) {
                    receivableDays = (latest.accountsReceivable / revenue) * 365;
                }
                if (cogs && cogs > 0 && latest.accountsPayable !== undefined) {
                    payableDays = (latest.accountsPayable / cogs) * 365;
                }

                if (inventoryDays !== null || receivableDays !== null || payableDays !== null) {
                    return { inventoryDays, receivableDays, payableDays };
                }
            }
            return null;
        } catch (error) {
            console.error(`Yahoo getCashConversionCycle failed for ${symbol}:`, error.message);
            return null;
        }
    },

    async getInterestCoverage(symbol) {
        try {
            if (!symbol) return null;
            const yfSymbol = symbol.endsWith('.NS') || symbol.endsWith('.BO') ? symbol : `${symbol}.NS`;
            const result = await yahooFinance.fundamentalsTimeSeries(yfSymbol, { period1: '2023-01-01', module: 'all', type: 'annual' });
            if (result && result.length > 0) {
                const latest = result[result.length - 1];
                
                const ebit = latest.EBIT || latest.operatingIncome;
                const interestExpense = latest.interestExpense;

                if (ebit !== undefined && interestExpense !== undefined && interestExpense > 0) {
                    return ebit / interestExpense;
                }
            }
            return null;
        } catch (error) {
            console.error(`Yahoo getInterestCoverage failed for ${symbol}:`, error.message);
            return null;
        }
    },

    // --- GLOBAL INDICES & COMMODITIES ---
    
    async getVix() {
        // India VIX ticker on Yahoo
        return fetchChartLtp('^INDIAVIX');
    },
    
    async getAluminum() {
        return fetchChartLtp('ALI=F');
    },

    async getSP500Futures() {
        return fetchChartLtp('ES=F');
    },

    async getNasdaqFutures() {
        return fetchChartLtp('NQ=F');
    },

    async getDowFutures() {
        return fetchChartLtp('YM=F');
    },

    async getNikkei225() {
        return fetchChartLtp('^N225');
    },

    async getFTSE100() {
        return fetchChartLtp('^FTSE');
    },

    async getDAX40() {
        return fetchChartLtp('^GDAXI');
    },

    async getHangSeng() {
        return fetchChartLtp('^HSI');
    },

    async getShanghaiComposite() {
        return fetchChartLtp('000001.SS');
    },

    async getCAC40() {
        return fetchChartLtp('^FCHI');
    },

    async getEuroStoxx50() {
        return fetchChartLtp('^STOXX50E');
    }
};