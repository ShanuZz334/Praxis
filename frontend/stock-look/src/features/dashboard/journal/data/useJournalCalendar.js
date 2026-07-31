import { useState, useEffect } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';

export function useJournalCalendar(year) {
  const [dayMap, setDayMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const currentYear = year || new Date().getFullYear();
        
        const [holidaysRes, summaryRes] = await Promise.all([
          axiosInstance.get(`/api/v1/journal/holidays?year=${currentYear}`),
          axiosInstance.get(`/api/v1/journal/summary?year=${currentYear}`)
        ]);

        const holidaysData = holidaysRes.data?.data || holidaysRes.data || [];
        const summaryData = summaryRes.data?.data || summaryRes.data || [];
        
        // Ensure they are arrays
        const holidays = Array.isArray(holidaysData) ? holidaysData : [];
        const summary = Array.isArray(summaryData) ? summaryData : [];

        const newDayMap = {};

        // Pre-fill weekends for the year
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31);
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const yearStr = d.getFullYear();
          const monthStr = String(d.getMonth() + 1).padStart(2, '0');
          const dayStr = String(d.getDate()).padStart(2, '0');
          const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
          const dayOfWeek = d.getDay();
          
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            newDayMap[dateStr] = { state: 'weekend', pnl: 0, tradesCount: 0 };
          } else {
            newDayMap[dateStr] = { state: 'no-trade', pnl: 0, tradesCount: 0 };
          }
        }

        holidays.forEach(h => {
          if (newDayMap[h.date]) {
            newDayMap[h.date] = { ...newDayMap[h.date], state: 'holiday', holidayReason: h.description || h.reason || h.name || 'Market Closed' };
          }
        });

        summary.forEach(s => {
          if (newDayMap[s.date] && (newDayMap[s.date].state !== 'weekend' && newDayMap[s.date].state !== 'holiday')) {
            // Backend now returns: { date, pnl, tradesCount }
            const dayPnl = s.pnl ?? 0;
            let state = 'no-trade';
            if (dayPnl > 0) state = 'profit';
            else if (dayPnl < 0) state = 'loss';

            newDayMap[s.date] = { 
              ...newDayMap[s.date], 
              state, 
              pnl: dayPnl, 
              tradesCount: s.tradesCount ?? 0
            };
          }
        });

        if (isMounted) {
          setDayMap(newDayMap);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [year]);

  return { dayMap, loading, error };
}
