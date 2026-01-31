import React, { useState, useMemo } from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard";
// import FundamentalHeader from "./FundamentalHeader"; // DEPRECATED
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import { FUNDAMENTAL_SECTIONS } from "../data/fundamentalData";
import { TOTAL_FUNDAMENTAL_CREDITS } from "../engine/cards.config";
import { useFundamentals } from "../hooks/useFundamentals";
import { evaluateFundamentals } from "../engine";
import FundamentalGrid from "./FundamentalGrid";
import FundamentalModal from "./FundamentalModal";

export default function FundamentalPage() {
  const { marketData, loading, error } = useFundamentals();
  const [viewMode, setViewMode] = useState("sectioned");
  const [sortMode, setSortMode] = useState("score_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);

  // --- 1. Processing Logic (Corrected) ---
  const intelligence = useMemo(() => {
    if (!marketData) return null;
    return evaluateFundamentals(marketData);
  }, [marketData]);

  const overallScore = intelligence?.gauge || 0;
  const sections = intelligence?.sections || {};
  const cards = intelligence?.cards || [];

  // Filter Cards
  const filteredCards = useMemo(() => {
    if (!searchQuery) return cards;
    const lower = searchQuery.toLowerCase();
    return cards.filter(c =>
      c.label.toLowerCase().includes(lower) ||
      (c.category && c.category.toLowerCase().includes(lower))
    );
  }, [cards, searchQuery]);

  // --- 2. Adapt to Global Header Contract ---

  // Regime Logic (Fundamental Specific mapped to Global Object)
  const regimeObj = useMemo(() => {
    let label = "Balanced";
    let desc = "Mixed signals found";
    let color = "text-state-neutral-text";
    if (overallScore >= 70) {
      label = "Risk-On";
      desc = "Favorable macro backdrop";
      color = "text-state-bullish-text";
    } else if (overallScore < 40) {
      label = "Risk-Off";
      desc = "Capital preservation mode";
      color = "text-state-bearish-text";
    }
    return { label, desc, color, confidence: 92 }; // Mock conf
  }, [overallScore]);

  // Sections for Bar Chart
  const globalStartSections = useMemo(() => {
    // Map dictionary { Valuation: 0.5 } to Array [{ id:Valuation, normalizedScore: 75 }]
    return Object.entries(sections).map(([key, val]) => ({
      id: key,
      label: key.substring(0, 3).toUpperCase(),
      normalizedScore: Math.round(((val + 1) / 2) * 100),
      rawScore: val
    }));
  }, [sections]);

  // Mock Tailwinds/Risks for Header (In real app, extract from cards)
  const topTailwinds = useMemo(() => cards.filter(c => c.normalized > 0.2).slice(0, 3).map(c => ({
    id: c.id, label: c.label, value: Math.round(c.normalized * 100), sub: "High Impact"
  })), [cards]);

  const topRisks = useMemo(() => cards.filter(c => c.normalized < -0.2).slice(0, 3).map(c => ({
    id: c.id, label: c.label, value: Math.round(Math.abs(c.normalized) * 100), sub: "Cyclical Drag"
  })), [cards]);

  if (loading) return <div className="p-8 text-white">Initializing Intelligence Engine...</div>;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;

  return (
    <div className="p-6 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen">

      <GlobalHeader
        title="Fundamental Composite"
        score={overallScore}
        prevScore={overallScore - 2.5} // Mock prev
        regime={regimeObj}
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

      {/* MODAL (Deep Dive) */}
      <FundamentalModal
        open={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        card={selectedCard}
      />

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
