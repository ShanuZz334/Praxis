/**
 * @file FundamentalPage.jsx
 * @purpose Main Controller for the Fundamental Analysis Dashboard.
 * @responsibilities
 * - Fetches market data using `useFundamentals`.
 * - Orchestrates the Intelligence Engine (`evaluateFundamentals`) to score data.
 * - Manages view state (Sectioned vs Flat) and sorting preferences.
 * - Renders the `GlobalHeader` with high-level insights.
 * - Renders the `FundamentalGrid` for detailed metrics.
 * @key_exports
 * - FundamentalPage (Default Component)
 * @dependencies
 * - GlobalHeader: Shared UI for top-level stats.
 * - FundamentalGrid: Main content area.
 * - evaluateFundamentals: Engine logic.
 * @lifecycle
 * - Route: /dashboard/fundamental
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useState, useMemo } from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import { FUNDAMENTAL_SECTIONS } from "../data/fundamentalData";
import { TOTAL_FUNDAMENTAL_CREDITS } from "../engine/cards.config";
import { useFundamentals } from "../hooks/useFundamentals";
import { evaluateFundamentals } from "../engine";
import FundamentalGrid from "./FundamentalGrid";
import FundamentalModal from "./FundamentalModal";

// =============================
// Main Component
// =============================
export default function FundamentalPage() {
  const { marketData, loading, error } = useFundamentals();

  // State Management
  const [viewMode, setViewMode] = useState("sectioned");
  const [sortMode, setSortMode] = useState("score_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);

  // --- Intelligence Engine Execution ---
  const intelligence = useMemo(() => {
    if (!marketData) return null;
    return evaluateFundamentals(marketData);
  }, [marketData]);

  const activeGauge = intelligence?.gauge || { label: "Balanced Structure", color: "#64748B" };
  const activeRegime = intelligence?.regime || { label: "Balanced Phase", description: "Mixed environment", color: "#64748B" };
  const overallScore = intelligence?.score || 0;
  const sections = intelligence?.sections || {};
  const cards = intelligence?.cards || [];

  // --- Filtering Logic ---
  const filteredCards = useMemo(() => {
    if (!searchQuery) return cards;
    const lower = searchQuery.toLowerCase();
    return cards.filter(c =>
      c.label.toLowerCase().includes(lower) ||
      (c.category && c.category.toLowerCase().includes(lower))
    );
  }, [cards, searchQuery]);

  // 2. Bar Chart Sections
  const globalStartSections = useMemo(() => {
    return Object.entries(sections).map(([key, val]) => ({
      id: key,
      label: key.substring(0, 3).toUpperCase(),
      normalizedScore: Math.round(((val + 1) / 2) * 100),
      rawScore: val
    }));
  }, [sections]);

  // 3. Top Movers (Tailwinds/Risks)
  const topTailwinds = useMemo(() => cards
    .filter(c => c.normalized > 0.2)
    .slice(0, 3)
    .map(c => ({
      id: c.id,
      label: c.label,
      value: Math.round(c.normalized * 100),
      sub: "High Impact"
    })), [cards]);

  const topRisks = useMemo(() => cards
    .filter(c => c.normalized < -0.2)
    .slice(0, 3)
    .map(c => ({
      id: c.id,
      label: c.label,
      value: Math.round(Math.abs(c.normalized) * 100),
      sub: "Cyclical Drag"
    })), [cards]);

  // --- Error & Loading States ---
  if (loading) return <div className="p-8 text-white">Initializing Intelligence Engine...</div>;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;

  // --- Render ---
  return (
    <div className="p-4 md:p-6 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen">

      {/* HEADER SECTION */}
      <GlobalHeader
        title="Fundamental Composite"
        score={overallScore}
        prevScore={intelligence?.prevScore || 50}
        gauge={activeGauge}
        regime={activeRegime}
        integrity={{ coverage: "36/36", source: "NSE/BSE", freshness: "Realtime" }}

        sections={globalStartSections}
        tailwinds={topTailwinds}
        risks={topRisks}

        totalCredits={TOTAL_FUNDAMENTAL_CREDITS}
        cards={cards}

        controls={{
          search: searchQuery,
          onSearchChange: setSearchQuery,
          viewMode,
          onViewChange: setViewMode,
          sortMode,
          onSortChange: setSortMode
        }}
        infoContent={
          <div className="w-80">
            <div className="flex items-center gap-2 mb-2 border-b border-border-default pb-2">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Fundamental Module</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              The Fundamental module interprets core financial statements, ratios, and growth metrics to determine the intrinsic value and quality of the asset.
            </p>
            <div className="mt-3 pt-2 border-t border-border-default flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wide">
              <span>Click to read full manual</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>
        }
        manualLink="/dashboard/manual/fundamental"
      />

      {/* DETAILED MODAL */}
      <FundamentalModal
        open={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        card={selectedCard}
      />

      {/* DATA GRID */}
      <div className="mt-8">
        <FundamentalGrid
          cards={filteredCards}
          viewMode={viewMode}
          sortMode={sortMode}
          onCardClick={setSelectedCard}
        />
      </div>
    </div>
  );
}
