import axios from 'axios';

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
    // --- FUNDAMENTALS ---
    
    async getForwardPE(symbol) {
        // Indian stocks need .NS suffix for Yahoo
        const formattedSymbol = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;
        const summary = await fetchQuoteSummary(formattedSymbol, 'defaultKeyStatistics');
        return summary?.defaultKeyStatistics?.forwardPE?.raw || null;
    },

    async getInterestCoverage(symbol) {
        const formattedSymbol = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;
        const summary = await fetchQuoteSummary(formattedSymbol, 'financialData');
        const operatingIncome = summary?.financialData?.operatingMargins?.raw; // Not perfect for IC, usually EBIT / Interest
        
        // Proper way: fetch incomeStatementHistory
        const incSummary = await fetchQuoteSummary(formattedSymbol, 'incomeStatementHistory');
        const latest = incSummary?.incomeStatementHistory?.incomeStatementHistory?.[0];
        if (latest && latest.ebit?.raw && latest.interestExpense?.raw) {
            // Some companies have negative interest expense in yahoo
            const interest = Math.abs(latest.interestExpense.raw);
            if (interest === 0) return null; // Avoid div by zero
            return latest.ebit.raw / interest;
        }
        return null;
    },

    async getBeta(symbol) {
        const formattedSymbol = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;
        const summary = await fetchQuoteSummary(formattedSymbol, 'defaultKeyStatistics');
        return summary?.defaultKeyStatistics?.beta?.raw || null;
    },

    // --- GLOBAL INDICES & COMMODITIES ---
    
    async getVix() {
        return fetchChartLtp('^VIX');
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