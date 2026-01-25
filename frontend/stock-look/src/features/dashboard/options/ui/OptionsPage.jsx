import React, { useState, useMemo } from "react";
// import OptionsHeader from "./OptionsHeader"; DEPRECATED
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

export default function OptionsPage() {
    const [selectedCard, setSelectedCard] = useState(null);
    const [viewMode, setViewMode] = useState("sectioned");
    const [sortMode, setSortMode] = useState("score_desc");
    const [searchQuery, setSearchQuery] = useState("");

    // 1. GENERATE DATA (Real-time Simulation)
    const { cards, metrics, chain } = useMemo(() => generateOptionsDashboardData(), []);

    // 2. FILTERING LOGIC
    const filteredCards = useMemo(() => {
        if (!searchQuery) return cards;
        const lower = searchQuery.toLowerCase();
        return cards.filter(c => c.label.toLowerCase().includes(lower));
    }, [cards, searchQuery]);

    // 3. COMPOSITE SCORE (Detailed)
    const positioning = useMemo(() => calculatePositioningScore(metrics), [metrics]);
    const score = positioning.score;

    // 4. GLOBAL HEADER ADAPTERS
    const regime = useMemo(() => getOptionsRegime(score, metrics), [score, metrics]);
    const tailwinds = useMemo(() => extractOptionsTailwinds(cards).map(t => ({ ...t, value: Math.round(t.score * 100) })), [cards]);
    const risks = useMemo(() => extractOptionsRisks(cards).map(r => ({ ...r, value: Math.round(Math.abs(r.score) * 100) })), [cards]);

    const globalSections = useMemo(() => {
        // Calculate Section Scores based on Cards
        return optionsSections.map(sec => {
            const secCards = cards.filter(c => c.category === sec.id);
            if (!secCards.length) return { ...sec, normalizedScore: 0, rawScore: 0 };

            const sum = secCards.reduce((acc, c) => acc + (c.normalized || 0), 0);
            const avg = sum / secCards.length;

            return {
                id: sec.id,
                label: sec.label.substring(0, 3).toUpperCase(),
                normalizedScore: Math.round(((avg + 1) / 2) * 100),
                rawScore: avg
            };
        });
    }, [cards]);


    // 5. ADVANCED PICKS
    const picks = useMemo(() => getAdvancedTopPicks(chain, metrics.spot), [chain, metrics.spot]);

    return (
        <div className="p-6 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen space-y-6">

            {/* HEADER */}
            <GlobalHeader
                title="Options Sentiment"
                score={score}
                prevScore={score - 4.2}
                regime={{ ...regime, confidence: 78 }}
                integrity={{ coverage: "NIFTY/BANKNIFTY", source: "Chain", freshness: "Realtime" }}

                sections={globalSections}
                tailwinds={tailwinds}
                risks={risks}

                // CREDIT SYSTEM INTEGRATION
                totalCredits={TOTAL_OPTIONS_CREDITS}
                cards={filteredCards} // Pass cards for Signal Integrity calculation

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
                    <div className="w-80 p-4 bg-[#0b1220] border border-white/10 rounded-xl shadow-2xl">
                        <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Options Module</span>
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed">
                            The Options module analyzes dealer gamma exposure (GEX), open interest flow, and volatility skews to identifying turning points.
                        </p>
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                            <span>Click to read full manual</span>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </div>
                    </div>
                }
                manualLink="/dashboard/manual/options"
            />

            {/* VISUAL SPACER */}
            <div className="w-full h-px bg-white/5" />

            {/* OPTIONS CHAIN TABLE */}
            <OptionsChainLayout
                chain={chain}
                picks={picks}
                spotPrice={metrics.spot}
                metrics={metrics}
            />

            {/* GRID */}
            <OptionsGrid
                cards={filteredCards}
                onCardClick={setSelectedCard}
                viewMode={viewMode}
                sortMode={sortMode}
            />

            {/* MODAL */}
            <OptionsModal
                open={!!selectedCard}
                onClose={() => setSelectedCard(null)}
                card={selectedCard}
            />
        </div>
    );
}
