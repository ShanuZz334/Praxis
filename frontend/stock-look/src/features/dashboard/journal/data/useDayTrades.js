import { useState, useEffect } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';

export function useDayTrades(date) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!date) return;

    async function fetchTrades() {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/v1/journal/trades?date=${date}`);
        if (isMounted) {
          const raw = res.data?.data ?? res.data?.trades ?? res.data ?? [];
          setTrades(Array.isArray(raw) ? raw : []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      }
    }

    fetchTrades();

    return () => {
      isMounted = false;
    };
  }, [date]);

  return { trades, loading, error };
}
