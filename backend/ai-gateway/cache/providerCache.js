import AiProvider from '../../models/AiProvider.js';
// Used the unified core encryption to fix Dual Encryption Key Chaos (Bug 25)
import { decrypt } from '../utils/encryption.js';

let cachedProviders = null;
let lastFetch = 0;
const TTL = 30 * 1000; // 30 seconds
let refreshPromise = null; // Bug 20 Fix: Memoize fetch to prevent thundering herd

export const providerCache = {
    async getProviders() {
        const now = Date.now();
        if (cachedProviders && (now - lastFetch < TTL)) {
            return cachedProviders;
        }
        
        // If a refresh is already in progress, wait for it instead of spanning multiple DB calls
        if (refreshPromise) {
            await refreshPromise;
            return cachedProviders;
        }

        refreshPromise = this.refresh();
        await refreshPromise;
        refreshPromise = null;
        return cachedProviders;
    },

    async getProvider(providerId) {
        const providers = await this.getProviders();
        return providers.find(p => p.providerId === providerId);
    },

    async refresh() {
        try {
            const providers = await AiProvider.find({ isActive: true }).sort({ priority: 1 }).lean();
            cachedProviders = providers.map(p => ({
                ...p,
                apiKey: p.apiKey ? decrypt(p.apiKey) : null
            }));
            lastFetch = Date.now();
            console.log(`[AI Gateway] Refreshed provider cache (${cachedProviders.length} active)`);
        } catch (error) {
            console.error("[AI Gateway] Error refreshing provider cache:", error.message);
            if (!cachedProviders) cachedProviders = [];
        }
    },

    invalidate() {
        cachedProviders = null;
        lastFetch = 0;
    }
};
