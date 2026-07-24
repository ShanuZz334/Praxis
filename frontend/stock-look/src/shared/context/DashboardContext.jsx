import React, { createContext, useState, useEffect, useContext } from 'react';
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
            return saved ? JSON.parse(saved) : [];
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

        // Rely strictly on WebSocket for live data to conserve Upstox API limits
        // The backend Upstox WebSocket automatically requests a 'full' mode snapshot on subscription

        // 2. Subscribe via WebSockets for zero-latency streaming
        socket.emit("subscribe:instruments", { keys: keysToFetch, mode: "full" });
        socket.emit("request:hydration");

        const handleMarketUpdate = ({ instrumentKey, data }) => {
            // Only update if it's one of the keys we care about
            if (!keysToFetch.includes(instrumentKey)) return;

            setLivePrices(prev => {
                const existing = prev[instrumentKey] || {};
                const ltp = data.ltp || existing.ltp || 0;
                
                // Keep the true close price if available. Don't fake it to ltp, 
                // which causes 0.00% netChange bugs when the market is closed or cp is missing.
                let close = data.cp || data.close || existing.close || 0;
                
                // Only calculate netChange if we actually have a close price
                const netChange = close > 0 ? ltp - close : 0;
                const pctChange = close > 0 ? (netChange / close) * 100 : 0;

                return {
                    ...prev,
                    [instrumentKey]: {
                        ltp,
                        close,
                        netChange,
                        pctChange,
                        volume: data.volume || existing.volume || 0,
                        status: netChange > 0 ? 'up' : netChange < 0 ? 'down' : 'neutral'
                    }
                };
            });
        };

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

        socket.on("market:update", handleMarketUpdate);
        socket.on("market:fiidii", handleFiiDii);
        socket.on("market:smartlists", handleSmartlists);
        socket.on("market:sectors", handleSectors);
        socket.on("market:news", handleNews);

        return () => {
            socket.off("market:update", handleMarketUpdate);
            socket.off("market:fiidii", handleFiiDii);
            socket.off("market:smartlists", handleSmartlists);
            socket.off("market:sectors", handleSectors);
            socket.off("market:news", handleNews);
        };
    }, [selectedInstrument, additionalCharts]);

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
        setAdditionalCharts
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};
