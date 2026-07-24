import { useState, useCallback, useRef } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';

/**
 * useCardInsight — the single shared hook for ALL 121 cards + page headers.
 *
 * This is the core Phase 0 hook. Every card in the dashboard calls this
 * with its unique targetId. The hook:
 *   1. Calls POST /api/v1/ai-prompts/generate/:targetId (which fetches the
 *      real saved system instruction from Prompts Studio + calls AI Gateway)
 *   2. The backend persists the exchange to that targetId's thread automatically
 *   3. Returns { insight, isLoading, error, generate }
 *
 * @param {string} targetId  — the unique card ID from card-inventory.json
 *                             e.g. "nifty_pe", "rsi", "global_dxy"
 */
export function useCardInsight(targetId) {
    const [insight, setInsight] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [meta, setMeta] = useState(null); // { provider, model, latencyMs, usedCustomPrompt }

    // Refs for throttling
    const mountedRef = useRef(true);
    const lastExecuteRef = useRef(0);
    const timeoutRef = useRef(null);
    const latestArgsRef = useRef(null);

    const executeGenerate = useCallback(async (options) => {
        const {
            value,
            displayName,
            stockSymbol,
            scope = 'card',
            additionalContext = null,
            pageData = null
        } = options;
        if (!targetId) {
            console.warn('[useCardInsight] No targetId provided — skipping');
            return;
        }

        if (value === null || value === undefined || value === '--' || value === '') {
            setInsight(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await axiosInstance.post(
                `/api/v1/ai-prompts/generate/${targetId}`,
                { value, displayName, stockSymbol, scope, additionalContext, pageData }
            );

            if (!mountedRef.current) return;

            if (res.data?.insight) {
                setInsight(res.data.insight);
                setMeta({
                    provider: res.data.provider,
                    model: res.data.model,
                    latencyMs: res.data.latencyMs,
                    usedCustomPrompt: res.data.usedCustomPrompt,
                    cached: res.data.cached
                });
            } else {
                setInsight(null);
            }
        } catch (err) {
            if (!mountedRef.current) return;
            console.error(`[useCardInsight] Error for ${targetId}:`, err.message);
            setError(err.response?.data?.error || err.message);
        } finally {
            if (mountedRef.current) setIsLoading(false);
        }
    }, [targetId]);

    /**
     * generate — public facing function that throttles calls to executeGenerate.
     * Ensures we only hit the AI once every 10 seconds max.
     */
    const generate = useCallback((options = {}) => {
        if (!targetId) {
            console.warn('[useCardInsight] No targetId provided — skipping');
            return;
        }

        const now = Date.now();
        const timeSinceLast = now - lastExecuteRef.current;
        latestArgsRef.current = options;

        if (timeSinceLast >= 10000) {
            // It's been over 10s, fire immediately
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            lastExecuteRef.current = now;
            executeGenerate(latestArgsRef.current);
        } else {
            // Within 10s, schedule a trailing execution
            if (!timeoutRef.current) {
                timeoutRef.current = setTimeout(() => {
                    timeoutRef.current = null;
                    if (!mountedRef.current) return;
                    lastExecuteRef.current = Date.now();
                    executeGenerate(latestArgsRef.current);
                }, 10000 - timeSinceLast);
            }
        }
    }, [executeGenerate, targetId]);

    return { insight, isLoading, error, meta, generate };
}

/**
 * useCardThread — fetch the persisted insight/chat history for a targetId.
 * Used by the Chat/Insight History sidebar to display past entries.
 *
 * @param {string} targetId
 * @param {string} scope    — 'card' | 'page' | 'global'
 */
export function useCardThread(targetId, scope = 'card') {
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchThread = useCallback(async () => {
        if (!targetId) return;
        setIsLoading(true);
        try {
            const res = await axiosInstance.get(
                `/api/v1/ai-prompts/thread/${targetId}`,
                { params: { scope } }
            );
            setEntries(res.data?.entries || []);
        } catch (err) {
            console.error(`[useCardThread] Error for ${targetId}:`, err.message);
        } finally {
            setIsLoading(false);
        }
    }, [targetId, scope]);

    const clearThread = useCallback(async () => {
        if (!targetId) return;
        try {
            await axiosInstance.delete(`/api/v1/ai-prompts/thread/${targetId}`, {
                params: { scope }
            });
            setEntries([]);
        } catch (err) {
            console.error(`[useCardThread] Clear error for ${targetId}:`, err.message);
        }
    }, [targetId, scope]);

    /**
     * sendMessage — send a chat message, optionally with resolved #mention card snapshots.
     *
     * @param {string}   message       - The user's message text
     * @param {object}   contextData   - Optional additional context (legacy, always {})
     * @param {Array}    cardSnapshots - Card data from resolved #cardId mentions
     *                                   [{ cardId, displayName, value, score, signal, additionalContext }]
     */
    const sendMessage = useCallback(async (message, contextData = {}, cardSnapshots = []) => {
        if (!targetId || !message) return null;
        setIsGenerating(true);
        try {
            const res = await axiosInstance.post(
                `/api/v1/ai-prompts/chat/${targetId}`,
                { message, scope, contextData, cardSnapshots }
            );
            await fetchThread();
            return res.data;
        } catch (err) {
            console.error(`[useCardThread] Send error for ${targetId}:`, err.message);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, [targetId, scope, fetchThread]);


    return { entries, isLoading, isGenerating, fetchThread, clearThread, sendMessage };
}

/**
 * useCardPrompt — fetch & save the system instruction for a targetId.
 * Used by Prompts Studio to load the current prompt and save edits.
 *
 * @param {string} targetId
 */
export function useCardPrompt(targetId) {
    const [systemInstruction, setSystemInstruction] = useState('');
    const [presets, setPresets] = useState([]);
    const [activePresetId, setActivePresetId] = useState('default');
    const [isDefault, setIsDefault] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [goldenRules, setGoldenRules] = useState('');

    const fetchPrompt = useCallback(async () => {
        if (!targetId) return;
        setIsLoading(true);
        try {
            const res = await axiosInstance.get(`/api/v1/ai-prompts/${targetId}`);
            setSystemInstruction(res.data?.systemInstruction || '');
            setPresets(res.data?.presets || []);
            setActivePresetId(res.data?.activePresetId || 'default');
            setIsDefault(res.data?.isDefault ?? true);
            setGoldenRules(res.data?.goldenRules || '');
        } catch (err) {
            console.error(`[useCardPrompt] Fetch error for ${targetId}:`, err.message);
        } finally {
            setIsLoading(false);
        }
    }, [targetId]);

    const savePrompt = useCallback(async ({
        systemInstruction: overrideInstruction,  // explicit override beats hook state
        displayName,
        page,
        isHeaderPrompt,
        applicability,
        overrideActivePresetId,
        overridePresets
    } = {}) => {
        if (!targetId) return;
        setIsSaving(true);
        try {
            await axiosInstance.put(`/api/v1/ai-prompts/${targetId}`, {
                // If the caller passes the latest content explicitly, use it;
                // fall back to the hook's own state for safety.
                systemInstruction: overrideInstruction !== undefined ? overrideInstruction : systemInstruction,
                displayName,
                page,
                isHeaderPrompt,
                applicability,
                presets: overridePresets !== undefined ? overridePresets : presets,
                activePresetId: overrideActivePresetId !== undefined ? overrideActivePresetId : activePresetId
            });
            setIsDefault(false);
        } catch (err) {
            console.error(`[useCardPrompt] Save error for ${targetId}:`, err.message);
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [targetId, systemInstruction, presets, activePresetId]);

    return {
        systemInstruction,
        setSystemInstruction,
        presets,
        setPresets,
        activePresetId,
        setActivePresetId,
        isDefault,
        isLoading,
        isSaving,
        fetchPrompt,
        savePrompt,
        goldenRules
    };
}
