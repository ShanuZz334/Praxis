import React from "react";
import OptionsCard from "./OptionsCard";
import { optionsSections } from "@/features/dashboard/options/engine/optionsHelper";

export default function OptionsGrid({
    cards, // Filtered or full list
    onCardClick,
    viewMode = "sectioned",
    sortMode = "score_desc"
}) {

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

    if (viewMode === 'flat') {
        const sortedFlat = sortCards(cards, sortMode);
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
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

    return (
        <div className="space-y-10">
            {optionsSections.map((section) => {
                const sectionCards = grouped[section.id];
                if (!sectionCards || sectionCards.length === 0) return null;

                const sortedSectionCards = sortCards(sectionCards, sortMode);

                return (
                    <div key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Section Header */}
                        <div className="mb-4 flex items-center justify-center gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-text-secondary uppercase tracking-widest">{section.label}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-background-surface text-text-tertiary font-mono shadow-sm">
                                    {sectionCards.length}
                                </span>
                            </div>
                        </div>

                        {/* Cards */}
                        <div className={`
                            grid gap-3 md:gap-4
                            ${viewMode === 'flat'
                                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                                : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3'}
                        `}>
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
