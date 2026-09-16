import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';
import { FO_INDICES, FO_EQUITIES } from '../utils/foInstruments';
import { getNifty50Keys, NIFTY_50_MAPPING } from '@/features/dashboard/master/data/nifty50';
import socket from '@/shared/utils/socket';
import { saveIntelScore } from '@/shared/utils/intelCache';

export const DashboardContext = createContext();

export const useDashboardContext = () => useContext(DashboardContext) || {};

// Pre-initialize global variable so initial renders of IndicatorCard have the correct value
const initialDashInstrument = localStorage.getItem('dash_instrument') || "NSE_INDEX|Nifty 50";
if (typeof window !== 'undefined' && !window.PRAXIS_GLOBAL_INSTRUMENT) {
    window.PRAXIS_GLOBAL_INSTRUMENT = initialDashInstrument;
}

export function DashboardProvider({ children }) {
    // ─── Page State — now backed by SQLite via /api/v1/preferences/page-state ──
    // Still use localStorage as the INSTANT read (so no flash on first render),
    // then sync to SQLite in the background. On next load, SQLite is the source of truth.
    const [selectedCategory, setSelectedCategory] = useState(() => localStorage.getItem('dash_category') || "Indices");
    const [selectedInstrument, setSelectedInstrument] = useState(() => initialDashInstrument);
    const [selectedExpiry, setSelectedExpiry] = useState(() => localStorage.getItem('dash_expiry') || "");
    const [expiries, setExpiries] = useState([]);
    const [globalOrderTicket, setGlobalOrderTicket] = useState(null);
    const [globalData, setGlobalData] = useState({});

    // Persist page state to BOTH localStorage (instant) AND SQLite (durable)
    const persistPageState = useRef(null);
    useEffect(() => {
        window.PRAXIS_GLOBAL_INSTRUMENT = selectedInstrument;
        localStorage.setItem('dash_category', selectedCategory);
        localStorage.setItem('dash_instrument', selectedInstrument);
        localStorage.setItem('dash_expiry', selectedExpiry);
        // Debounce the SQLite write to avoid hammering on rapid changes
        if (persistPageState.current) clearTimeout(persistPageState.current);
        persistPageState.current = setTimeout(() => {
            fetch('/api/v1/preferences/page-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page_name: 'global',
                    state: { category: selectedCategory, instrument: selectedInstrument, expiry: selectedExpiry }
                })
            }).catch(() => {});
        }, 800);
    }, [selectedCategory, selectedInstrument, selectedExpiry]);

    useEffect(() => {
        let isMounted = true;
        const fetchGlobal = async () => {
            try {
                const res = await axiosInstance.get('/api/v1/data/global');
                if (isMounted && res.data?.status === 'success' && res.data.data) {
                    setGlobalData(res.data.data);
                }
            } catch (err) {}
        };
        fetchGlobal();

        const fetchInitialQuotes = async () => {
            try {
                const keys = "NSE_INDEX|Nifty 50,NSE_INDEX|Nifty Bank,NSE_INDEX|India VIX,GLOBAL_INDEX|SGX NIFTY";
                const res = await axiosInstance.get(`/api/v1/upstox/market-quote?instruments=${encodeURIComponent(keys)}`);
                if (isMounted && res.data?.status === "success" && res.data.data) {
                    setLivePrices(prev => {
                        const nextPrices = { ...prev };
                        Object.keys(res.data.data).forEach(key => {
                            const q = res.data.data[key];
                            if (q && q.last_price) {
                                nextPrices[key] = {
                                    ltp: q.last_price || 0,
                                    netChange: q.net_change || 0,
                                    pctChange: (q.net_change && q.last_price && (q.last_price - q.net_change) !== 0) 
                                        ? (q.net_change / (q.last_price - q.net_change)) * 100 
                                        : 0,
                                    status: q.net_change > 0 ? "up" : q.net_change < 0 ? "down" : "neutral",
                                    close: q.close_price || 0
                                };
                            }
                        });
                        return nextPrices;
                    });
                }
            } catch (err) {
                console.error("Failed to fetch initial market quotes", err);
            }
        };
        fetchInitialQuotes();
        const interval = setInterval(fetchGlobal, 60000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const [additionalCharts, setAdditionalCharts] = useState(() => {
        try {
            const saved = localStorage.getItem('praxis_master_charts');
            if (saved) {
                const parsed = JSON.parse(saved);
                return Array.isArray(parsed) 
                    ? parsed.map(c => typeof c === 'string' ? { value: c, label: c.split('|').pop() } : c).filter(c => c && c.value)
                    : [];
            }
            return [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('praxis_master_charts', JSON.stringify(additionalCharts));
        // Also persist to SQLite page state
        fetch('/api/v1/preferences/page-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page_name: 'master', state: { extra_charts: additionalCharts } })
        }).catch(() => {});
    }, [additionalCharts]);
    
    // Live Prices State
    const [livePrices, setLivePrices] = useState({
        "NSE_INDEX|Nifty 50": { ltp: 0, close: 0, status: 'neutral', netChange: 0, pctChange: 0 },
        "NSE_INDEX|Nifty Bank": { ltp: 0, close: 0, status: 'neutral', netChange: 0, pctChange: 0 }
    });

    // Sync instrument when category changes
    useEffect(() => {
        if (selectedCategory === "Indices") {
            if (!FO_INDICES.find(i => i.value === selectedInstrument)) {
                setSelectedInstrument("");
                setSelectedExpiry("");
            }
        } else {
            if (!FO_EQUITIES.find(i => i.value === selectedInstrument)) {
                setSelectedInstrument("");
                setSelectedExpiry("");
            }
        }
    }, [selectedCategory]);

    // Fetch expiries whenever instrument changes
    useEffect(() => {
        const fetchExpiries = async () => {
            if (!selectedInstrument) return;
            try {
                const res = await axiosInstance.get(API_PATHS.OPTIONS.GET_CONTRACTS(selectedInstrument));
                const contracts = res.data?.data || res.data || [];
                
                if (Array.isArray(contracts) && contracts.length > 0) {
                    const uniqueExpiries = [...new Set(contracts.map(c => c.expiry || c.expiry_date))]
                        .filter(Boolean)
                        .sort((a, b) => new Date(a) - new Date(b));
                        
                    if (uniqueExpiries.length > 0) {
                        setExpiries(uniqueExpiries);
                        setSelectedExpiry(prev => (prev && uniqueExpiries.includes(prev)) ? prev : uniqueExpiries[0]);
                    } else {
                        setExpiries([]);
                        setSelectedExpiry("");
                    }
                } else {
                    setExpiries([]);
                    setSelectedExpiry("");
                }
            } catch (err) {
                console.error("Failed to fetch expiries:", err);
                setExpiries([]);
                setSelectedExpiry("");
            }
        };
        
        fetchExpiries();
    }, [selectedInstrument]);

    // ─── Market Broadcast Caches — now backed by SQLite ──────────────────────
    // On first load: still read from localStorage for zero-flash instant restore.
    // Backend now also seeds these from SQLite so Socket.IO emits fresh data on connect.
    const [fiiDiiFlow, setFiiDiiFlow] = useState(() => {
        try { return JSON.parse(localStorage.getItem('dash_fiiDiiFlow')) || null; } catch { return null; }
    });
    const [smartlists, setSmartlists] = useState(() => {
        try { return JSON.parse(localStorage.getItem('dash_smartlists')) || null; } catch { return null; }
    });
    const [sectors, setSectors] = useState(() => {
        try { return JSON.parse(localStorage.getItem('dash_sectors')) || null; } catch { return null; }
    });
    const [marketNews, setMarketNews] = useState(() => {
        try { return JSON.parse(localStorage.getItem('dash_marketNews')) || null; } catch { return null; }
    });

    // Keep localStorage in sync for instant restore (SQLite handles durability on the backend)
    useEffect(() => { if (fiiDiiFlow) localStorage.setItem('dash_fiiDiiFlow', JSON.stringify(fiiDiiFlow)); }, [fiiDiiFlow]);
    useEffect(() => { if (smartlists) localStorage.setItem('dash_smartlists', JSON.stringify(smartlists)); }, [smartlists]);
    useEffect(() => { if (sectors) localStorage.setItem('dash_sectors', JSON.stringify(sectors)); }, [sectors]);
    useEffect(() => { if (marketNews) localStorage.setItem('dash_marketNews', JSON.stringify(marketNews)); }, [marketNews]);


    // Throttle updates using a ref to prevent React from re-rendering the entire
    // dashboard tree on every single tick (which can be several times a second).
    const pendingUpdatesRef = useRef({});
    // Track all keys we've ever subscribed to (grows dynamically as OrderTicket opens)
    const subscribedKeysRef = useRef(new Set());

    useEffect(() => {
        const keysToFetch = Array.from(new Set([
            "NSE_INDEX|Nifty 50", 
            "NSE_INDEX|Nifty Bank", 
            "NSE_INDEX|India VIX",
            "GLOBAL_INDICATOR|USDINR",
            "GLOBAL_INDICATOR|BZUSD",
            "GLOBAL_INDEX|SGX NIFTY",
            selectedInstrument,
            ...additionalCharts.map(c => typeof c === 'string' ? c : c.value),
            ...getNifty50Keys()
        ].filter(Boolean)));

        // Track all subscribed keys dynamically
        keysToFetch.forEach(k => subscribedKeysRef.current.add(k));

        // Rely strictly on WebSocket for live data to conserve Upstox API limits
        // The backend Upstox WebSocket automatically requests a 'full' mode snapshot on subscription

        // 2. Subscribe via WebSockets for zero-latency streaming
        socket.emit("subscribe:instruments", { keys: keysToFetch, mode: "full" });
        socket.emit("request:hydration");

        const handleMarketUpdate = ({ instrumentKey, data }) => {
            if (!instrumentKey || !data) return;
            const normKey = instrumentKey.replace(':', '|');
            pendingUpdatesRef.current[normKey] = data;
            if (normKey !== instrumentKey) {
                pendingUpdatesRef.current[instrumentKey] = data;
            }
            
            // Map Upstox alias symbols (e.g. NSE_EQ|RELIANCE) back to their subscribed ISIN keys
            if (normKey.startsWith('NSE_EQ|')) {
                const shortSymbol = normKey.split('|')[1];
                if (shortSymbol && NIFTY_50_MAPPING[shortSymbol]) {
                    pendingUpdatesRef.current[NIFTY_50_MAPPING[shortSymbol]] = data;
                }
            }
        };

        // Flush updates to state exactly once every 2000ms
        const flushInterval = setInterval(() => {
            if (Object.keys(pendingUpdatesRef.current).length === 0) return;

            setLivePrices(prev => {
                const nextPrices = { ...prev };
                let hasChanges = false;

                for (const [instrumentKey, data] of Object.entries(pendingUpdatesRef.current)) {
                    const existing = prev[instrumentKey] || {};
                    const ltp = data.ltp || existing.ltp || 0;
                    
                    let close = data.cp || data.close || existing.close || 0;
                    const netChange = close > 0 ? ltp - close : 0;
                    const pctChange = close > 0 ? (netChange / close) * 100 : 0;

                    nextPrices[instrumentKey] = {
                        ltp,
                        close,
                        netChange,
                        pctChange,
                        volume: data.volume || existing.volume || 0,
                        marketDepth: data.marketDepth || existing.marketDepth || null,
                        tbq: data.tbq !== undefined ? data.tbq : (existing.tbq || 0),
                        tsq: data.tsq !== undefined ? data.tsq : (existing.tsq || 0),
                        optionGreeks: data.optionGreeks || existing.optionGreeks || null,
                        iv: data.iv || existing.iv || null,
                        status: netChange > 0 ? 'up' : netChange < 0 ? 'down' : 'neutral'
                    };
                    hasChanges = true;
                }

                // Clear the queue after processing
                pendingUpdatesRef.current = {};

                return hasChanges ? nextPrices : prev;
            });
        }, 2000);

        const handleFiiDii = (data) => setFiiDiiFlow(data);
        const handleSmartlists = (data) => {
            if (data && (data.options || data.futures)) {
                const map = {};
                const allItems = [...(data.options || []), ...(data.futures || [])];
                allItems.forEach(item => {
                    if (!map[item.category]) map[item.category] = [];
                    map[item.category].push(item);
                });
                setSmartlists(map);
            } else {
                setSmartlists(data);
            }
        };
        const handleSectors = (data) => setSectors(data);
        const handleNews = (data) => setMarketNews(data);

        // ── Backend Intelligence Cron → Frontend Score Bridge ──────────────────────
        // The backend cron (backgroundIntelligenceService.js) computes EVT/GLOB/TECH/OPT/FUND
        // scores every 30s–10min (mode-aware) and broadcasts them via 'intelligence:snapshot'.
        // We listen here and immediately write to intelCache localStorage so useMasterComposite
        // reads them in its next render cycle — this is how the Master Dashboard gets live scores
        // without any page needing to be open.
        const handleIntelligenceSnapshot = (payload) => {
            if (!payload) return;
            const instrKey = payload.instrument_key;
            if (!instrKey) return;

            if (payload.fundamental?.composite_score != null)
                saveIntelScore('fund', instrKey, payload.fundamental.composite_score, payload.fundamental.regime, 'socket');
            if (payload.technical?.composite_score != null)
                saveIntelScore('tech', instrKey, payload.technical.composite_score, payload.technical.regime, 'socket');
            if (payload.options?.composite_score != null)
                saveIntelScore('opt', instrKey, payload.options.composite_score, null, 'socket');
            if (payload.global?.composite_score != null)
                saveIntelScore('glob', 'GLOBAL', payload.global.composite_score, payload.global.regime, 'socket');
            if (payload.events?.composite_score != null)
                saveIntelScore('evt', 'GLOBAL', payload.events.composite_score, null, 'socket');

            // Trigger a lightweight re-read of module scores on the dashboard
            // by dispatching a custom event that useMasterComposite can listen for
            window.dispatchEvent(new CustomEvent('praxis:intel:update', { detail: payload }));
        };

        const handleConnect = () => {
            // Resubscribe automatically if socket reconnects (e.g. after server restart)
            socket.emit("subscribe:instruments", { keys: keysToFetch, mode: "full" });
            socket.emit("request:hydration");
        };

        socket.on("connect", handleConnect);
        socket.on("market:update", handleMarketUpdate);
        socket.on("market:fiidii", handleFiiDii);
        socket.on("market:smartlists", handleSmartlists);
        socket.on("market:sectors", handleSectors);
        socket.on("market:news", handleNews);
        socket.on("intelligence:snapshot", handleIntelligenceSnapshot);

        return () => {
            clearInterval(flushInterval);
            socket.emit("unsubscribe:instruments", { keys: keysToFetch });
            socket.off("connect", handleConnect);
            socket.off("market:update", handleMarketUpdate);
            socket.off("market:fiidii", handleFiiDii);
            socket.off("market:smartlists", handleSmartlists);
            socket.off("market:sectors", handleSectors);
            socket.off("market:news", handleNews);
            socket.off("intelligence:snapshot", handleIntelligenceSnapshot);
        };
    }, [selectedInstrument, additionalCharts]);

    /**
     * Called by OrderTicket (or any component) to dynamically subscribe a specific
     * instrument key so it receives live updates including market depth.
     * Idempotent — safe to call multiple times for the same key.
     */
    const subscribeInstrumentKey = (key) => {
        if (!key || !socket) return;
        subscribedKeysRef.current.add(key);
        socket.emit("subscribe:instruments", { keys: [key], mode: "full" });
    };

    const subscribeMultipleInstrumentKeys = (keys) => {
        if (!keys || !keys.length || !socket) return;
        keys.forEach(k => subscribedKeysRef.current.add(k));
        socket.emit("subscribe:instruments", { keys, mode: "full" });
    };

    /**
     * Unsubscribe specific instrument keys to prevent global quota exhaustion
     * when closing dynamic components like options chains or order tickets.
     */
    const unsubscribeInstrumentKey = (key) => {
        if (!key || !socket) return;
        subscribedKeysRef.current.delete(key);
        socket.emit("unsubscribe:instruments", { keys: [key] });
    };

    const unsubscribeMultipleInstrumentKeys = (keys) => {
        if (!keys || !keys.length || !socket) return;
        keys.forEach(k => subscribedKeysRef.current.delete(k));
        socket.emit("unsubscribe:instruments", { keys });
    };

    const value = {
        selectedCategory,
        setSelectedCategory,
        selectedInstrument,
        setSelectedInstrument,
        selectedExpiry,
        setSelectedExpiry,
        expiries,
        filteredInstruments: selectedCategory === "Indices" ? FO_INDICES : FO_EQUITIES,
        livePrices,
        fiiDiiFlow,
        smartlists,
        sectors,
        marketNews,
        additionalCharts,
        setAdditionalCharts,
        subscribeInstrumentKey,
        subscribeMultipleInstrumentKeys,
        unsubscribeInstrumentKey,
        unsubscribeMultipleInstrumentKeys,
        globalOrderTicket,
        setGlobalOrderTicket,
        globalData,
        setGlobalData,
        setLivePrices,
        updateLivePrice: (instrumentKey, quoteData) => {
            if (!instrumentKey || !quoteData) return;
            setLivePrices(prev => {
                const existing = prev[instrumentKey] || {};
                const ltp = quoteData.ltp || quoteData.close || existing.ltp || 0;
                const close = quoteData.close || existing.close || 0;
                const netChange = close > 0 ? ltp - close : (quoteData.netChange ?? existing.netChange ?? 0);
                const pctChange = close > 0 ? (netChange / close) * 100 : (quoteData.pctChange ?? existing.pctChange ?? 0);
                return {
                    ...prev,
                    [instrumentKey]: {
                        ...existing,
                        ...quoteData,
                        ltp,
                        close,
                        netChange,
                        pctChange,
                        status: netChange > 0 ? 'up' : netChange < 0 ? 'down' : 'neutral'
                    }
                };
            });
        },
        openOrderTicket: (instrumentKey) => setGlobalOrderTicket({ instrumentKey, action: "BUY" })
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};
