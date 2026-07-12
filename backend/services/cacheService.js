import NodeCache from 'node-cache';

// Initialize a standard cache with a default TTL of 1 hour (3600 seconds)
// Checkperiod determines how often it checks for expired keys (every 2 minutes)
const praxisCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

export const getCache = (key) => {
    return praxisCache.get(key);
};

export const setCache = (key, value, ttlSeconds = 3600) => {
    praxisCache.set(key, value, ttlSeconds);
};

export const deleteCache = (key) => {
    praxisCache.del(key);
};

export const clearCache = () => {
    praxisCache.flushAll();
};

export default praxisCache;
