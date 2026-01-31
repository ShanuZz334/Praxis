import React, { useMemo } from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard";
import { GLOBAL_SECTIONS, TOTAL_GLOBAL_CREDITS } from "../data/globalData";

export default function GlobalStructureGrid({ cards, viewMode, sortMode, sections, onCardClick }) {
    // Helper to sort cards
    const sortCards = (list, mode) => {
        const arr = [...list];
        switch (mode) {
            case 'score_desc': // Strongest
                return arr.sort((a, b) => (b.normalized || 0) - (a.normalized || 0));
            case 'score_asc': // Weakest
                return arr.sort((a, b) => (a.normalized || 0) - (b.normalized || 0));
            case 'rel_desc': // High Credit
                return arr.sort((a, b) => (b.creditAllocation || 0) - (a.creditAllocation || 0));
            case 'rel_asc': // Low Credit
                return arr.sort((a, b) => (a.creditAllocation || 0) - (b.creditAllocation || 0));
            default:
                return arr;
        }
    };

    if (!cards || cards.length === 0) {
        return (
            <div className="text-center py-12 text-text-tertiary">
                No global structure data available
            </div>
        );
    }

    // Sectioned View
    if (viewMode === "sectioned" && sections) {
        return (
            <div className="space-y-8">
                {Object.entries(sections).map(([key, section]) => {
                    if (!section.cards || section.cards.length === 0) return null;

                    // Filter section cards based on parent's filtered cards
                    const filteredSectionCards = section.cards.filter(card =>
                        cards.some(c => c.id === card.id)
                    );

                    if (filteredSectionCards.length === 0) return null;

                    // Sort section cards
                    const sortedSectionCards = sortCards(filteredSectionCards, sortMode);

                    return (
                        <div key={key} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-px flex-1 bg-gradient-to-r from-border-default to-transparent" />
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-text-primary uppercase tracking-widest">{section.label}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-background-surface text-text-tertiary font-mono shadow-sm">
                                        {sortedSectionCards.length}
                                    </span>
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-l from-border-default to-transparent" />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                                {sortedSectionCards.map((card) => (
                                    <GlobalCard
                                        key={card.id}
                                        label={card.label}
                                        raw={card.raw}
                                        unit={card.unit}
                                        normalized={card.normalized}
                                        creditScore={card.creditScore}
                                        creditAllocation={card.creditAllocation}
                                        totalPageCredits={TOTAL_GLOBAL_CREDITS}
                                        reason={card.reason}
                                        onClick={() => onCardClick?.(card)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Flat View - sort all cards
    const sortedCards = sortCards(cards, sortMode);

    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {sortedCards.map((card) => (
                <GlobalCard
                    key={card.id}
                    label={card.label}
                    raw={card.raw}
                    unit={card.unit}
                    normalized={card.normalized}
                    creditScore={card.creditScore}
                    creditAllocation={card.creditAllocation}
                    totalPageCredits={TOTAL_GLOBAL_CREDITS}
                    reason={card.reason}
                    onClick={() => onCardClick?.(card)}
                />
            ))}
        </div>
    );
}
