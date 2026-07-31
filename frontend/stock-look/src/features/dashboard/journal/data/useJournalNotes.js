import { useState, useEffect } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';

export function useJournalNotes(date) {
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!date) return;

    async function fetchNotes() {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/v1/journal/notes?date=${date}`);
        if (isMounted) {
          setNotes(res.data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      }
    }

    fetchNotes();

    return () => {
      isMounted = false;
    };
  }, [date]);

  const saveNotes = async (saveDate, sections) => {
    try {
      const res = await axiosInstance.post('/api/v1/journal/notes', {
        date: saveDate,
        sections
      });
      if (saveDate === date) {
        setNotes(res.data);
      }
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  return { notes, loading, error, saveNotes };
}
