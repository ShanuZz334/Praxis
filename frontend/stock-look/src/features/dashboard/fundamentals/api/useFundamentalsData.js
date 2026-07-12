import { useState, useEffect } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';
// ─── Intelligent Caching Engine ─────────────────────────────────────────────
const CACHE_KEYS = {
    FUNDAMENTALS: 'praxis_fundamentals_cache',
    QUOTES: 'praxis_quotes_cache'
};

const CACHE_TTL = {
    FUNDAMENTALS: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
    QUOTES: 1 * 60 * 1000              // 1 minute in milliseconds
};

const getFromCache = (cacheName, key, ttl) => {
    try {
        const stored = localStorage.getItem(cacheName);
        if (!stored) return null;
        
        const cache = JSON.parse(stored);
        const entry = cache[key];
        
        if (!entry) return null;
        
        const now = Date.now();
        if (now - entry.timestamp > ttl) {
            // Expired
            delete cache[key];
            localStorage.setItem(cacheName, JSON.stringify(cache));
            return null;
        }
        
        return entry.data;
    } catch (e) {
        console.error("Cache read error", e);
        return null;
    }
};

const saveToCache = (cacheName, key, data) => {
    try {
        const stored = localStorage.getItem(cacheName);
        let cache = stored ? JSON.parse(stored) : {};
        
        // Save the new data with current timestamp
        cache[key] = {
            timestamp: Date.now(),
            data: data
        };
        
        localStorage.setItem(cacheName, JSON.stringify(cache));
    } catch (e) {
        console.error("Cache write error", e);
    }
};
// ────────────────────────────────────────────────────────────────────────────

export const useFundamentalsData = (instrumentKey) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState('--:--');

    useEffect(() => {
        const fetchFundamentals = async () => {
            if (!instrumentKey) {
                setData(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // 1. Fetch Fundamentals (Check Cache First)
                let fundData = getFromCache(CACHE_KEYS.FUNDAMENTALS, instrumentKey, CACHE_TTL.FUNDAMENTALS);
                
                if (!fundData) {
                    const fundRes = await axiosInstance.get(API_PATHS.FUNDAMENTALS.GET(instrumentKey));
                    fundData = fundRes.data?.data || {};
                    if (Object.keys(fundData).length > 0) {
                        saveToCache(CACHE_KEYS.FUNDAMENTALS, instrumentKey, fundData);
                    }
                }
                
                // 2. Fetch Market Quote (Check Cache First)
                let quoteObj = getFromCache(CACHE_KEYS.QUOTES, instrumentKey, CACHE_TTL.QUOTES);
                
                if (!quoteObj) {
                    try {
                        const quoteRes = await axiosInstance.get(`/api/v1/upstox/market-quote?instruments=${encodeURIComponent(instrumentKey)}`);
                        const quoteData = quoteRes.data?.data;
                        if (quoteData && Object.keys(quoteData).length > 0) {
                            quoteObj = Object.values(quoteData)[0];
                            saveToCache(CACHE_KEYS.QUOTES, instrumentKey, quoteObj);
                        }
                    } catch(qe) {
                        console.error("Quote fetch error", qe);
                    }
                }

                setData({
                    ...fundData,
                    quote: quoteObj
                });
                
                setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
            } catch (err) {
                console.error("Failed to fetch fundamentals data:", err);
                setError(err);
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchFundamentals();
    }, [instrumentKey]);

    return { data, loading, error, lastUpdated };
};
