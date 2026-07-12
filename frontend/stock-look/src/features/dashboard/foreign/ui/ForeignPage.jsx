/**
 * @file ForeignPage.jsx
 * @purpose Main entry point for the Global Macro / Foreign Intelligence feature.
 * @responsibilities
 * - Renders GlobalHeader for the Global module.
 * - Renders GlobalStructureGrid (empty — ready for real data).
 * - Manages view/sort/search controls.
 * @lifecycle
 * - Route: /dashboard/global
 */

import React, { useState } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import GlobalStructureGrid from "./GlobalStructureGrid";
import GlobalStructureModal from "./GlobalStructureModal";
import { GLOBAL_SECTIONS } from "../data/globalData";

export default function ForeignPage() {
    const [viewMode, setViewMode] = useState("sectioned");
    const [sortMode, setSortMode] = useState("score_desc");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCard, setSelectedCard] = useState(null);

    const cards = [
        { id: "dummy_us_markets", category: "US Markets" },
        { id: "dummy_commodities", category: "Commodities" },
        { id: "dummy_currency", category: "Currency" },
        { id: "dummy_bonds", category: "Bonds" },
        { id: "dummy_volatility", category: "Volatility" },
        { id: "dummy_crypto", category: "Digital Assets" }
    ];

    return (
        <div className="p-4 md:p-6 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen space-y-4 md:space-y-6">

            <GlobalHeader
                title="Global Structure"
                score={0}
                prevScore={0}
                gauge={{ label: "—", color: "#64748B" }}
                regime={{ label: "—", description: "No data loaded", color: "#64748B" }}
                integrity={{ coverage: "—", source: "—", freshness: "—" }}
                sections={[]}
                tailwinds={[]}
                risks={[]}
                totalCredits={0}
                cards={[]}
                controls={{
                    search: searchQuery,
                    onSearchChange: setSearchQuery,
                    viewMode,
                    onViewChange: setViewMode,
                    sortMode,
                    onSortChange: setSortMode,
                    matchCount: 0
                }}
            />

            {/* GRID — empty until real data is wired */}
            <GlobalStructureGrid
                cards={cards}
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
