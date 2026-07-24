/**
 * @file useMentions.js
 * @purpose Reusable hook that powers the @mention system in both PaiChatArea and PaiFloatingWidget.
 *
 * Usage:
 *   const mentions = useMentions(pageId); // pageId = null for global scope
 *   // Wire to textarea onChange:
 *   mentions.handleInputChange(text, cursorPosition);
 *   // Show dropdown when mentions.isOpen:
 *   <MentionSuggestionDropdown suggestions={mentions.suggestions} ... />
 *   // On send:
 *   const { cleanText, cardSnapshots } = mentions.parseAndResolveAll(inputText);
 */
import { useState, useCallback, useRef } from 'react';
import { useDataRegistry } from '../context/DataRegistryContext';
import { CARD_REGISTRY } from '../config/cardRegistry';
import { useDashboardContext } from '../context/DashboardContext';

/**
 * inferPageFromChatId — resolves a chatId to a pageId via CARD_REGISTRY.
 * Registry-driven: zero hardcoded string prefixes.
 * Returns lowercase pageId or null (null = global scope, show all pages).
 *
 * @param   {string|null} chatId
 * @returns {string|null}
 */
export function inferPageFromChatId(chatId) {
    if (!chatId) return null;
    const entry = CARD_REGISTRY[chatId];
    if (!entry) return null;
    const page = entry.page?.toLowerCase();
    // Master page chats scope globally (master has no cards, only widgets)
    if (page === 'master') return null;
    return page || null;
}

