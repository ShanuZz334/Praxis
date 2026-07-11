/**
 * @file FundamentalPage.jsx
 * @purpose Main Controller for the Fundamental Analysis Dashboard.
 * @responsibilities
 * - Renders GlobalHeader for the Fundamental module.
 * - Renders FundamentalGrid (empty — ready for real data).
 * - Manages view/sort/search controls.
 * @key_exports
 * - FundamentalPage (Default Component)
 * @lifecycle
 * - Route: /dashboard/fundamental
 */

import React, { useState } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import FundamentalGrid from "./FundamentalGrid";
import FundamentalModal from "./FundamentalModal";

export default function FundamentalPage() {
  const [viewMode, setViewMode] = useState("sectioned");
  const [sortMode, setSortMode] = useState("score_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);

  const cards = [];

  return (
    <div className="p-4 md:p-6 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen">

      {/* HEADER SECTION */}
      <GlobalHeader
        title="Fundamental Composite"
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
          onSortChange: setSortMode
        }}
      />

      {/* DETAILED MODAL */}
      <FundamentalModal
        open={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        card={selectedCard}
      />

      {/* DATA GRID — empty until real data is wired */}
      <div className="mt-8">
        <FundamentalGrid
          cards={cards}
          viewMode={viewMode}
          sortMode={sortMode}
          onCardClick={setSelectedCard}
          controls={{
            search: searchQuery,
            onSearchChange: setSearchQuery,
            viewMode,
            onViewChange: setViewMode,
            sortMode,
            onSortChange: setSortMode
          }}
        />
      </div>
    </div>
  );
}
