import { NseIndia } from 'stock-nse-india';

/**
 * Service for fetching data from the National Stock Exchange (NSE) API.
 * Uses stock-nse-india library which handles Akamai WAF session headers,
 * cookie jars, and automatic session refreshes reliably.
 * Includes an in-memory TTL cache to eliminate redundant requests and rate limits.
 */

const nse = new NseIndia();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

const memoryCache = {
    fiiDii: { data: null, expiresAt: 0 },
    niftyValuation: { data: null, expiresAt: 0 },
    advanceDecline: { data: null, expiresAt: 0 },
    holdings: new Map() // symbol -> { data, expiresAt }
};

export const nseDataService = {
    /**
     * Get FII / DII net cash flows (Macro market data)
     */
    async getFIIDIIFlows() {
        const now = Date.now();
        if (memoryCache.fiiDii.data && memoryCache.fiiDii.expiresAt > now) {
            return memoryCache.fiiDii.data;
        }

        try {
            const data = await nse.getDataByEndpoint('/api/fiidiiTradeReact');
            if (Array.isArray(data) && data.length > 0) {
                const fii = data.find(d => d.category === 'FII/FPI');
                const dii = data.find(d => d.category === 'DII');
                
                const result = {
                    fiiFlow: fii ? (parseFloat(fii.netValue) || (parseFloat(fii.buyValue) - parseFloat(fii.sellValue))) : null,
                    diiFlow: dii ? (parseFloat(dii.netValue) || (parseFloat(dii.buyValue) - parseFloat(dii.sellValue))) : null,
                    date: data[0]?.date || null
                };

                memoryCache.fiiDii = {
                    data: result,
                    expiresAt: now + CACHE_TTL_MS
                };
                return result;
            }
        } catch (error) {
            console.warn('[NSE Service] FII/DII fetch error (relying on cache or fallback):', error.message);
            // Return stale cache if available
            if (memoryCache.fiiDii.data) return memoryCache.fiiDii.data;
        }
        return null;
    },

    /**
     * Get Nifty 50 PE, PB, and Dividend Yield valuation multiples
     */
    async getNiftyValuation() {
        const now = Date.now();
        if (memoryCache.niftyValuation.data && memoryCache.niftyValuation.expiresAt > now) {
            return memoryCache.niftyValuation.data;
        }

        try {
            const allIndices = await nse.getAllIndices();
            if (allIndices && Array.isArray(allIndices.data)) {
                const nifty = allIndices.data.find(d => d.indexSymbol === 'NIFTY 50' || d.index === 'NIFTY 50');
                if (nifty) {
                    const result = {
                        pe: parseFloat(nifty.pe) || null,
                        pb: parseFloat(nifty.pb) || null,
                        divYield: parseFloat(nifty.dy) || null
                    };
                    memoryCache.niftyValuation = {
                        data: result,
                        expiresAt: now + CACHE_TTL_MS
                    };
                    return result;
                }
            }
        } catch (error) {
            console.warn('[NSE Service] Nifty valuation fetch error:', error.message);
            if (memoryCache.niftyValuation.data) return memoryCache.niftyValuation.data;
        }
        return null;
    },

    /**
     * Get market Advances and Declines
     */
    async getAdvanceDecline() {
        const now = Date.now();
        if (memoryCache.advanceDecline.data && memoryCache.advanceDecline.expiresAt > now) {
            return memoryCache.advanceDecline.data;
        }

        try {
            const stateData = await nse.getMarketStatus();
            if (stateData && Array.isArray(stateData.marketState) && stateData.marketState.length > 0) {
                const state = stateData.marketState[0];
                const result = {
                    advances: parseInt(state.advances, 10) || 0,
                    declines: parseInt(state.declines, 10) || 0
                };
                memoryCache.advanceDecline = {
                    data: result,
                    expiresAt: now + CACHE_TTL_MS
                };
                return result;
            }
        } catch (error) {
            console.warn('[NSE Service] Advance/Decline fetch error:', error.message);
            if (memoryCache.advanceDecline.data) return memoryCache.advanceDecline.data;
        }
        return null;
    },

    /**
     * Get promoter holding for a stock symbol
     */
    async getPromoterHolding(symbol) {
        if (!symbol) return null;
        const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '').toUpperCase();
        const now = Date.now();
        
        const cached = memoryCache.holdings.get(cleanSymbol);
        if (cached && cached.expiresAt > now) {
            return cached.data;
        }

        try {
            const data = await nse.getDataByEndpoint(`/api/corporate-share-holdings?symbol=${encodeURIComponent(cleanSymbol)}`);
            const holding = data?.data?.[0]?.promoter_holding || null;
            memoryCache.holdings.set(cleanSymbol, {
                data: holding,
                expiresAt: now + CACHE_TTL_MS
            });
            return holding;
        } catch (error) {
            console.warn(`[NSE Service] Promoter holding fetch failed for ${cleanSymbol}:`, error.message);
            if (cached) return cached.data;
            return null;
        }
    },

    /**
     * Ping NSE server with a fresh network call to measure authentic live latency
     */
    async ping() {
        const start = performance.now();
        try {
            const stateData = await nse.getMarketStatus();
            const latency = Math.max(1, Math.round(performance.now() - start));
            const marketStatus = stateData?.marketState?.[0]?.marketStatus || "Connected";
            return {
                status: "UP",
                latency,
                sampleData: `Market Status: ${marketStatus} (Live Akamai Connection)`
            };
        } catch (error) {
            const latency = Math.max(1, Math.round(performance.now() - start));
            return {
                status: "OFFLINE",
                latency,
                error: error.message || "NSE Connection Failed"
            };
        }
    },

    /**
     * Reset memory cache
     */
    clearCache() {
        memoryCache.fiiDii = { data: null, expiresAt: 0 };
        memoryCache.niftyValuation = { data: null, expiresAt: 0 };
        memoryCache.advanceDecline = { data: null, expiresAt: 0 };
        memoryCache.holdings.clear();
    }
};