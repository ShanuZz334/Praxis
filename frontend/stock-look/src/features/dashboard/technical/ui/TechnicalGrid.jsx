import React from "react";
import TechnicalCard from "./TechnicalCard";
import { technicalSections } from "@/features/dashboard/technical/engine/technicalHelper";

export default function TechnicalGrid({
    cards, // Already filtered by parent
    onCardClick,
    viewMode = "sectioned",
    sortMode = "score_desc",
    searchQuery = ""
}) {
    // Helper to sort cards
    const sortCards = (list, mode) => {
        const arr = [...list];
        switch (mode) {
            case 'score_desc': // Strongest Signal (Most Bullish)
                return arr.sort((a, b) => (b.normalized || 0) - (a.normalized || 0));
            case 'score_asc': // Weakest Signal (Most Bearish)
                return arr.sort((a, b) => (a.normalized || 0) - (b.normalized || 0));
            case 'rel_desc': // High Credit
                return arr.sort((a, b) => (b.creditAllocation || 0) - (a.creditAllocation || 0));
            case 'rel_asc': // Low Credit
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
    // We already have 6 main categories mapped in config.
    const SECTION_ORDER = ["Trend", "Momentum", "Volatility", "Volume", "Breadth", "Structure"];

    return (
        <>
            {viewMode === "flat" ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
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
                <div className="space-y-10">
                    {SECTION_ORDER.map((section) => {
                        let sectionCards = grouped[section];
                        if (!sectionCards || sectionCards.length === 0) return null;

                        // Sort within section
                        sectionCards = sortCards(sectionCards, sortMode);

                        return (
                            <div key={section} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Section Header (Matched to Fundamental) */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-px flex-1 bg-gradient-to-r from-border-default to-transparent" />
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-text-primary uppercase tracking-widest">{section}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-background-surface text-text-tertiary font-mono shadow-sm">
                                            {sectionCards.length}
                                        </span>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-l from-border-default to-transparent" />
                                </div>

                                {/* Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
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
        </>
    );
}
