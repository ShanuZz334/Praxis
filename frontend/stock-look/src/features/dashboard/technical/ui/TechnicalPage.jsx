/**
 * @file TechnicalPage.jsx
 * @purpose Main entry point for the Technical Intelligence feature.
 * @responsibilities
 * - Renders GlobalHeader for the Technical module.
 * - Renders TechnicalGrid (empty — ready for real data).
 * - Manages view/sort/search controls.
 * @key_exports
 * - TechnicalPage (Default)
 * @lifecycle
 * - Route: /dashboard/technical
 */

import React, { useState } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import TechnicalGrid from "./TechnicalGrid";
import TechnicalModal from "./TechnicalModal";

export default function TechnicalPage() {
    const [viewMode, setViewMode] = useState("sectioned");
    const [sortMode, setSortMode] = useState("score_desc");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCard, setSelectedCard] = useState(null);

    const cards = [
        { id: "dummy_trend", category: "Trend" },
        { id: "dummy_momentum", category: "Momentum" },
        { id: "dummy_volatility", category: "Volatility" },
        { id: "dummy_volume", category: "Volume" },
        { id: "dummy_structure", category: "Structure" },
        { id: "dummy_breadth", category: "Breadth" }
    ];

    return (
        <div className="px-4 md:px-6 pt-2 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen space-y-4 md:space-y-6">

            {/* GLOBAL HEADER */}
            <GlobalHeader
                title="Technical Composite"
                score={0}
                prevScore={0}
                gauge={{ label: "—", color: "#64748B" }}
                regime={{ label: "—", description: "No data loaded", color: "#64748B", confidence: 0 }}
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
            <TechnicalGrid
                cards={cards}
                onCardClick={setSelectedCard}
                viewMode={viewMode}
                sortMode={sortMode}
                searchQuery={searchQuery}
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

            {/* MODAL */}
            <TechnicalModal
                open={!!selectedCard}
                onClose={() => setSelectedCard(null)}
                card={selectedCard}
            />
        </div>
    );
}
