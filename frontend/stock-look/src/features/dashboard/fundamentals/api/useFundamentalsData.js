import { useState, useEffect } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';

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
                // Fetch fundamentals (ratios)
                const fundRes = await axiosInstance.get(API_PATHS.FUNDAMENTALS.GET(instrumentKey));
                
                // Fetch market quote
                let quoteObj = null;
                try {
                    const quoteRes = await axiosInstance.get(`/api/v1/upstox/market-quote?instruments=${encodeURIComponent(instrumentKey)}`);
                    const quoteData = quoteRes.data?.data;
                    if (quoteData && Object.keys(quoteData).length > 0) {
                        quoteObj = Object.values(quoteData)[0];
                    }
                } catch(qe) {
                    console.error("Quote fetch error", qe);
                }

                setData({
                    ...(fundRes.data?.data || {}),
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
