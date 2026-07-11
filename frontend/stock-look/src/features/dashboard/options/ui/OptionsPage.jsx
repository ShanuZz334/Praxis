/**
 * @file OptionsPage.jsx
 * @purpose Main entry point for the Options Analytics Dashboard.
 * @responsibilities
 * - Renders GlobalHeader for the Options module.
 * - Renders OptionsGrid (empty — ready for real data).
 * - Manages view/sort/search controls.
 * @key_exports
 * - OptionsPage (Default Component)
 * @lifecycle
 * - Route target for "/dashboard/options".
 */

import React, { useState } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import OptionsGrid from "./OptionsGrid";
import OptionsModal from "./OptionsModal";

export default function OptionsPage() {
    const [selectedCard, setSelectedCard] = useState(null);
    const [viewMode, setViewMode] = useState("sectioned");
    const [sortMode, setSortMode] = useState("score_desc");
    const [searchQuery, setSearchQuery] = useState("");

    const cards = [];

    return (
        <div className="p-4 md:p-6 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen space-y-4 md:space-y-6">

            {/* Global Header */}
            <GlobalHeader
                title="Options Sentiment"
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
                creditLabel="Greeks"
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

            {/* Metrics Grid — empty until real data is wired */}
            <OptionsGrid
                cards={cards}
                onCardClick={setSelectedCard}
                viewMode={viewMode}
                sortMode={sortMode}
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

            {/* Detail Modal */}
            <OptionsModal
                open={!!selectedCard}
                onClose={() => setSelectedCard(null)}
                card={selectedCard}
            />
        </div>
    );
}
