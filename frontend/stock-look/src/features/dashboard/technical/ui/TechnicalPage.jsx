import React, { useState, useMemo } from "react";
// import TechnicalHeader from "./TechnicalHeader"; DEPRECATED
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import TechnicalGrid from "./TechnicalGrid";
import TechnicalModal from "./TechnicalModal";
import {
    calculateTechnicalComposite,
    technicalSections,
    getTechnicalRegime,
    extractTechnicalTailwinds,
    extractTechnicalRisks
} from "@/features/dashboard/technical/engine/technicalHelper";
import { generateLiveTechnicalData, TOTAL_TECHNICAL_CREDITS } from "@/features/dashboard/technical/engine/indicatorsConfig";

export default function TechnicalPage() {
    const [viewMode, setViewMode] = useState("sectioned");
    const [sortMode, setSortMode] = useState("score_desc");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCard, setSelectedCard] = useState(null);

    // Generate Full 100-Indicator Dataset
    const technicalCards = useMemo(() => generateLiveTechnicalData(), []);

    // Filter Logic
    const filteredCards = useMemo(() => {
        if (!searchQuery) return technicalCards;
        const lower = searchQuery.toLowerCase();
        return technicalCards.filter(c =>
            c.label.toLowerCase().includes(lower) ||
            c.category.toLowerCase().includes(lower) ||
            (c.id && c.id.toLowerCase().includes(lower))
        );
    }, [technicalCards, searchQuery]);

    // Calculate Scores & Sections (Keep based on FULL dataset for stability)
    const compositeScore = useMemo(() => calculateTechnicalComposite(technicalCards), [technicalCards]);

    // Calculate Section Scores
    const sectionsObj = useMemo(() => {
        const secScores = {};
        technicalSections.forEach(sec => {
            const cards = technicalCards.filter(c => c.category === sec.id);
            if (!cards.length) {
                secScores[sec.id] = 0;
                return;
            }
            const sumWeighted = cards.reduce((acc, c) => acc + ((c.normalized || 0) * (c.weight || 1)), 0);
            const totalWeight = cards.reduce((acc, c) => acc + (c.weight || 1), 0);
            secScores[sec.id] = totalWeight ? sumWeighted / totalWeight : 0;
        });
        return secScores;
    }, [technicalCards]);

    // --- Adapt to Global Header ---
    const globalSections = useMemo(() => {
        return technicalSections.map(sec => ({
            id: sec.id,
            label: sec.label, // "Trn", "Mom" etc
            rawScore: sectionsObj[sec.id],
            normalizedScore: Math.round(((sectionsObj[sec.id] + 1) / 2) * 100)
        }));
    }, [sectionsObj]);

    const regimeData = useMemo(() => getTechnicalRegime(compositeScore || 50), [compositeScore]);
    const tailwinds = useMemo(() => extractTechnicalTailwinds(technicalCards).map(t => ({ ...t, value: t.creditPct.toFixed(0) })), [technicalCards]);
    const risks = useMemo(() => extractTechnicalRisks(technicalCards).map(r => ({ ...r, value: r.creditPct.toFixed(0) })), [technicalCards]);

    return (
        <div className="p-6 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen space-y-6">
            {/* GLOBAL HEADER */}
            <GlobalHeader
                title="Technical Composite"
                score={compositeScore || 0}
                prevScore={(compositeScore || 50) - 1.5} // Mock prev
                regime={{
                    label: regimeData.label,
                    desc: regimeData.desc,
                    color: regimeData.color,
                    confidence: 85
                }}
                integrity={{ coverage: "200/200", source: "Primary Feed", freshness: "Realtime" }}

                sections={globalSections}
                tailwinds={tailwinds}
                risks={risks}

                totalCredits={TOTAL_TECHNICAL_CREDITS}
                cards={technicalCards}

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
                            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Technical Module</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            The Technical module aggregates price action, momentum, volatility, and volume indicators to determine the structural health of the trend.
                        </p>
                        <div className="mt-3 pt-2 border-t border-border-default flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                            <span>Click to read full manual</span>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </div>
                    </div>
                }
                manualLink="/dashboard/manual/technical"
            />

            {/* GRID */}
            <TechnicalGrid
                cards={filteredCards} // Pass FILTERED cards
                onCardClick={setSelectedCard}
                viewMode={viewMode}
                sortMode={sortMode}
                searchQuery={searchQuery}
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
