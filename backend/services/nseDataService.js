import axios from 'axios';

/**
 * Service for fetching data from the National Stock Exchange (NSE) API.
 * Uses unofficial/public NSE API endpoints which require specific headers/cookies.
 */

const NSE_BASE_URL = 'https://www.nseindia.com';

// Headers mimicking a browser to bypass basic blocks
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/'
};

// NSE requires a valid session cookie for API calls
let nseCookies = '';

async function fetchNseCookie() {
    try {
        const response = await axios.get(NSE_BASE_URL, { headers, timeout: 5000 });
        nseCookies = response.headers['set-cookie'] ? response.headers['set-cookie'].join('; ') : '';
    } catch (error) {
        console.warn('Failed to fetch NSE cookies, proceeding without them.');
    }
}

async function fetchNseApi(endpoint) {
    if (!nseCookies) await fetchNseCookie();
    
    try {
        const url = `${NSE_BASE_URL}${endpoint}`;
        const response = await axios.get(url, {
            headers: { ...headers, 'Cookie': nseCookies },
            timeout: 8000
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            // Cookie expired, retry once
            await fetchNseCookie();
            const url = `${NSE_BASE_URL}${endpoint}`;
            const retryResponse = await axios.get(url, { headers: { ...headers, 'Cookie': nseCookies } });
            return retryResponse.data;
        }
        console.error(`NSE API Error on ${endpoint}:`, error.message);
        throw error;
    }
}

export const nseDataService = {
    async getPromoterHolding(symbol) {
        // Example: /api/corporate-share-holdings?symbol=RELIANCE
        const data = await fetchNseApi(`/api/corporate-share-holdings?symbol=${encodeURIComponent(symbol)}`);
        // Extract promoter holding from response (simplified structure)
        return data?.data?.[0]?.promoter_holding || null;
    },

    async getNiftyValuation() {
        // Nifty PE/PB/DivYield historically available via index reports or specific endpoints
        // Example placeholder endpoint
        const data = await fetchNseApi(`/api/historical/pepb?index=NIFTY%2050`);
        if (data && data.data && data.data.length > 0) {
            const latest = data.data[0];
            return {
                pe: parseFloat(latest.pe),
                pb: parseFloat(latest.pb),
                divYield: parseFloat(latest.dy)
            };
        }
        return null;
    },

    async getFIIDIIFlows() {
        // FII/DII data is often available on the homepage or specific market activity endpoints
        const data = await fetchNseApi(`/api/fiidiiTradeReact`);
        if (data && data.length > 0) {
            // Usually returns an array where one object is FII and one is DII
            const fii = data.find(d => d.category === 'FII/FPI');
            const dii = data.find(d => d.category === 'DII');
            return {
                fiiFlow: fii ? parseFloat(fii.buyValue) - parseFloat(fii.sellValue) : null,
                diiFlow: dii ? parseFloat(dii.buyValue) - parseFloat(dii.sellValue) : null
            };
        }
        return null;
    },
    
    async getAdvanceDecline() {
        const data = await fetchNseApi(`/api/marketStatus`);
        if (data && data.marketState && data.marketState.length > 0) {
            const state = data.marketState[0];
            return {
                advances: state.advances,
                declines: state.declines
            };
        }
        return null;
    }
};