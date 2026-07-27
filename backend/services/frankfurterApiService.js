import axios from 'axios';

/**
 * Service for fetching exchange rates from the free Frankfurter API (ECB-based).
 */

const FRANKFURTER_BASE_URL = 'https://api.frankfurter.app/latest';

export const frankfurterApiService = {
    async getExchangeRate(base, target) {
        try {
            const url = `${FRANKFURTER_BASE_URL}?from=${base}&to=${target}`;
            const response = await axios.get(url);
            if (response.data && response.data.rates && response.data.rates[target]) {
                return response.data.rates[target];
            }
            return null;
        } catch (error) {
            console.error(`Frankfurter API Error fetching ${base}/${target}:`, error.message);
            throw error;
        }
    },

    async getEurUsd() {
        return this.getExchangeRate('EUR', 'USD');
    },

    async getUsdJpy() {
        return this.getExchangeRate('USD', 'JPY');
    }
};