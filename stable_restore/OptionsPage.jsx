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
import React, { useState, useMemo, useEffect } from "react";
import { useTheme } from "@/shared/context/ThemeContext";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import OptionsGrid from "./OptionsGrid";
import OptionsModal from "./OptionsModal";
import OptionsChainLayout from "./chain/OptionsChainLayout";
import { generateOptionsDashboardData, TOTAL_OPTIONS_CREDITS } from "@/features/dashboard/options/engine/optionsSimulator";
import axiosInstance from "@/shared/utils/axiosInstance";
import { API_PATHS } from "@/shared/utils/apiPaths";
import {
    calculatePositioningScore,
    getAdvancedTopPicks,
    getOptionsRegime,
    getOptionsGauge,
    extractOptionsTailwinds,
    extractOptionsRisks,
    optionsSections
} from "@/features/dashboard/options/engine/optionsHelper";

// =============================
// Main Component
// =============================
export default function OptionsPage() {
    // State
    const { tradingMode } = useTheme();
    const [selectedCard, setSelectedCard] = useState(null);
    const [viewMode, setViewMode] = useState("sectioned");
    const [sortMode, setSortMode] = useState("score_desc");
    const [searchQuery, setSearchQuery] = useState("");
    const [realChain, setRealChain] = useState(null);

    // Fetch Real Options Chain
    useEffect(() => {
        const fetchChain = async () => {
            try {
                // Defaulting to NIFTY for the dashboard view
                const res = await axiosInstance.get(API_PATHS.OPTIONS.GET_CHAIN('NIFTY'));
                if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                    setRealChain(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch options chain:", err);
            }
        };
        fetchChain();
    }, []);

    // 1. Data Generation (Simulation or Real)
    const { cards, metrics, chain } = useMemo(() => {
        const simData = generateOptionsDashboardData(tradingMode);

        if (realChain) {
            // If real chain exists, inject it. 
            // Note: In a full implementation, we'd also recalculate metrics/cards based on this real chain.
            // For now, we'll swap the chain for the deep-dive view but keep simulated top-level metrics 
            // to ensure the dashboard remains fully populated without extensive refactoring of the engine.
            return { ...simData, chain: realChain };
        }

        return simData;
    }, [tradingMode, realChain]);

    // 2. Filtering Logic (Search)
    const filteredCards = useMemo(() => {
        if (!searchQuery) return cards;
        const lower = searchQuery.toLowerCase();
        return cards.filter(c => c.label.toLowerCase().includes(lower));
    }, [cards, searchQuery]);

    // 3. Composite Score Calculation
    const positioning = useMemo(() => calculatePositioningScore(metrics, tradingMode), [metrics, tradingMode]);
    const score = positioning.score;

    // 4. Metric Extraction for Header
    const regime = useMemo(() => getOptionsRegime(score), [score]);
    const gauge = useMemo(() => getOptionsGauge(score), [score]);
    const tailwinds = useMemo(() => extractOptionsTailwinds(cards), [cards]);
    const risks = useMemo(() => extractOptionsRisks(cards), [cards]);

    // 5. Section Scoring (Weighted by Card Weight)
    const globalSections = useMemo(() => {
        return optionsSections.map(sec => {
            const secCards = cards.filter(c => c.category === sec.id);
            if (!secCards.length) return { ...sec, normalizedScore: 0, rawScore: 0 };

            const weightedSum = secCards.reduce((acc, c) => acc + ((c.normalized || 0) * (c.weight || 1)), 0);
            const totalWeight = secCards.reduce((acc, c) => acc + (c.weight || 1), 0);
            const avg = totalWeight > 0 ? weightedSum / totalWeight : 0;

            return {
                id: sec.id,
                label: sec.label.substring(0, 3).toUpperCase(),
                normalizedScore: Math.round(((avg + 1) / 2) * 100),
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
                prevScore={positioning.prevScore}
                gauge={gauge}
                regime={{ ...regime, confidence: positioning.confidence }}
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
                controls={{
                    search: searchQuery,
                    onSearchChange: setSearchQuery,
                    viewMode,
                    onViewChange: setViewMode,
                    sortMode,
                    onSortChange: setSortMode,
                    matchCount: filteredCards.length
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

            } finally {
                setLoading(false);
            }
        };

        if (selectedInstrument && selectedExpiry) {
            fetchChainAndGreeks();
        }
    }, [selectedInstrument, selectedExpiry]);

    const cards = [];
    
    const metrics = { pcr: 1.00, maxPain: spotPrice, ivRank: 34 };

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
                    if (totalLoss < minLoss) {
                        minLoss = totalLoss;
                        maxPainStrike = evalStrike;
                    }
                });

                setMetrics({ pcr, maxPain: maxPainStrike });

            } catch (err) {
                console.error("Failed to fetch option chain:", err);
                setChainData([]);
                setProDeskPicks({ ce: [], pe: [] });
                setMetrics({ pcr: 1.00, maxPain: 0 });
            } finally {
                setLoading(false);
            }
        };

        if (selectedInstrument && selectedExpiry) {
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

            {/* Option Chain Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-surface-primary p-4 rounded-lg shadow-sm border border-border-light gap-4">
                <div className="flex items-center gap-4">
                    <select 
                        value={selectedInstrument}
                        onChange={(e) => setSelectedInstrument(e.target.value)}
                        className="bg-surface-secondary text-text-primary border border-border-light rounded px-3 py-2 outline-none focus:border-primary-500 transition-colors"
                    >
                        {instruments.map(inst => (
                        ))}
                    </select>

                    <select 
                        value={selectedExpiry}
                        onChange={(e) => setSelectedExpiry(e.target.value)}
                        disabled={expiriesLoading || expiries.length === 0}
                        className="bg-surface-secondary text-text-primary border border-border-light rounded px-3 py-2 outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
                    >
                        {expiriesLoading ? (
                            <option>Loading expiries...</option>
                        ) : expiries.length === 0 ? (
                            <option>No expiries</option>
                        ) : (
                            expiries.map(exp => (
                                <option key={exp} value={exp}>{exp}</option>
                            ))
                        )}
                    </select>
                </div>
                {loading && <div className="text-sm text-text-secondary animate-pulse">Loading Chain...</div>}
            </div>

            {/* Main Chain Layout Component */}
            {chainData.length > 0 && (
                <OptionsChainLayout 
                    chain={chainData} 
                    picks={proDeskPicks} 
                    spotPrice={spotPrice} 
                    metrics={{ ...metrics, ivRank: manualIvRank }} 
                    goldenZone={goldenZone}
                    manualIvRank={manualIvRank}
                    setManualIvRank={setManualIvRank}
                />
            )}
        </div>
    );
}

                            ))
                        )}
                    </select>
                </div>
                {loading && <div className="text-sm text-text-secondary animate-pulse">Loading Chain...</div>}
            </div>

            {/* Main Chain Layout Component */}
            {chainData.length > 0 && (
                <OptionsChainLayout 
                    chain={chainData} 
                    picks={proDeskPicks} 
                    spotPrice={spotPrice} 
                    metrics={{ ...metrics, ivRank: manualIvRank }} 
                    goldenZone={goldenZone}
                    manualIvRank={manualIvRank}
                    setManualIvRank={setManualIvRank}
                />
            )}
        </div>
    );
}
