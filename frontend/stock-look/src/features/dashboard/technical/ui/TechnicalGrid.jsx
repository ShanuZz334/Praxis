/**
 * @file TechnicalGrid.jsx
 * @purpose Renders the grid of technical indicator cards.
 * @responsibilities
 * - Displays cards in Sectioned (grouped) or Flat layout.
 * - Handles sorting (Strength, Weakness, Credit).
 * - Provides mobile navigation for sections.
 * @key_exports
 * - TechnicalGrid (Default)
 * @dependencies
 * - TechnicalCard
 * @lifecycle
 * - Rendered by TechnicalPage.
 * @date 2026-02-03
 */

import React from "react";
import TechnicalCard from "./TechnicalCard";
import { technicalSections } from "@/features/dashboard/technical/engine/technicalHelper";

// =============================
// Component
// =============================

export default function TechnicalGrid({
    cards,
    onCardClick,
    viewMode = "sectioned",
    sortMode = "score_desc",
    searchQuery = ""
}) {

    // =============================
    // Helper Functions
    // =============================

    const sortCards = (list, mode) => {
        const arr = [...list];
        switch (mode) {
            case 'score_desc':
                return arr.sort((a, b) => (b.normalized || 0) - (a.normalized || 0));
            case 'score_asc':
                return arr.sort((a, b) => (a.normalized || 0) - (b.normalized || 0));
            case 'rel_desc':
                return arr.sort((a, b) => (b.creditAllocation || 0) - (a.creditAllocation || 0));
            case 'rel_asc':
                return arr.sort((a, b) => (a.creditAllocation || 0) - (b.creditAllocation || 0));
            default:
                return arr;
        }
    };

    // Group by section
    const grouped = React.useMemo(() => {
        const map = {};
        cards.forEach((card) => {
            const sec = card.category || "Other";
            if (!map[sec]) map[sec] = [];
            map[sec].push(card);
        });
        return map;
    }, [cards]);

    // Section Order (using the config from helper or indicatorConfig orders)
    const SECTION_ORDER = technicalSections.map(s => s.id);

    // =============================
    // Render Layer
    // =============================

    return (
        <div className="space-y-6">
            {/* Category Navigator (Mobile/Tablet Only) */}
            {viewMode === "sectioned" && (
                <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 -mx-1 px-1 custom-scrollbar-hidden sticky top-0 bg-background-app/80 backdrop-blur-md z-30 py-3">
                    {SECTION_ORDER.map(section => {
                        if (!grouped[section]?.length) return null;
                        return (
                            <button
                                key={section}
                                onClick={() => {
                                    const el = document.getElementById(`section-${section}`);
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className="shrink-0 px-3 py-1.5 rounded-full bg-background-elevated border border-border-subtle text-[11px] font-bold text-text-secondary hover:text-text-primary hover:border-border-default transition-all whitespace-nowrap"
                            >
                                {section}
                            </button>
                        );
                    })}
                </div>
            )}
            {viewMode === "flat" ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 md:gap-4">
                    {cards.length === 0 && searchQuery ? (
                        <div className="col-span-4 p-12 text-center text-text-tertiary italic">No technicals found for "{searchQuery}"</div>
                    ) : (
                        sortCards(cards, sortMode).map((card) => (
                            <TechnicalCard
                                key={card.id}
                                card={card}
                                onClick={() => onCardClick(card)}
                            />
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-6 md:space-y-10">
                    {SECTION_ORDER.map((section) => {
                        let sectionCards = grouped[section];
                        if (!sectionCards || sectionCards.length === 0) return null;

                        // Sort within section
                        sectionCards = sortCards(sectionCards, sortMode);

                        return (
                            <div key={section} id={`section-${section}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-20">
                                {/* Section Header (Matched to Fundamental) */}
                                <div className="flex items-center justify-center gap-4 mb-3 md:mb-6">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-text-primary uppercase tracking-widest">{section}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-background-surface text-text-tertiary font-mono shadow-sm">
                                            {sectionCards.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 md:gap-4">
                                    {sectionCards.map((card) => (
                                        <TechnicalCard
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
            )}
        </div>
    );
}
