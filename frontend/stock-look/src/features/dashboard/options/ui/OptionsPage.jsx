/**
 * @file OptionsPage.jsx
 * @purpose Main entry point for the Options Analytics Dashboard.
 * @responsibilities
 * - Orchestrates data flow using the simulators and engines.
 * - Computes top-level composite scores (Positioning, Regime).
 * - Manages view states (Grid vs List, Searching, Sorting).
 * - Renders the `GlobalHeader`, `OptionsChainLayout`, `OptionsGrid`, and `OptionsModal`.
 * @key_exports
 * - OptionsPage (Default Component)
 * @dependencies
 * - GlobalHeader: Top-level metrics.
 * - OptionsChainLayout: Chain visualization.
 * - OptionsGrid: Card grid.
 * - optionsSimulator: Data source.
 * - optionsHelper: Calculation logic.
 * @lifecycle
 * - Route target for "/dashboard/options".
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useState, useMemo } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import OptionsGrid from "./OptionsGrid";
import OptionsModal from "./OptionsModal";
import OptionsChainLayout from "./chain/OptionsChainLayout";
import { generateOptionsDashboardData, TOTAL_OPTIONS_CREDITS } from "@/features/dashboard/options/engine/optionsSimulator";
import {
    calculatePositioningScore,
    getAdvancedTopPicks,
    getOptionsRegime,
    extractOptionsTailwinds,
    extractOptionsRisks,
    optionsSections
} from "@/features/dashboard/options/engine/optionsHelper";

// =============================
// Main Component
// =============================
export default function OptionsPage() {
    // State
    const [selectedCard, setSelectedCard] = useState(null);
    const [viewMode, setViewMode] = useState("sectioned");
    const [sortMode, setSortMode] = useState("score_desc");
    const [searchQuery, setSearchQuery] = useState("");

    // 1. Data Generation (Simulation)
    const { cards, metrics, chain } = useMemo(() => generateOptionsDashboardData(), []);

    // 2. Filtering Logic (Search)
    const filteredCards = useMemo(() => {
        if (!searchQuery) return cards;
        const lower = searchQuery.toLowerCase();
        return cards.filter(c => c.label.toLowerCase().includes(lower));
    }, [cards, searchQuery]);

    // 3. Composite Score Calculation
    const positioning = useMemo(() => calculatePositioningScore(metrics), [metrics]);
    const score = positioning.score;

    // 4. Metric Extraction for Header
    const regime = useMemo(() => getOptionsRegime(score, metrics), [score, metrics]);
    const tailwinds = useMemo(() => extractOptionsTailwinds(cards).map(t => ({ ...t, value: Math.round(t.score * 100) })), [cards]);
    const risks = useMemo(() => extractOptionsRisks(cards).map(r => ({ ...r, value: Math.round(Math.abs(r.score) * 100) })), [cards]);

    // 5. Section Scoring
    const globalSections = useMemo(() => {
        return optionsSections.map(sec => {
            const secCards = cards.filter(c => c.category === sec.id);
            if (!secCards.length) return { ...sec, normalizedScore: 0, rawScore: 0 };

            const sum = secCards.reduce((acc, c) => acc + (c.normalized || 0), 0);
            const avg = sum / secCards.length;

            return {
                id: sec.id,
                label: sec.label.substring(0, 3).toUpperCase(),
                normalizedScore: Math.round(((avg + 1) / 2) * 100), // Map -1..1 to 0..100 roughly
                rawScore: avg
            };
        });
    }, [cards]);

    // 6. Strategy Picks
    const picks = useMemo(() => getAdvancedTopPicks(chain, metrics.spot), [chain, metrics.spot]);

    return (
        <div className="p-4 md:p-6 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen space-y-4 md:space-y-6">

            {/* Global Header (Unified Dashboard Style) */}
            <GlobalHeader
                title="Options Sentiment"
                score={score}
                prevScore={score - 4.2}
                regime={{ ...regime, confidence: 78 }}
                integrity={{ coverage: "NIFTY/BANKNIFTY", source: "Chain", freshness: "Realtime" }}

                sections={globalSections}
                tailwinds={tailwinds}
                risks={risks}

                // Credit System
                totalCredits={TOTAL_OPTIONS_CREDITS}
                cards={filteredCards}
                creditLabel="Greeks"

                // Controls
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
                            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Options Module</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            The Options module analyzes dealer gamma exposure (GEX), open interest flow, and volatility skews to identifying turning points.
                        </p>
                        <div className="mt-3 pt-2 border-t border-border-default flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                            <span>Click to read full manual</span>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </div>
                    </div>
                }
                manualLink="/dashboard/manual/options"
            />

            {/* Divider */}
            <div className="w-full h-px bg-white/5" />

            {/* Deep Dive: Chain Layout */}
            <OptionsChainLayout
                chain={chain}
                picks={picks}
                spotPrice={metrics.spot}
                metrics={metrics}
            />

            {/* Metrics Grid */}
            <OptionsGrid
                cards={filteredCards}
                onCardClick={setSelectedCard}
                viewMode={viewMode}
                sortMode={sortMode}
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
