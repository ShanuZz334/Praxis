import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * useDrawings — manages drawing state per instrument+timeframe.
 * L1: localStorage (instant read, zero-flash).
 * L2: SQLite via /api/v1/preferences/drawings (durable, survives localStorage clear).
 * All drawings stored as { id, type, p1: {price,time}, p2: {price,time}, p3?, color, text? }
 * Coordinates are in chart-space (price+time), NOT pixels — survive zoom/pan/resize.
 */
export function useDrawings(instrumentKey, timeframe) {
    const storageKey = `praxis_drawings_${instrumentKey}_${timeframe}`;
    const debounceRef = useRef(null);

    // L1: instant localStorage read
    const load = () => {
        try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); }
        catch { return []; }
    };

    const [drawings, setDrawings] = useState(load);

    // On mount: hydrate from SQLite (L2) if localStorage is empty
    useEffect(() => {
        if (!instrumentKey || !timeframe) return;
        const local = load();
        if (local.length > 0) return; // Already have drawings in L1 — don't overwrite

        const params = new URLSearchParams({ instrument_key: instrumentKey, timeframe });
        fetch(`/api/v1/preferences/drawings?${params}`)
            .then(r => r.json())
            .then(res => {
                if (res.status === 'success' && Array.isArray(res.data) && res.data.length > 0) {
                    setDrawings(res.data);
                    localStorage.setItem(storageKey, JSON.stringify(res.data));
                }
            })
            .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instrumentKey, timeframe]);

    const save = (next) => {
        // L1: instant localStorage write
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
        // L2: debounced SQLite write via dedicated endpoint (500ms after last change)
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetch('/api/v1/preferences/drawings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instrument_key: instrumentKey, timeframe, drawings: next })
            }).catch(() => {});
        }, 500);
    };

    const addDrawing = useCallback((drawing) => {
        setDrawings(prev => { const next = [...prev, drawing]; save(next); return next; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey, instrumentKey, timeframe]);

    const deleteDrawing = useCallback((id) => {
        setDrawings(prev => { const next = prev.filter(d => d.id !== id); save(next); return next; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey, instrumentKey, timeframe]);

    const undo = useCallback(() => {
        setDrawings(prev => {
            if (!prev.length) return prev;
            const next = prev.slice(0, -1);
            save(next);
            return next;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey, instrumentKey, timeframe]);

    const clearAll = useCallback(() => {
        setDrawings([]);
        save([]);
        // Also clear from backend
        const params = new URLSearchParams({ instrument_key: instrumentKey, timeframe });
        fetch(`/api/v1/preferences/drawings?${params}`, { method: 'DELETE' }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey, instrumentKey, timeframe]);

    return { drawings, addDrawing, deleteDrawing, undo, clearAll };
}

