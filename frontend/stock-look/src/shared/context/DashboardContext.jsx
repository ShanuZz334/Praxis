import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';
import { FO_INDICES, FO_EQUITIES } from '@/shared/utils/foInstruments';

export const DashboardContext = createContext();

export const useDashboardContext = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }) => {
    const [selectedCategory, setSelectedCategory] = useState("Indices"); // "Indices" or "Companies"
    const [selectedInstrument, setSelectedInstrument] = useState("NSE_INDEX|Nifty 50");
    const [selectedExpiry, setSelectedExpiry] = useState("");
    const [expiries, setExpiries] = useState([]);

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

    const value = {
        selectedCategory,
        setSelectedCategory,
        selectedInstrument,
        setSelectedInstrument,
        selectedExpiry,
        setSelectedExpiry,
        expiries,
        filteredInstruments: selectedCategory === "Indices" ? FO_INDICES : FO_EQUITIES
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};
