/**
 * @file DataRegistryContext.jsx
 * @purpose Central live-data registry for all Praxis cards and widgets.
 *
 * Architecture:
 *   - ref-based (not React state) → zero re-renders when cards register data
 *   - IndicatorCard calls register(pageId, cardId, snapshot) on every data change
 *   - AiInsightSection calls getPageStructuredData(pageId) → rich hierarchical AI pageData
 *   - MasterDashboard calls getMasterSnapshot() → cross-page composite context
 *   - PaiChatArea / PaiFloatingWidget call getAtMentionCandidates(pageId) for @ autocomplete
 *   - resolveAtMention(rawId) → full card snapshot for cardSnapshots[] in chat API call
 *
 * Registry shape:
 *   {
 *     fundamentals: { pe_ratio: { displayName, value, score, signal, ... }, roe: {...} },
 *     technical:    { rsi: {...}, macd: {...} },
 *     options:      { pcr: {...}, iv_rank: {...} },
 *     foreign:      { dxy: {...}, gold: {...} },
 *     master:       { ... }
 *   }
 */
import React, { createContext, useContext, useRef, useCallback } from 'react';
import { CARD_REGISTRY } from '../config/cardRegistry';
import cardInventory from '../constants/cardInventory.json';

const DataRegistryContext = createContext(null);

