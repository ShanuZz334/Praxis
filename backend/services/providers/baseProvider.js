/**
 * @class BaseProvider
 * @desc Abstract base class for all data providers (FMP, TwelveData, Upstox, etc.)
 */
export default class BaseProvider {
    /**
     * @param {string} name - Provider name (identifies in DB)
     */
    constructor(name) {
        if (this.constructor === BaseProvider) {
            throw new Error("Abstract class 'BaseProvider' cannot be instantiated directly.");
        }
        this.name = name;
        this.apiKey = null;
        this.apiSecret = null;
        this.extra = {};
        this.isInitialized = false;
    }

    /**
     * Init: Loads credentials from DB
     * @param {Object} credentials - Decrypted credentials object
     */
    async init(credentials) {
        if (!credentials) {
            throw new Error(`Credentials missing for provider: ${this.name}`);
        }
        this.apiKey = credentials.key;
        this.apiSecret = credentials.secret;
        this.extra = credentials.extra || {};
        this.isInitialized = true;
        console.log(`[${this.name}] Provider initialized.`);
    }

    /**
     * Health Check: Verifies connectivity
     * @returns {Promise<Object>} { status: 'UP'|'DOWN', latency: number }
     */
    async healthCheck() {
        throw new Error("Method 'healthCheck()' must be implemented.");
    }

    /**
     * Rate Limit: Returns current usage
     * @returns {Promise<Object>} { remaining: number, limit: number, reset: timestamp }
     */
    async getRateLimit() {
        return { remaining: null, limit: null, reset: null };
    }

    // --- Standard Data Fetching Methods (Override as needed) ---

    async fetchRealtimeQuotes(symbols) {
        throw new Error("Method 'fetchRealtimeQuotes()' not supported by this provider.");
    }

    async fetchOHLC(symbol, interval, range) {
        throw new Error("Method 'fetchOHLC()' not supported by this provider.");
    }

    async fetchOptionsChain(symbol, expiry) {
        throw new Error("Method 'fetchOptionsChain()' not supported by this provider.");
    }

    async fetchFundamentals(symbol) {
        throw new Error("Method 'fetchFundamentals()' not supported by this provider.");
    }
}
