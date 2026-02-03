/**
 * @file OptionsGrid.jsx
 * @purpose Layout engine for Options Intelligence cards.
 * @responsibilities
 * - Renders a collection of OptionsCard components in a grid layout.
 * - Supports "Sectioned" view (grouped by Category) vs "Flat" view.
 * - Handles internal sorting logic based on props (Strongest, Weakest, etc.).
 * - Provides mobile navigation buttons for quick section jumping.
 * @key_exports
 * - OptionsGrid (Default Component)
 * @dependencies
 * - OptionsCard: Child component.
 * - optionsSections: Metadata for categories.
 * @lifecycle
 * - Rendered by OptionsPage.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useMemo } from "react";
import OptionsCard from "./OptionsCard";
import { optionsSections } from "@/features/dashboard/options/engine/optionsHelper";

// =============================
// Main Component
// =============================
export default function OptionsGrid({
    cards,
    onCardClick,
    viewMode = "sectioned",
    sortMode = "score_desc"
}) {

    // =============================
    // Helper Logic
    // =============================

    const sortCards = (list, mode) => {
        const arr = [...list];
        switch (mode) {
            case 'score_desc': // Strongest (Highest Norm)
                return arr.sort((a, b) => (b.normalized || 0) - (a.normalized || 0));
            case 'score_asc': // Weakest (Lowest Norm)
                return arr.sort((a, b) => (a.normalized || 0) - (b.normalized || 0));
            case 'rel_desc': // Weight (Highest Credit)
                return arr.sort((a, b) => (b.creditAllocation || 0) - (a.creditAllocation || 0));
            case 'rel_asc': // Weight (Lowest Credit)
                return arr.sort((a, b) => (a.creditAllocation || 0) - (b.creditAllocation || 0));
            default:
                return arr;
        }
    };

    // Memoize categorization
    const grouped = useMemo(() => {
        const map = {};
        cards.forEach((card) => {
            const sec = card.category || "Other";
            if (!map[sec]) map[sec] = [];
            map[sec].push(card);
        });
        return map;
    }, [cards]);

    // =============================
    // Render: Flat View
    // =============================
    if (viewMode === 'flat') {
        const sortedFlat = sortCards(cards, sortMode);
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
                {sortedFlat.map((card) => (
                    <OptionsCard
                        key={card.id}
                        card={card}
                        onClick={() => onCardClick(card)}
                    />
                ))}
            </div>
        );
    }

    // =============================
    // Render: Sectioned View
    // =============================
    return (
        <div className="space-y-6 md:space-y-10">

            {/* Mobile Category Navigation (Pill Bar) */}
            <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 -mx-1 px-1 custom-scrollbar-hidden sticky top-0 bg-background-app/80 backdrop-blur-md z-30 py-3">
                {optionsSections.map(section => {
                    if (!grouped[section.id]?.length) return null;
                    return (
                        <button
                            key={section.id}
                            onClick={() => {
                                const el = document.getElementById(`section-${section.id}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="shrink-0 px-3 py-1.5 rounded-full bg-background-elevated border border-border-subtle text-[11px] font-bold text-text-secondary hover:text-text-primary hover:border-border-default transition-all whitespace-nowrap"
                        >
                            {section.label}
                        </button>
                    );
                })}
            </div>

            {/* Sections Loop */}
            {optionsSections.map((section) => {
                const sectionCards = grouped[section.id];
                if (!sectionCards || sectionCards.length === 0) return null;

                const sortedSectionCards = sortCards(sectionCards, sortMode);

                return (
                    <div key={section.id} id={`section-${section.id}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-20">
                        {/* Header */}
                        <div className="mb-3 md:mb-4 flex items-center justify-center gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-text-secondary uppercase tracking-widest">
                                    {section.label}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-background-surface text-text-tertiary font-mono shadow-sm">
                                    {sectionCards.length}
                                </span>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {sortedSectionCards.map((card) => (
                                <OptionsCard
                                    key={card.id}
                                    card={card}
                                    onClick={() => onCardClick(card)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
