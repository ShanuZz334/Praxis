import axios from 'axios';

/**
 * Service for fetching macroeconomic data from FRED API.
 * Requires FRED_API_KEY in environment variables.
 */

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

async function fetchFredSeries(seriesId) {
    const apiKey = process.env.FRED_API_KEY;
    if (!apiKey) {
        throw new Error('FRED_API_KEY is not configured in environment variables');
    }

    try {
        const url = `${FRED_BASE_URL}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
        const response = await axios.get(url);
        const observations = response.data?.observations;
        if (observations && observations.length > 0) {
            const val = parseFloat(observations[0].value);
            return isNaN(val) ? null : val;
        }
        return null;
    } catch (error) {
        console.error(`FRED API Error fetching ${seriesId}:`, error.message);
        throw error;
    }
}

export const fredApiService = {
    async getGDPGrowth() {
        // INDNGDPRPCPPPT = National Accounts: Real Gross Domestic Product for India (Percent Change)
        return fetchFredSeries('INDNGDPRPCPPPT');
    },

    async getCPIInflation() {
        // FPCPITOTLZGIND = Inflation, consumer prices for India
        return fetchFredSeries('FPCPITOTLZGIND');
    },

    async getRepoRate() {
        // IRSTCB01INM156N = Interest Rates: Immediate Rates (< 24 Hours): Central Bank Rates: Total for India
        return fetchFredSeries('IRSTCB01INM156N');
    },

    async getFiscalDeficit() {
        // INDGGXCNLG01GDPPT = Fiscal Situation of General Government: Net Lending/borrowing for India (Percent of Fiscal Year GDP)
        // FRED returns this as a negative number (e.g., -6.55), but the UI expects a positive deficit.
        const val = await fetchFredSeries('INDGGXCNLG01GDPPT');
        return val !== null ? Math.abs(val) : null;
    },

    async getUS10YYield() {
        // DGS10 = Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity
        return fetchFredSeries('DGS10');
    },

    async getGlobalLiquidity() {
        // WM2NS = M2 Money Stock (Proxy for Global Liquidity if we use US M2)
        // WALCL = Assets: Total Assets: Total Assets (Less Eliminations from Consolidation)
        return fetchFredSeries('WM2NS');
    }
};