import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';
import { FO_INDICES, FO_EQUITIES } from '@/shared/utils/foInstruments';
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
                        setSelectedExpiry(""); // Keep placeholder instead of auto-selecting
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
    useEffect(() => {
        const keysToFetch = Array.from(new Set([
            "NSE_INDEX|Nifty 50", 
            "NSE_INDEX|Nifty Bank", 
            "NSE_INDEX|India VIX",
            selectedInstrument
        ].filter(Boolean)));

        // 1. Initial REST Fetch to populate baseline instantly
        const fetchInitialPrices = async () => {
            try {
                const instrumentsStr = encodeURIComponent(keysToFetch.join(','));
                const res = await axiosInstance.get(`/api/v1/upstox/market-quote?instruments=${instrumentsStr}`);
                const data = res.data?.data;
                
                if (data) {
                    setLivePrices(prev => {
                        const newPrices = { ...prev };
                        Object.values(data).forEach(quote => {
                            if (quote && quote.instrument_token) {
                                const key = quote.instrument_token;
                                const ltp = quote.last_price;
                                const netChange = quote.net_change || 0;
                                const prevClose = ltp - netChange;
                                const pctChange = prevClose ? (netChange / prevClose) * 100 : 0;
                                newPrices[key] = { 
                                    ltp, 
                                    close: prevClose,
                                    netChange,
                                    pctChange,
                                    status: netChange > 0 ? 'up' : netChange < 0 ? 'down' : 'neutral' 
                                };
                            }
                        });
                        return newPrices;
                    });
                }
            } catch (error) {
                console.error("Failed to fetch initial live quotes:", error);
            }
        };
        
        fetchInitialPrices();

        // 2. Subscribe via WebSockets for zero-latency streaming
        socket.emit("subscribe:instruments", { keys: keysToFetch, mode: "full" });

        const handleMarketUpdate = ({ instrumentKey, data }) => {
            // Only update if it's one of the global keys we care about
            if (!keysToFetch.includes(instrumentKey)) return;

            setLivePrices(prev => {
                const existing = prev[instrumentKey] || {};
                const ltp = data.ltp || existing.ltp || 0;
                const close = data.close || existing.close || ltp;
                const netChange = ltp - close;
                const pctChange = close ? (netChange / close) * 100 : 0;

                return {
                    ...prev,
                    [instrumentKey]: {
                        ltp,
                        close,
                        netChange,
                        pctChange,
                        status: netChange > 0 ? 'up' : netChange < 0 ? 'down' : 'neutral'
                    }
                };
            });
        };

        socket.on("market:update", handleMarketUpdate);

        return () => {
            socket.off("market:update", handleMarketUpdate);
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
        livePrices
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};
