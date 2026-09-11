import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';

export function useJournalNotes(date) {
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async () => {
    if (!date) return;
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/v1/journal/notes?date=${date}`);
      const data = res.data?.data ?? res.data ?? null;
      setNotes(data);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const saveNotes = async (saveData, sectionsParam) => {
    try {
      let payload = {};
      if (typeof saveData === 'string') {
        payload = { date: saveData, ...(sectionsParam || {}) };
      } else {
        payload = { date, ...(saveData || {}) };
      }

      const res = await axiosInstance.post('/api/v1/journal/notes', payload);
      // Immediately refresh or update state
      await fetchNotes();
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  return { notes, loading, error, saveNotes, refetch: fetchNotes };
}
