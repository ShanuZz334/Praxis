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
        // A939RX0Q048SBEA is Real Gross Domestic Product, Percent Change from Preceding Period
        // For India, we might need a different series or RBI
        // A939RX0Q048SBEA = US GDP. Assuming the user meant US GDP or will override for India.
        return fetchFredSeries('A939RX0Q048SBEA');
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