export function DataRegistryProvider({ children }) {
    // Plain object under a ref — mutations never trigger React re-renders.
    const registryRef = useRef({});

    /**
     * register — called by useCardDataRegistration inside IndicatorCard.
     * Overwrites the previous snapshot for this (pageId, cardId) pair.
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
     * getPageSnapshot — returns all registered card snapshots for a given page (flat map).
     * Used by AiInsightSection for backwards compatibility.
     */
    const getPageSnapshot = useCallback((pageId) => {
        return registryRef.current[pageId] || {};
    }, []);

    /**
     * getPageStructuredData — returns a rich, hierarchical data object for a page.
     * Groups cards by their section from CARD_REGISTRY, provides composite summary.
     * Used by AiInsightSection to build the full structured pageData sent to AI.
     *
     * @param   {string} pageId   - lowercase, e.g. 'fundamentals', 'technical', 'foreign'
     * @returns {object}  { pageId, compositeScore, sections: [{ name, cards: [{...}] }] }
     */
    const getPageStructuredData = useCallback((pageId) => {
        const liveCards = registryRef.current[pageId] || {};
        const sectionMap = {};

        // Walk CARD_REGISTRY to get proper section grouping for this page
        Object.values(CARD_REGISTRY).forEach(entry => {
            if (entry.page?.toLowerCase() !== pageId) return;
            if (entry.type === 'widget') return; // skip header/chat widgets
            const section = entry.section || 'General';
            if (!sectionMap[section]) sectionMap[section] = [];
            const live = liveCards[entry.id];
            sectionMap[section].push({
                id: entry.id,
                displayName: entry.displayName,
                value: live?.value ?? null,
                score: live?.score ?? null,
                signal: live?.signal ?? null,
                weight: live?.weight ?? null,
                confidence: live?.confidence ?? null,
                additionalContext: live?.additionalContext ?? null,
                hasLiveData: !!live,
            });
        });

        const sections = Object.entries(sectionMap).map(([name, cards]) => ({ name, cards }));
        const allScores = sections.flatMap(s => s.cards.map(c => c.score)).filter(s => s != null);
        const compositeScore = allScores.length > 0
            ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
            : null;

        return { pageId, compositeScore, sections };
    }, []);

    /**
     * getMasterSnapshot — returns entire registry across all pages.
     * Used by MasterDashboard to build the unified cross-engine AI payload.
     */
    const getMasterSnapshot = useCallback(() => {
        return { ...registryRef.current };
    }, []);

    /**
     * resolveHashMention — legacy alias, kept for backward compatibility.
     * New code should use resolveAtMention.
     */
    const resolveHashMention = useCallback((rawId) => {
        if (!rawId) return null;
        const id = rawId.toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (!id) return null;
        for (const [pageId, cards] of Object.entries(registryRef.current)) {
            if (cards[id]) return { pageId, cardId: id, ...cards[id] };
        }
        for (const [pageId, cards] of Object.entries(registryRef.current)) {
            const match = Object.entries(cards).find(
                ([cid]) => cid.includes(id) || id.includes(cid)
            );
            if (match) return { pageId, cardId: match[0], ...match[1] };
        }
        return null;
    }, []);

    /**
     * resolveAtMention — resolves an @mention string to a full card snapshot.
     * Accepts the card's canonical ID or displayName (case-insensitive).
     * Returns the snapshot object that the backend /chat/:id endpoint expects in cardSnapshots[].
     *
     * @param   {string} query - raw text after @, e.g. "pe_ratio" or "P/E Ratio"
     * @returns {object|null}  { cardId, displayName, value, score, signal, confidence, additionalContext, pageId }
     */
    const resolveAtMention = useCallback((query) => {
        if (!query) return null;
        const q = query.toLowerCase().trim();

        // Helper: Find live card data, first checking native page, then searching globally
        const findLiveCard = (id) => {
            const entry = CARD_REGISTRY[id] || Object.values(CARD_REGISTRY).find(e => e.id === id);
            const nativePage = entry?.page?.toLowerCase();
            
            if (nativePage && registryRef.current[nativePage]?.[id]) {
                return registryRef.current[nativePage][id];
            }
            // Fallback to checking all registered pages (e.g., 'master' fallback layer)
            for (const page of Object.values(registryRef.current)) {
                if (page[id]) return page[id];
            }
            return null;
        };

        // 1. Exact ID match in live registry
        for (const [pageId, cards] of Object.entries(registryRef.current)) {
            if (cards[q]) {
                return {
                    cardId: q, pageId,
                    displayName: cards[q].displayName,
                    value: cards[q].value,
                    score: cards[q].score,
                    signal: cards[q].signal,
                    confidence: cards[q].confidence,
                    additionalContext: cards[q].additionalContext,
                };
            }
        }

        // 2. Exact ID match in CARD_REGISTRY (card may not be mounted / has no live data yet)
        const registryEntry = Object.values(CARD_REGISTRY).find(e => e.id === q);
        if (registryEntry) {
            const pageId = registryEntry.page?.toLowerCase();
            const live = findLiveCard(registryEntry.id);
            return {
                cardId: registryEntry.id, pageId,
                displayName: registryEntry.displayName,
                value: live?.value ?? null,
                score: live?.score ?? null,
                signal: live?.signal ?? null,
                confidence: live?.confidence ?? null,
                additionalContext: live?.additionalContext ?? null,
            };
        }

        // 3. Display name match (case-insensitive, partial)
        const nameMatch = Object.values(CARD_REGISTRY).find(
            e => e.displayName?.toLowerCase().includes(q) || q.includes(e.displayName?.toLowerCase())
        );
        if (nameMatch) {
            const pageId = nameMatch.page?.toLowerCase();
            const live = findLiveCard(nameMatch.id);
            return {
                cardId: nameMatch.id, pageId,
                displayName: nameMatch.displayName,
                value: live?.value ?? null,
                score: live?.score ?? null,
                signal: live?.signal ?? null,
                confidence: live?.confidence ?? null,
                additionalContext: live?.additionalContext ?? null,
            };
        }

        // 3b. Phase 3 Fix A: Alias match — check aliases[] on every registry entry.
        // This prevents a displayName rename from silently breaking existing @queries.
        // e.g. "volume shockers" still resolves to volume_shockers even after rename to "Most Active".
        const aliasMatch = Object.values(CARD_REGISTRY).find(e =>
            Array.isArray(e.aliases) && e.aliases.some(alias => {
                const a = alias.toLowerCase();
                return a.includes(q) || q.includes(a);
            })
        );
        if (aliasMatch) {
            const pageId = aliasMatch.page?.toLowerCase();
            const live = findLiveCard(aliasMatch.id);
            return {
                cardId: aliasMatch.id, pageId,
                displayName: aliasMatch.displayName,
                value: live?.value ?? null,
                score: live?.score ?? null,
                signal: live?.signal ?? null,
                confidence: live?.confidence ?? null,
                additionalContext: live?.additionalContext ?? null,
            };
        }

        // 4. Fallback: fuzzy ID match in live registry
        for (const [pageId, cards] of Object.entries(registryRef.current)) {
            const match = Object.entries(cards).find(([cid]) => cid.includes(q) || q.includes(cid));
            if (match) {
                return {
                    cardId: match[0], pageId,
                    displayName: match[1].displayName,
                    value: match[1].value,
                    score: match[1].score,
                    signal: match[1].signal,
                    confidence: match[1].confidence,
                    additionalContext: match[1].additionalContext,
                };
            }
        }
        return null;
    }, []);

    /**
     * getAtMentionCandidates — returns filtered list of cards for @ autocomplete dropdown.
     * Page-scoped if pageId is given; app-wide if null.
     *
     * @param   {string|null} pageId  - e.g. 'fundamentals', or null for global scope
     * @param   {string}      query   - current text after @
     * @returns {Array<{ id, displayName, page, section, hasLiveData, value, score }>}
     */
    const getAtMentionCandidates = useCallback((pageId, query = '') => {
        const q = query.toLowerCase().trim();
        const livePages = registryRef.current;

        const all = Object.values(CARD_REGISTRY)
            .filter(entry => {
                // Skip system/header/chat prompts (they aren't actual visual widgets)
                if (entry.type === 'widget' && entry.section !== 'Widgets') return false; 
                
                // If scoped to a specific page, only allow cards/widgets from that page
                if (pageId && entry.page?.toLowerCase() !== pageId) return false;
                
                return true;
            })
            .map(entry => {
                const pId = entry.page?.toLowerCase();
                const live = livePages[pId]?.[entry.id];
                return {
                    id: entry.id,
                    displayName: entry.displayName,
                    page: entry.page,
                    section: entry.section,
                    aliases: entry.aliases || [], // Phase 3 Fix A: expose aliases for dropdown filter
                    hasLiveData: !!live,
                    value: live?.value ?? null,
                    score: live?.score ?? null,
                };
            });

        if (!q) return all;
        return all.filter(c =>
            c.displayName?.toLowerCase().includes(q) ||
            c.id?.toLowerCase().includes(q) ||
            c.section?.toLowerCase().includes(q) ||
            // Phase 3 Fix A: match against aliases so renamed cards still appear on old query text
            c.aliases?.some(alias => alias.toLowerCase().includes(q))
        );
    }, []);

    /**
     * getAllCardIds — flat list of every registered card across all pages.
     * Legacy method kept for backward compat. Prefer getAtMentionCandidates for new code.
     */
    const getAllCardIds = useCallback(() => {
        const liveMap = new Map();
        for (const [pageId, cards] of Object.entries(registryRef.current)) {
            for (const [cardId, data] of Object.entries(cards)) {
                liveMap.set(cardId, { pageId, cardId, displayName: data.displayName || cardId, value: data.value, score: data.score });
            }
        }
        if (Array.isArray(cardInventory)) {
            cardInventory.forEach(item => {
                if (item.targetId && !liveMap.has(item.targetId)) {
                    liveMap.set(item.targetId, {
                        pageId: item.page?.toLowerCase() || 'unknown',
                        cardId: item.targetId,
                        displayName: item.card || item.targetId,
                        value: null, score: null
                    });
                }
            });
        }
        return Array.from(liveMap.values());
    }, []);

    /**
     * registerBulk — allows injecting multiple cards at once (e.g. from backend composite fetch).
     */
    const registerBulk = useCallback((pageId, cardsArray) => {
        if (!pageId || !Array.isArray(cardsArray)) return;
        if (!registryRef.current[pageId]) registryRef.current[pageId] = {};
        cardsArray.forEach(card => {
            if (card.id) {
                registryRef.current[pageId][card.id] = {
                    ...(registryRef.current[pageId][card.id] || {}),
                    ...card,
                    displayName: card.displayName || card.module || card.id,
                    _registeredAt: Date.now()
                };
            }
        });
    }, []);

    return (
        <DataRegistryContext.Provider value={{
            register,
            registerBulk,
            getPageSnapshot,
            getPageStructuredData,
            getMasterSnapshot,
            resolveHashMention,
            resolveAtMention,
            getAtMentionCandidates,
            getAllCardIds,
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
        return {
            register: () => {},
            registerBulk: () => {},
            getPageSnapshot: () => ({}),
            getPageStructuredData: () => ({ pageId: '', compositeScore: null, sections: [] }),
            getMasterSnapshot: () => ({}),
            resolveHashMention: () => null,
            resolveAtMention: () => null,
            getAtMentionCandidates: () => [],
            getAllCardIds: () => [],
        };
    }
    return ctx;
}
