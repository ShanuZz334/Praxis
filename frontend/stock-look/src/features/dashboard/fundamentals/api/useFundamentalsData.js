import { useState, useEffect } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';

// ─── TTL Helper (same logic as before — determines when to force a fresh fetch) ──
const getFundamentalTTL = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + (3600000 * 5.5));
    const day = istTime.getDay();
    const hours = istTime.getHours();
    if (day === 0 || day === 6) return 24 * 60 * 60 * 1000;     // Weekend: 24h
    if (hours >= 9 && hours <= 16) return 3 * 60 * 60 * 1000;   // Market hours: 3h
    return 12 * 60 * 60 * 1000;                                  // Pre/post: 12h
};

const QUOTES_TTL_MS = 1 * 60 * 1000; // 1 minute

// ─── In-memory quote micro-cache (quotes are 1-min TTL, not worth SQLite writes) ──
const quoteCache = {};

const getCachedQuote = (key) => {
    const entry = quoteCache[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > QUOTES_TTL_MS) { delete quoteCache[key]; return null; }
    return entry.data;
};
const setCachedQuote = (key, data) => { quoteCache[key] = { ts: Date.now(), data }; };

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useFundamentalsData(instrumentKey) {
    const [data, setData] = useState(null);
    const [snapshot, setSnapshot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState('--:--');

    useEffect(() => {
        if (!instrumentKey) {
            setData(null); setSnapshot(null); setLoading(false);
            return;
        }

        let cancelled = false;

        const fetchFundamentals = async () => {
            setLoading(true);
            setError(null);

            // ── 1. Try SQLite cache first (replaces localStorage getFromCache) ──
            try {
                const cacheRes = await axiosInstance.get(
                    `/api/v1/upstox/fundamentals/cache?instrument_key=${encodeURIComponent(instrumentKey)}`
                );
                if (!cancelled && cacheRes.data?.status === 'success' && cacheRes.data.data) {
                    const cachedData = cacheRes.data.data;
                    const cachedAt = cacheRes.data.updated_at ? new Date(cacheRes.data.updated_at).getTime() : 0;
                    const age = Date.now() - cachedAt;

                    if (age < getFundamentalTTL()) {
                        // Cache is still fresh — use it, fetch quote in parallel
                        const timeStr = cacheRes.data.updated_at
                            ? new Date(cacheRes.data.updated_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                            : '--:--';

                        let quoteObj = getCachedQuote(instrumentKey);
                        if (!quoteObj) {
                            try {
                                const qr = await axiosInstance.get(`/api/v1/upstox/market-quote?instruments=${encodeURIComponent(instrumentKey)}`);
                                const qd = qr.data?.data;
                                if (qd && Object.keys(qd).length > 0) { quoteObj = Object.values(qd)[0]; setCachedQuote(instrumentKey, quoteObj); }
                            } catch (qe) { console.error('Quote fetch error', qe); }
                        }
                        if (!cancelled) {
                            setData({ ...cachedData, quote: quoteObj });
                            setLastUpdated(timeStr);
                            setLoading(false);
                        }

                        // Fetch snapshot separately (non-blocking)
                        axiosInstance.get(`/api/v1/intelligence/latest?instrument_key=${encodeURIComponent(instrumentKey)}`)
                            .then(sr => { if (!cancelled) setSnapshot(sr.data?.data || null); })
                            .catch(() => {});
                        return;
                    }
                }
            } catch (cacheErr) {
                // Cache miss or network error — fall through to fresh fetch
                console.warn('[useFundamentalsData] Cache fetch failed, fetching fresh:', cacheErr.message);
            }

            // ── 2. SQLite stale or miss — fetch fresh from Upstox API ──
            if (!cancelled) { setData(null); setSnapshot(null); }

            try {
                const upstoxPromise = axiosInstance.get(API_PATHS.FUNDAMENTALS.GET(instrumentKey))
                    .catch(e => { console.error('Upstox fetch failed', e); return { data: { data: {} } }; });
                const snapshotPromise = axiosInstance.get(`/api/v1/intelligence/latest?instrument_key=${encodeURIComponent(instrumentKey)}`)
                    .catch(e => { console.error('Snapshot fetch failed', e); return { data: { data: null } }; });

                const [upstoxRes, snapshotRes] = await Promise.all([upstoxPromise, snapshotPromise]);
                const fundData = upstoxRes.data?.data || {};
                const snapshotData = snapshotRes.data?.data || null;

                // Fetch quote
                let quoteObj = getCachedQuote(instrumentKey);
                if (!quoteObj) {
                    try {
                        const qr = await axiosInstance.get(`/api/v1/upstox/market-quote?instruments=${encodeURIComponent(instrumentKey)}`);
                        const qd = qr.data?.data;
                        if (qd && Object.keys(qd).length > 0) { quoteObj = Object.values(qd)[0]; setCachedQuote(instrumentKey, quoteObj); }
                    } catch (qe) { console.error('Quote fetch error', qe); }
                }

                if (!cancelled) {
                    setData({ ...fundData, quote: quoteObj });
                    setSnapshot(snapshotData);
                    setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
                }
                // Note: SQLite write happens automatically on the backend when /fundamentals is fetched
            } catch (err) {
                console.error('Failed to fetch fundamentals data:', err);
                if (!cancelled) { setError(err); setData(null); setSnapshot(null); }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchFundamentals();
        return () => { cancelled = true; };
    }, [instrumentKey]);

    return { data, snapshot, loading, error, lastUpdated };
}
