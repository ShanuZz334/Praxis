import { useState, useCallback } from 'react';

/**
 * useDrawings — manages drawing state per instrument+timeframe.
 * All drawings stored as { id, type, p1: {price,time}, p2: {price,time}, p3?, color, text? }
 * Coordinates are in chart-space (price+time), NOT pixels — so they survive zoom/pan/resize.
 */
export function useDrawings(instrumentKey, timeframe) {
    const storageKey = `praxis_drawings_${instrumentKey}_${timeframe}`;

    const load = () => {
        try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); }
        catch { return []; }
    };

    const [drawings, setDrawings] = useState(load);

    const save = (next) => {
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
    };

    const addDrawing = useCallback((drawing) => {
        setDrawings(prev => { const next = [...prev, drawing]; save(next); return next; });
    }, [storageKey]);

    const deleteDrawing = useCallback((id) => {
        setDrawings(prev => { const next = prev.filter(d => d.id !== id); save(next); return next; });
    }, [storageKey]);

    const undo = useCallback(() => {
        setDrawings(prev => {
            if (!prev.length) return prev;
            const next = prev.slice(0, -1);
            save(next);
            return next;
        });
    }, [storageKey]);

    const clearAll = useCallback(() => {
        setDrawings([]);
        save([]);
    }, [storageKey]);

    return { drawings, addDrawing, deleteDrawing, undo, clearAll };
}