import axios from 'axios';

/**
 * Service for fetching crypto data from CoinGecko API.
 */

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export const coinGeckoService = {
    async getBitcoinPrice() {
        try {
            const url = `${COINGECKO_BASE_URL}/simple/price?ids=bitcoin&vs_currencies=usd`;
            const response = await axios.get(url);
            if (response.data && response.data.bitcoin && response.data.bitcoin.usd) {
                return response.data.bitcoin.usd;
            }
            return null;
        } catch (error) {
            console.error(`CoinGecko API Error fetching Bitcoin:`, error.message);
            throw error;
        }
    }
};