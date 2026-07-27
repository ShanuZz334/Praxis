import axios from 'axios';
import rateLimiter from '../utils/RateLimitBudgetTracker.js';

/**
 * Service for fetching commodities and other data from Alpha Vantage.
 * Uses a strict daily/minute budget to respect free tier limits (25/day, 5/min).
 */

const AV_BASE_URL = 'https://www.alphavantage.co/query';
const SOURCE_ID = 'Alpha Vantage';
const BUDGET_LIMITS = { requestsPerDay: 25, requestsPerMinute: 5 };

async function fetchAvSeries(functionName, symbolOrInterval, isCommodity = false) {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
        throw new Error('ALPHA_VANTAGE_API_KEY is not configured in environment variables');
    }

    if (!rateLimiter.consume(SOURCE_ID, BUDGET_LIMITS)) {
        throw new Error(`Rate limit exhausted for ${SOURCE_ID}`);
    }

    try {
        let url = `${AV_BASE_URL}?function=${functionName}&apikey=${apiKey}`;
        if (isCommodity) {
            url += `&interval=${symbolOrInterval}`;
        } else {
            url += `&symbol=${symbolOrInterval}`;
        }

        const response = await axios.get(url);
        
        // Handle AV rate limit specific JSON response format
        if (response.data && response.data['Information'] && response.data['Information'].includes('rate limit')) {
            throw new Error(`AV API explicitly returned rate limit error: ${response.data['Information']}`);
        }

        const data = response.data?.data; // Typical commodity format
        if (data && data.length > 0) {
            const val = parseFloat(data[0].value);
            return isNaN(val) ? null : val;
        }
        
        return null;
    } catch (error) {
        console.error(`Alpha Vantage Error fetching ${functionName}:`, error.message);
        throw error;
    }
}

export const alphaVantageService = {
    async getDxy() {
        // DXY isn't a direct commodity, maybe use TIME_SERIES_DAILY
        // But AV doesn't have a direct DXY index ticker in the free tier easily.
        // Might need a different source or fallback to Yahoo.
        throw new Error('DXY fetch from Alpha Vantage not natively supported - engaging fallback.');
    },

    async getGold() {
        return fetchAvSeries('COMMODITY_GOLD', 'monthly', true); // Note: daily might not be free
    },

    async getSilver() {
        return fetchAvSeries('COMMODITY_SILVER', 'monthly', true);
    },

    async getCopper() {
        return fetchAvSeries('COMMODITY_COPPER', 'monthly', true);
    },

    async getNaturalGas() {
        return fetchAvSeries('COMMODITY_NATURAL_GAS', 'monthly', true);
    },

    async getWheat() {
        return fetchAvSeries('COMMODITY_WHEAT', 'monthly', true);
    }
};