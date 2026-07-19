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

    // Global Live Price Polling (Fallback to 1-shot fetch, then stream via WebSockets)
    const [fiiDiiFlow, setFiiDiiFlow] = useState(null);
    const [smartlists, setSmartlists] = useState(null);
    const [sectors, setSectors] = useState(null);

    useEffect(() => {
        const keysToFetch = Array.from(new Set([
            "NSE_INDEX|Nifty 50", 
            "NSE_INDEX|Nifty Bank", 
            "NSE_INDEX|India VIX",
            "GLOBAL_INDICATOR|USDINR",
            "GLOBAL_INDICATOR|BZUSD",
            selectedInstrument,
            ...getNifty50Keys()
        ].filter(Boolean)));

        // Rely strictly on WebSocket for live data to conserve Upstox API limits
        // The backend Upstox WebSocket automatically requests a 'full' mode snapshot on subscription

        // 2. Subscribe via WebSockets for zero-latency streaming
        socket.emit("subscribe:instruments", { keys: keysToFetch, mode: "full" });

        const handleMarketUpdate = ({ instrumentKey, data }) => {
            // Only update if it's one of the keys we care about
            if (!keysToFetch.includes(instrumentKey)) return;

            setLivePrices(prev => {
                const existing = prev[instrumentKey] || {};
                const ltp = data.ltp || existing.ltp || 0;
                const close = data.cp || data.close || existing.close || ltp;
                const netChange = ltp - close;
                const pctChange = close ? (netChange / close) * 100 : 0;

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

        socket.on("market:update", handleMarketUpdate);
        socket.on("market:fiidii", handleFiiDii);
        socket.on("market:smartlists", handleSmartlists);
        socket.on("market:sectors", handleSectors);

        return () => {
            socket.off("market:update", handleMarketUpdate);
            socket.off("market:fiidii", handleFiiDii);
            socket.off("market:smartlists", handleSmartlists);
            socket.off("market:sectors", handleSectors);
        };
    }, [selectedInstrument]);

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
        sectors
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};
