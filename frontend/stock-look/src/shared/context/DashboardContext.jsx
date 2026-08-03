import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';
import { FO_INDICES, FO_EQUITIES } from '../utils/foInstruments';
import { getNifty50Keys } from '@/features/dashboard/master/data/nifty50';
import socket from '@/shared/utils/socket';

export const DashboardContext = createContext();

export const useDashboardContext = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }) => {
    const [selectedCategory, setSelectedCategory] = useState(() => localStorage.getItem('dash_category') || "Indices");
    const [selectedInstrument, setSelectedInstrument] = useState(() => localStorage.getItem('dash_instrument') || "NSE_INDEX|Nifty 50");
    const [selectedExpiry, setSelectedExpiry] = useState(() => localStorage.getItem('dash_expiry') || "");
    const [expiries, setExpiries] = useState([]);
    const [globalOrderTicket, setGlobalOrderTicket] = useState(null); // { type: 'FULL' | 'QUICK', data: {...} }

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('dash_category', selectedCategory);
    }, [selectedCategory]);

    useEffect(() => {
        localStorage.setItem('dash_instrument', selectedInstrument);
    }, [selectedInstrument]);

    useEffect(() => {
        localStorage.setItem('dash_expiry', selectedExpiry);
    }, [selectedExpiry]);

    const [additionalCharts, setAdditionalCharts] = useState(() => {
        try {
            const saved = localStorage.getItem('praxis_master_charts');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Sanitize: Convert old raw strings into objects or filter them out
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
                setSelectedInstrument(FO_INDICES[0]?.value || "");
                setSelectedExpiry("");
            }
        } else {
            if (!FO_EQUITIES.find(i => i.value === selectedInstrument)) {
                setSelectedInstrument(FO_EQUITIES[0]?.value || "");
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
                        setSelectedExpiry(prev => uniqueExpiries.includes(prev) ? prev : "");
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

    useEffect(() => {
        if (fiiDiiFlow) localStorage.setItem('dash_fiiDiiFlow', JSON.stringify(fiiDiiFlow));
    }, [fiiDiiFlow]);

    useEffect(() => {
        if (smartlists) localStorage.setItem('dash_smartlists', JSON.stringify(smartlists));
    }, [smartlists]);

    useEffect(() => {
        if (sectors) localStorage.setItem('dash_sectors', JSON.stringify(sectors));
    }, [sectors]);

    useEffect(() => {
        if (marketNews) localStorage.setItem('dash_marketNews', JSON.stringify(marketNews));
    }, [marketNews]);

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
        };

        // Flush updates to state exactly once every 500ms
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
        }, 500);

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

        return () => {
            clearInterval(flushInterval);
            socket.off("connect", handleConnect);
            socket.off("market:update", handleMarketUpdate);
            socket.off("market:fiidii", handleFiiDii);
            socket.off("market:smartlists", handleSmartlists);
            socket.off("market:sectors", handleSectors);
            socket.off("market:news", handleNews);
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
        globalOrderTicket,
        setGlobalOrderTicket
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};
