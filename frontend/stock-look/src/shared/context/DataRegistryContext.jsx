/**
 * @file DataRegistryContext.jsx
 * @purpose Central live-data registry for all Praxis cards and widgets.
 *
 * Architecture:
 *   - ref-based (not React state) → zero re-renders when cards register data
 *   - IndicatorCard calls register(pageId, cardId, snapshot) on every data change
 *   - AiInsightSection calls getPageSnapshot(pageId) → richer AI pageData
 *   - MasterDashboard calls getMasterSnapshot() → cross-page composite context
 *   - PaiChatArea calls resolveHashMention('pe_ratio') when user types #pe_ratio
 *   - PaiChatArea calls getAllCardIds() for # autocomplete suggestions
 *
 * Registry shape:
 *   {
 *     fundamentals: { pe_ratio: { displayName, value, score, signal, ... }, roe: {...} },
 *     technical:    { rsi: {...}, macd: {...} },
 *     options:      { pcr: {...}, iv_rank: {...} },
 *     foreign:      { dxy: {...}, crude: {...} },
 *     events:       { ... }
 *   }
 */
import React, { createContext, useContext, useRef, useCallback } from 'react';
import cardInventory from '../constants/cardInventory.json';

const DataRegistryContext = createContext(null);

export function DataRegistryProvider({ children }) {
    // Plain object under a ref — mutations never trigger React re-renders.
    // All 121 cards can register freely without performance impact.
    const registryRef = useRef({});

    /**
     * register — called by useCardDataRegistration inside IndicatorCard.
     * Overwrites the previous snapshot for this (pageId, cardId) pair.
     *
     * @param {string} pageId    - e.g. 'fundamentals', 'technical', 'options', 'foreign', 'master'
     * @param {string} cardId    - the targetId from card-inventory.json, e.g. 'pe_ratio', 'rsi'
     * @param {object} snapshot  - { displayName, value, score, signal, confidence, weight, additionalContext, details[] }
     */
    const register = useCallback((pageId, cardId, snapshot) => {
        if (!pageId || !cardId || !snapshot) return;
        if (!registryRef.current[pageId]) {
            registryRef.current[pageId] = {};
        }
        registryRef.current[pageId][cardId] = {
            ...snapshot,
            _registeredAt: Date.now()
        };
    }, []);

    /**
     * getPageSnapshot — returns all registered card snapshots for a given page.
     * Used by AiInsightSection to build the pageData payload sent to the AI.
     *
     * @param   {string} pageId
     * @returns {object}  { [cardId]: snapshot, ... }
     */
    const getPageSnapshot = useCallback((pageId) => {
        return registryRef.current[pageId] || {};
    }, []);

    /**
     * getMasterSnapshot — returns entire registry across all pages.
     * Used by MasterDashboard to build the unified cross-engine AI payload.
     *
     * @returns {object}  { [pageId]: { [cardId]: snapshot }, ... }
     */
    const getMasterSnapshot = useCallback(() => {
        return { ...registryRef.current };
    }, []);

    /**
     * resolveHashMention — finds a card by ID across ALL pages.
     * Called by PaiChatArea when user types #pe_ratio in the chat textarea.
     *
     * Tries exact match first, then fuzzy (contains) match.
     *
     * @param   {string}      rawId  - word after #, e.g. "pe_ratio" or "rsi"
     * @returns {object|null}        - { pageId, cardId, displayName, value, score, signal, ... } or null
     */
    const resolveHashMention = useCallback((rawId) => {
        if (!rawId) return null;
        const id = rawId.toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (!id) return null;

        // 1. Exact match
        for (const [pageId, cards] of Object.entries(registryRef.current)) {
            if (cards[id]) {
                return { pageId, cardId: id, ...cards[id] };
            }
        }

        // 2. Fuzzy match (cardId contains the search string or vice-versa)
        for (const [pageId, cards] of Object.entries(registryRef.current)) {
            const match = Object.entries(cards).find(
                ([cid]) => cid.includes(id) || id.includes(cid)
            );
            if (match) {
                return { pageId, cardId: match[0], ...match[1] };
            }
        }

        return null;
    }, []);

    /**
     * getAllCardIds — flat list of every registered card across all pages.
     * Used by PaiChatArea to power # autocomplete dropdown.
     *
     * @returns {Array<{ pageId, cardId, displayName }>}
     */
    const getAllCardIds = useCallback(() => {
        const liveMap = new Map();
        
        // 1. Gather all live cards currently mounted
        for (const [pageId, cards] of Object.entries(registryRef.current)) {
            for (const [cardId, data] of Object.entries(cards)) {
                liveMap.set(cardId, {
                    pageId,
                    cardId,
                    displayName: data.displayName || cardId,
                    value: data.value,
                    score: data.score
                });
            }
        }
        
        // 2. Supplement with all known cards from inventory so unmounted cards still suggest
        if (Array.isArray(cardInventory)) {
            cardInventory.forEach(item => {
                if (item.targetId && !liveMap.has(item.targetId)) {
                    liveMap.set(item.targetId, {
                        pageId: item.page?.toLowerCase() || 'unknown',
                        cardId: item.targetId,
                        displayName: item.card || item.targetId,
                        value: null,
                        score: null
                    });
                }
            });
        }
        
        return Array.from(liveMap.values());
    }, []);

    /**
     * registerBulk — allows injecting multiple cards at once (e.g. from backend composite fetch)
     * so that even unmounted cards show LIVE data in autocomplete.
     */
    const registerBulk = useCallback((pageId, cardsArray) => {
        if (!pageId || !Array.isArray(cardsArray)) return;
        if (!registryRef.current[pageId]) {
            registryRef.current[pageId] = {};
        }
        cardsArray.forEach(card => {
            if (card.id) {
                // Do not overwrite if it exists and has true live data from a mounted component
                if (!registryRef.current[pageId][card.id]) {
                    registryRef.current[pageId][card.id] = {
                        displayName: card.module || card.id,
                        value: card.score, // Fallback data stores the value in 'score'
                        score: card.score,
                        signal: card.signal || 'neutral',
                        _registeredAt: Date.now()
                    };
                }
            }
        });
    }, []);

    return (
        <DataRegistryContext.Provider value={{
            register,
            registerBulk,
            getPageSnapshot,
            getMasterSnapshot,
            resolveHashMention,
            getAllCardIds
        }}>
            {children}
        </DataRegistryContext.Provider>
    );
}

/**
 * useDataRegistry — consumes the registry from any component or hook.
 * Returns a no-op fallback when used outside the provider (tests, storybook).
 */
export function useDataRegistry() {
    const ctx = useContext(DataRegistryContext);
    if (!ctx) {
        // Graceful degradation — feature simply doesn't work, nothing breaks
        return {
            register: () => {},
            registerBulk: () => {},
            getPageSnapshot: () => ({}),
            getMasterSnapshot: () => ({}),
            resolveHashMention: () => null,
            getAllCardIds: () => []
        };
    }
    return ctx;
}