export function useMentions(scopePageId = null) {
    const { getAtMentionCandidates: getRegistryCandidates, resolveAtMention: resolveRegistryMention } = useDataRegistry();
    const { livePrices, selectedInstrument } = useDashboardContext();

    const getAtMentionCandidates = useCallback((pageId, query = '') => {
        const q = query.toLowerCase().trim();
        const registryCandidates = getRegistryCandidates(pageId, query);

        const customMentions = [
            {
                id: 'nifty',
                displayName: 'NIFTY 50',
                page: 'global',
                section: 'Markets',
                hasLiveData: true,
                value: livePrices?.['NSE_INDEX|Nifty 50']?.ltp || 'N/A'
            },
            {
                id: 'banknifty',
                displayName: 'NIFTY BANK',
                page: 'global',
                section: 'Markets',
                hasLiveData: true,
                value: livePrices?.['NSE_INDEX|Nifty Bank']?.ltp || 'N/A'
            },
            {
                id: 'instrument',
                displayName: selectedInstrument?.split('|')?.[1] || 'Selected Instrument',
                page: 'global',
                section: 'Markets',
                hasLiveData: true,
                value: livePrices?.[selectedInstrument]?.ltp || 'N/A'
            }
        ];

        const filteredCustom = customMentions.filter(c => 
            !q || 
            c.id.includes(q) || 
            c.displayName.toLowerCase().includes(q)
        );

        return [...filteredCustom, ...registryCandidates];
    }, [getRegistryCandidates, livePrices, selectedInstrument]);

    const resolveAtMention = useCallback((query) => {
        const q = query?.toLowerCase().trim();
        if (!q) return null;
        
        const formatContext = (data) => `Live Tick Price: ${data?.ltp || 'N/A'}, Net Change: ${data?.netChange || '0'}, Percent Change: ${data?.pctChange?.toFixed(2) || '0'}%`;

        if (q === 'nifty' || q === 'nifty 50') {
            const data = livePrices?.['NSE_INDEX|Nifty 50'];
            return {
                cardId: 'nifty',
                displayName: 'NIFTY 50',
                value: data?.ltp || 'N/A',
                score: null, signal: null, confidence: null,
                additionalContext: formatContext(data)
            };
        }
        if (q === 'banknifty' || q === 'nifty bank') {
            const data = livePrices?.['NSE_INDEX|Nifty Bank'];
            return {
                cardId: 'banknifty',
                displayName: 'NIFTY BANK',
                value: data?.ltp || 'N/A',
                score: null, signal: null, confidence: null,
                additionalContext: formatContext(data)
            };
        }
        const selName = (selectedInstrument?.split('|')?.[1] || '').toLowerCase();
        if (q === 'instrument' || (selName && q === selName)) {
            const data = livePrices?.[selectedInstrument];
            return {
                cardId: 'instrument',
                displayName: selectedInstrument?.split('|')?.[1] || 'Selected Instrument',
                value: data?.ltp || 'N/A',
                score: null, signal: null, confidence: null,
                additionalContext: formatContext(data)
            };
        }

        return resolveRegistryMention(query);
    }, [resolveRegistryMention, livePrices, selectedInstrument]);

    // The text fragment after the last unresolved @ (null = no active mention query)
    const [mentionQuery, setMentionQuery] = useState(null);
    // Caret index where the current @ was typed
    const mentionStartRef = useRef(-1);
    // Live filtered suggestion list
    const [suggestions, setSuggestions] = useState([]);
    // Currently keyboard-highlighted suggestion index
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    /**
     * handleInputChange — call this on every textarea onChange.
     * Detects whether the cursor is inside an @mention query and updates suggestions.
     *
     * @param {string} text         - full current textarea value
     * @param {number} cursorPos    - selectionStart of the textarea
     */
    const handleInputChange = useCallback((text, cursorPos) => {
        // Walk backwards from cursor to find the most recent @
        const slice = text.slice(0, cursorPos);
        const atIndex = slice.lastIndexOf('@');

        if (atIndex === -1) {
            setMentionQuery(null);
            setSuggestions([]);
            return;
        }

        // Only trigger if @ is either at start or preceded by whitespace
        const charBefore = slice[atIndex - 1];
        if (charBefore !== undefined && charBefore !== ' ' && charBefore !== '\n') {
            setMentionQuery(null);
            setSuggestions([]);
            return;
        }

        const query = slice.slice(atIndex + 1); // text typed after @

        // Stop if there's a space in the query (mention ended without selection)
        if (query.includes(' ')) {
            setMentionQuery(null);
            setSuggestions([]);
            return;
        }

        mentionStartRef.current = atIndex;
        setMentionQuery(query);
        setHighlightedIndex(0);

        const candidates = getAtMentionCandidates(scopePageId, query);
        setSuggestions(candidates.slice(0, 8)); // cap at 8 rows
    }, [getAtMentionCandidates, scopePageId]);

    /**
     * selectMention — called when user clicks or keyboard-confirms a suggestion.
     * Replaces the @query fragment in the text with @DisplayName, closes dropdown.
     *
     * @param {object} candidate    - { id, displayName } from suggestions
     * @param {string} currentText  - current full textarea value
     * @returns {string}            - new textarea value with mention inserted
     */
    const selectMention = useCallback((candidate, currentText) => {
        const atIndex = mentionStartRef.current;
        if (atIndex === -1) return currentText;

        // Find end of query (next space or end of string)
        const afterAt = currentText.slice(atIndex + 1);
        const spaceIndex = afterAt.search(/[\s]/);
        const endIndex = spaceIndex === -1
            ? currentText.length
            : atIndex + 1 + spaceIndex;

        const before = currentText.slice(0, atIndex);
        const after = currentText.slice(endIndex);
        const inserted = `@${candidate.displayName}`;

        mentionStartRef.current = -1;
        setMentionQuery(null);
        setSuggestions([]);
        setHighlightedIndex(0);

        return `${before}${inserted} ${after}`;
    }, []);

    /**
     * closeMentions — dismiss the dropdown without selecting anything.
     */
    const closeMentions = useCallback(() => {
        setMentionQuery(null);
        setSuggestions([]);
        setHighlightedIndex(0);
        mentionStartRef.current = -1;
    }, []);

    /**
     * handleKeyDown — keyboard nav for the suggestion dropdown.
     * Returns true if the key was consumed (caller should preventDefault).
     *
     * @param {KeyboardEvent} e
     * @param {string}        currentText
     * @param {Function}      onSelect   - called with (candidate, newText)
     */
    const handleKeyDown = useCallback((e, currentText, onSelect) => {
        if (mentionQuery === null || suggestions.length === 0) return false;

        if (e.key === 'ArrowDown') {
            setHighlightedIndex(i => Math.min(i + 1, suggestions.length - 1));
            return true;
        }
        if (e.key === 'ArrowUp') {
            setHighlightedIndex(i => Math.max(i - 1, 0));
            return true;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
            const candidate = suggestions[highlightedIndex];
            if (candidate) {
                const newText = selectMention(candidate, currentText);
                onSelect(candidate, newText);
            }
            return true;
        }
        if (e.key === 'Escape') {
            closeMentions();
            return true;
        }
        return false;
    }, [mentionQuery, suggestions, highlightedIndex, selectMention, closeMentions]);

    /**
     * parseAndResolveAll — called at message send time.
     * Scans the final text for all @DisplayName patterns, resolves each to a card snapshot,
     * and returns a clean text (mentions stripped to just card name) + cardSnapshots[] array.
     *
     * Each snapshot is stamped with `hasLiveData: boolean` so the badge UI can show
     * a warning state when a card resolved but has no live value (e.g. page not mounted).
     *
     * @param   {string} text
     * @returns {{ cleanText: string, cardSnapshots: object[] }}
     */
    const parseAndResolveAll = useCallback((text) => {
        const cardSnapshots = [];
        const seenIds = new Set();

        // Match @anything-without-newline patterns
        const mentionPattern = /@([^@\n]+?)(?=\s@|\s*$|\n)/g;
        let match;
        const resolvedMentions = [];

        while ((match = mentionPattern.exec(text)) !== null) {
            const rawMention = match[1].trim();
            const resolved = resolveAtMention(rawMention);

            if (!resolved) {
                // Fix E: log unresolved mentions — these are typos or stale tags
                console.warn(`[@ mention] Could not resolve mention "@${rawMention}" — no matching card in registry. Check cardRegistry.js displayName/id.`);
                continue;
            }

            if (!seenIds.has(resolved.cardId)) {
                seenIds.add(resolved.cardId);

                // Fix D + E: detect and log cards that resolved but have no live data
                const hasLiveData = resolved.value !== null && resolved.value !== undefined;
                if (!hasLiveData) {
                    console.warn(
                        `[@ mention] Card "@${resolved.displayName}" (id: ${resolved.cardId}) resolved but has NO live data.`,
                        `Reason: page "${resolved.pageId}" may not be mounted yet, or widget has no register() call.`,
                        `The AI will receive "N/A" for this card's value.`
                    );
                }

                cardSnapshots.push({
                    cardId: resolved.cardId,
                    displayName: resolved.displayName,
                    value: resolved.value,
                    score: resolved.score,
                    signal: resolved.signal,
                    confidence: resolved.confidence,
                    additionalContext: resolved.additionalContext,
                    hasLiveData, // Fix D: badge UI uses this to show warning state
                });
                resolvedMentions.push({ full: match[0], display: resolved.displayName });
            }
        }

        // Clean the text: replace @DisplayName with just the name (no @ prefix)
        let cleanText = text;
        resolvedMentions.forEach(({ full, display }) => {
            cleanText = cleanText.replace(full, display);
        });

        return { cleanText: cleanText.trim(), cardSnapshots };
    }, [resolveAtMention]);

    return {
        // State
        mentionQuery,
        suggestions,
        highlightedIndex,
        isOpen: mentionQuery !== null && suggestions.length > 0,
        // Actions
        handleInputChange,
        selectMention,
        closeMentions,
        clearMentions: closeMentions, // alias — same function, matches spec name
        handleKeyDown,
        parseAndResolveAll,
        setHighlightedIndex,
    };
}
