import { useState, useEffect } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';

export function useMarketBreadth() {
    const [breadthData, setBreadthData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState('--:--');

    useEffect(() => {
        let isMounted = true;
        const fetchBreadth = async () => {
            try {
                const res = await axiosInstance.get('/api/v1/technical/breadth');
                if (isMounted && res.data?.data) {
                    setBreadthData(res.data.data);
                    setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
                    setError(null);
                }
            } catch (err) {
                if (isMounted) setError(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchBreadth();
        const interval = setInterval(fetchBreadth, 3 * 60 * 1000); // refresh every 3 minutes

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return { breadthData, loading, error, lastUpdated };
}
