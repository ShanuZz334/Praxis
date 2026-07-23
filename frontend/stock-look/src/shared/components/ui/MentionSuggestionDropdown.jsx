/**
 * @file MentionSuggestionDropdown.jsx
 * @purpose Floating suggestion panel that appears when user types @ in a chat input.
 *
 * Renders a compact, keyboard-navigable list of matching cards/widgets.
 * Matches the existing DrawingToolbar / ChartTooltip visual language.
 * Fully light-mode and dark-mode efficient.
 */
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Page color accent mapping — matches CARD_REGISTRY page values (Title Case)
const PAGE_COLORS = {
    Fundamentals: { dot: 'bg-violet-500',  badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20' },
    Technical:    { dot: 'bg-blue-500',    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
    Options:      { dot: 'bg-amber-500',   badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
    Foreign:      { dot: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
    Master:       { dot: 'bg-teal-500',    badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20' },
};

function highlightMatch(text, query) {
    if (!query) return text;
    const idx = text?.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1 || !text) return text;
    return (
        <>
            {text.slice(0, idx)}
            <span className="font-semibold text-text-primary">{text.slice(idx, idx + query.length)}</span>
            {text.slice(idx + query.length)}
        </>
    );
}

export default function MentionSuggestionDropdown({
    suggestions = [],
    highlightedIndex = 0,
    onSelect,
    onClose,
    query = '',
    onHighlightChange,
}) {
    const listRef = useRef(null);

    // Auto-scroll highlighted item into view
    useEffect(() => {
        const el = listRef.current?.children[highlightedIndex];
        if (el) el.scrollIntoView({ block: 'nearest' });
    }, [highlightedIndex]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (listRef.current && !listRef.current.contains(e.target)) {
                onClose?.();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    if (!suggestions.length) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.13, ease: 'easeOut' }}
                    className={[
                        'absolute bottom-full left-0 mb-2 z-50 w-72',
                        'bg-white dark:bg-[#0f1421]',
                        'border border-black/10 dark:border-white/8',
                        'rounded-xl shadow-2xl overflow-hidden',
                    ].join(' ')}
                >
                    <div className="px-4 py-3 text-[12px] text-slate-500 dark:text-white/30 text-center">
                        No matching cards found
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.13, ease: 'easeOut' }}
                className={[
                    'absolute bottom-full left-0 mb-2 z-50 w-72',
                    'bg-white dark:bg-[#0f1421]',
                    'border border-black/10 dark:border-white/8',
                    'rounded-xl shadow-2xl overflow-hidden',
                ].join(' ')}
            >
                <div className="px-3 py-1.5 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-white/30 uppercase tracking-widest">
                        Attach Card Data
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-white/25 font-mono">
                        {suggestions.length} match{suggestions.length !== 1 ? 'es' : ''}
                    </span>
                </div>

                {/* Suggestions list */}
                <ul
                    ref={listRef}
                    className="max-h-52 overflow-y-auto py-1 scrollbar-thin"
                    role="listbox"
                >
                    {suggestions.map((candidate, i) => {
                        const colors = PAGE_COLORS[candidate.page] || PAGE_COLORS.Fundamentals;
                        const isActive = i === highlightedIndex;

                        return (
                            <li
                                key={candidate.id}
                                role="option"
                                aria-selected={isActive}
                                onMouseEnter={() => onHighlightChange?.(i)}
                                onMouseDown={(e) => {
                                    e.preventDefault(); // don't blur the textarea
                                    onSelect?.(candidate);
                                }}
                                className={[
                                    'flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors duration-75',
                                    isActive
                                        ? 'bg-black/5 dark:bg-white/5'
                                        : 'hover:bg-black/3 dark:hover:bg-white/3',
                                ].join(' ')}
                            >
                                {/* Page color dot */}
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />

                                {/* Card name */}
                                <span className="flex-1 min-w-0 text-[13px] text-slate-700 dark:text-white/80 truncate">
                                    {highlightMatch(candidate.displayName, query)}
                                </span>

                                {/* Right side: section tag + live indicator */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {candidate.hasLiveData && (
                                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" title="Live data available" />
                                    )}
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${colors.badge}`}>
                                        {candidate.page}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                {/* Footer hint */}
                <div className="px-3 py-1.5 border-t border-black/5 dark:border-white/5 flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 dark:text-white/25">
                        <kbd className="font-mono bg-black/5 dark:bg-white/5 px-1 rounded border border-black/10 dark:border-transparent">↑↓</kbd> navigate
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-white/25">
                        <kbd className="font-mono bg-black/5 dark:bg-white/5 px-1 rounded border border-black/10 dark:border-transparent">↵</kbd> attach
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-white/25">
                        <kbd className="font-mono bg-black/5 dark:bg-white/5 px-1 rounded border border-black/10 dark:border-transparent">Esc</kbd> dismiss
                    </span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
