import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Service for fetching macroeconomic data from RBI DBIE (Database on Indian Economy) or alternative sources.
 * Note: RBI DBIE is notoriously difficult to scrape reliably due to ASP.NET viewstates and CAPTCHAs.
 * This service provides the structural endpoints. If DBIE fails, these will throw and engage the fallback chain.
 */

export const rbiApiService = {
    async getCPIInflation() {
        // Placeholder for DBIE scrape or alternative API (e.g., MOSPI)
        throw new Error('CPI Inflation fetch from RBI not fully implemented - engaging fallback.');
    },

    async getRepoRate() {
        // The repo rate is often published on the RBI home page.
        // A simple scrape of the RBI homepage could work, but for stability we rely on the fallback wrapper.
        throw new Error('Repo Rate fetch from RBI not fully implemented - engaging fallback.');
    },

    async getFiscalDeficit() {
        throw new Error('Fiscal Deficit fetch from RBI not fully implemented - engaging fallback.');
    },

    async getCreditGrowth() {
        // Fetch Bank Credit to Private Non-Financial Sector (QINPBM770A) from FRED and compute YoY
        try {
            const apiKey = process.env.FRED_API_KEY;
            if (apiKey) {
                const url = `https://api.stlouisfed.org/fred/series/observations?series_id=QINPBM770A&api_key=${apiKey}&file_type=json&sort_order=desc&limit=5`;
                const response = await axios.get(url, { timeout: 5000 });
                if (response.data && response.data.observations && response.data.observations.length >= 5) {
                    const current = parseFloat(response.data.observations[0].value);
                    const lastYear = parseFloat(response.data.observations[4].value);
                    if (!isNaN(current) && !isNaN(lastYear) && lastYear !== 0) {
                        const yoy = ((current - lastYear) / lastYear) * 100;
                        return parseFloat(yoy.toFixed(2));
                    }
                }
            }
        } catch (e) {
            console.error('Credit Growth fetch failed:', e.message);
        }
        throw new Error('Credit Growth fetch failed - engaging fallback.');
    },

    async getSystemLiquidity() {
        // LAF (Liquidity Adjustment Facility) outstanding
        throw new Error('System Liquidity fetch from RBI not fully implemented - engaging fallback.');
    },

    async getNPARatio() {
        // Gross NPA ratio of SCBs
        throw new Error('NPA Ratio fetch from RBI not fully implemented - engaging fallback.');
    },

    async getCorporateDebt() {
        // Fetch India Corporate Debt to GDP from FRED API (QINNAM770A)
        try {
            const apiKey = process.env.FRED_API_KEY;
            if (apiKey) {
                // QINNAM770A = Total Credit to Non-Financial Corporations, Adjusted for Breaks, for India (% of GDP)
                const url = `https://api.stlouisfed.org/fred/series/observations?series_id=QINNAM770A&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
                const response = await axios.get(url, { timeout: 5000 });
                if (response.data && response.data.observations && response.data.observations.length > 0) {
                    const value = parseFloat(response.data.observations[0].value);
                    if (!isNaN(value)) {
                        return value; 
                    }
                }
            }
        } catch (e) {
            console.error('Corporate Debt fetch failed:', e.message);
        }
        throw new Error('Corporate Debt fetch failed - engaging fallback.');
    },
};