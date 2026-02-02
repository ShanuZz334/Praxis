import React, { useState, useMemo } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import GlobalStructureGrid from "./GlobalStructureGrid";
import GlobalStructureModal from "./GlobalStructureModal";
import {
    GLOBAL_STRUCTURE_CARDS,
    GLOBAL_SECTIONS,
    TOTAL_GLOBAL_CREDITS
} from "../data/globalData";
import {
    calculateGlobalComposite,
    calculateSectionScores,
    extractGlobalTailwinds,
    extractGlobalRisks,
    getGlobalRegime,
    globalSections
} from "../engine/globalHelper";

export default function ForeignPage() {
    const [viewMode, setViewMode] = useState("sectioned");
    const [sortMode, setSortMode] = useState("score_desc");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCard, setSelectedCard] = useState(null);

    // Calculate composite score
    const compositeScore = useMemo(() =>
        calculateGlobalComposite(GLOBAL_STRUCTURE_CARDS),
        []
    );

    // Get regime
    const regime = useMemo(() =>
        getGlobalRegime(compositeScore),
        [compositeScore]
    );

    // Extract tailwinds and risks
    const tailwinds = useMemo(() =>
        extractGlobalTailwinds(GLOBAL_STRUCTURE_CARDS),
        []
    );

    const risks = useMemo(() =>
        extractGlobalRisks(GLOBAL_STRUCTURE_CARDS),
        []
    );

    // Calculate section scores
    const sectionScores = useMemo(() =>
        calculateSectionScores(GLOBAL_STRUCTURE_CARDS),
        []
    );

    // Format sections for GlobalHeader with scores
    const sectionsWithScores = useMemo(() => {
        return globalSections.map(sec => ({
            id: sec.id,
            label: sec.label,
            rawScore: (sectionScores[sec.label] || 50) / 100 * 2 - 1, // Convert 0-100 to -1 to 1
            normalizedScore: sectionScores[sec.label] || 50
        }));
    }, [sectionScores]);

    // Filter cards
    const filteredCards = useMemo(() => {
        if (!searchQuery) return GLOBAL_STRUCTURE_CARDS;
        const lower = searchQuery.toLowerCase();
        return GLOBAL_STRUCTURE_CARDS.filter(c =>
            c.label.toLowerCase().includes(lower) ||
            c.category.toLowerCase().includes(lower)
        );
    }, [searchQuery]);

    // Sort cards
    const sortedCards = useMemo(() => {
        const cards = [...filteredCards];
        if (sortMode === "score_desc") {
            return cards.sort((a, b) => b.normalized - a.normalized);
        } else if (sortMode === "score_asc") {
            return cards.sort((a, b) => a.normalized - b.normalized);
        } else if (sortMode === "alpha") {
            return cards.sort((a, b) => a.label.localeCompare(b.label));
        }
        return cards;
    }, [filteredCards, sortMode]);

    return (
        <div className="p-4 md:p-6 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen space-y-4 md:space-y-6">

            <GlobalHeader
                title="Global Structure"
                score={compositeScore}
                prevScore={compositeScore - 3.5}
                regime={regime}
                integrity={{
                    coverage: "22 Indicators",
                    source: "Multi-Asset",
                    freshness: "Live"
                }}
                sections={sectionsWithScores}
                tailwinds={tailwinds}
                risks={risks}

                totalCredits={TOTAL_GLOBAL_CREDITS}
                cards={GLOBAL_STRUCTURE_CARDS}

                controls={{
                    search: searchQuery,
                    onSearchChange: setSearchQuery,
                    viewMode,
                    onViewChange: setViewMode,
                    sortMode,
                    onSortChange: setSortMode,
                    matchCount: filteredCards.length
                }}
                infoContent={
                    <div className="w-80">
                        <div className="flex items-center gap-2 mb-2 border-b border-border-default pb-2">
                            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Global Macro Module</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            The Global Macro module tracks cross-asset correlations, currency flows, and bond yield spreads to identify systemic risk and opportunity environments.
                        </p>
                        <div className="mt-3 pt-2 border-t border-border-default flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                            <span>Click to read full manual</span>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </div>
                    </div>
                }
                manualLink="/dashboard/manual/global"
            />

            <GlobalStructureGrid
                cards={filteredCards}
                viewMode={viewMode}
                sortMode={sortMode}
                sections={GLOBAL_SECTIONS}
                onCardClick={setSelectedCard}
            />

            {selectedCard && (
                <GlobalStructureModal
                    open={!!selectedCard}
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                />
            )}

        </div>
    );
}
