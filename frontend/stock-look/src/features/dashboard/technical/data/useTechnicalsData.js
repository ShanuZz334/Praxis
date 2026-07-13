import { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { useDashboardContext } from '@/shared/context/DashboardContext';

export const useTechnicalsData = (timeframe = "day", indicatorParams = null) => {
    const { selectedInstrument, livePrices } = useDashboardContext();
    const livePricesRef = useRef(livePrices);
    useEffect(() => { livePricesRef.current = livePrices; }, [livePrices]);
    const [liveData, setLiveData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedInstrument) return;

        let isMounted = true;
        let intervalId;

        const fetchTechnicals = async (showLoading = false) => {
            if (showLoading) setLoading(true);
            try {
                const currentLtp = livePricesRef.current?.[selectedInstrument]?.ltp;
                const params = new URLSearchParams({
                    instrument: selectedInstrument,
                    ltp: currentLtp || "",
                    timeframe: timeframe,
                    ...(indicatorParams || {})
                });
                const url = `/api/v1/upstox/technicals?${params.toString()}`;
                const res = await axiosInstance.get(url);
                if (isMounted && res.data?.success) {
                    setLiveData(res.data.data);
                    setError(null);
                }
            } catch (err) {
                console.error("Failed to fetch technicals:", err);
                if (isMounted) setError("Failed to load live technical data");
            } finally {
                if (isMounted && showLoading) setLoading(false);
            }
        };

        // Initial fetch with loading state
        fetchTechnicals(true);

        // Poll every 1 second
        intervalId = setInterval(() => {
            fetchTechnicals(false);
        }, 1000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [selectedInstrument, timeframe, indicatorParams]);

    return { liveData, loading, error };
};




