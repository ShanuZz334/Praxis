import { useState, useEffect } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';
// ─── Intelligent Caching Engine ─────────────────────────────────────────────
const CACHE_KEYS = {
    FUNDAMENTALS: 'praxis_fundamentals_cache_v2',
    QUOTES: 'praxis_quotes_cache'
};

const getFundamentalTTL = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + (3600000 * 5.5));
    
    const day = istTime.getDay();
    const hours = istTime.getHours();
    
    // Weekend: Safe to cache for 24 hours
    if (day === 0 || day === 6) return 24 * 60 * 60 * 1000; 
    
    // Market Hours (9 AM - 4 PM): Cache for 3 hours (Forces fetch at Open, Midday, Close)
    if (hours >= 9 && hours <= 16) return 3 * 60 * 60 * 1000; 
    
    // Post-Market / Pre-Market: Cache for 12 hours
    return 12 * 60 * 60 * 1000;
};

const CACHE_TTL = {
    QUOTES: 1 * 60 * 1000 // 1 minute in milliseconds
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

export function useFundamentalsData(instrumentKey) {
    const [data, setData] = useState(null);
    const [snapshot, setSnapshot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState('--:--');

    useEffect(() => {
        const fetchFundamentals = async () => {
            if (!instrumentKey) {
                setData(null);
                setSnapshot(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            const cachedData = getFromCache(CACHE_KEYS.FUNDAMENTALS, instrumentKey, getFundamentalTTL());
            const cachedTime = cachedData ? new Date(JSON.parse(localStorage.getItem(CACHE_KEYS.FUNDAMENTALS))[instrumentKey].timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '--:--';

            try {
                // 1. Fetch Both Data Sources Concurrently
                const upstoxPromise = axiosInstance.get(API_PATHS.FUNDAMENTALS.GET(instrumentKey)).catch(e => { console.error("Upstox fetch failed", e); return { data: { data: {} } }; });
                const snapshotPromise = axiosInstance.get(`/api/v1/intelligence/latest?instrument_key=${encodeURIComponent(instrumentKey)}`).catch(e => { console.error("Snapshot fetch failed", e); return { data: { data: null } }; });

                const [upstoxRes, snapshotRes] = await Promise.all([upstoxPromise, snapshotPromise]);

                const fundData = upstoxRes.data?.data || {};
                const snapshotData = snapshotRes.data?.data || null;

                saveToCache(CACHE_KEYS.FUNDAMENTALS, instrumentKey, { fundData, snapshotData });
                
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

                setData({ ...fundData, quote: quoteObj });
                setSnapshot(snapshotData);
                const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                setLastUpdated(timeStr);
            } catch (err) {
                console.error("Failed to fetch fundamentals data:", err);
                if (cachedData) {
                    setData(cachedData.fundData);
                    setSnapshot(cachedData.snapshotData);
                    setLastUpdated(cachedTime);
                    setLoading(false);
                    return;
                }
                setError(err);
                setData(null);
                setSnapshot(null);
            } finally {
                setLoading(false);
            }
        };

        fetchFundamentals();
    }, [instrumentKey]);

    return { data, snapshot, loading, error, lastUpdated };
};
