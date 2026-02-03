/**
 * @file EventsPage.jsx
 * @purpose Main entry point for the Events & News Intelligence feature.
 * @responsibilities
 * - Orchestrates data flow between mock sources, scoring engines, and UI components.
 * - Manages page-level state including search queries and sort modes.
 * - Calculates global sentiment and market regime based on aggregated news data.
 * - Renders the `GlobalHeader` and `AdvancedNewsFeed`.
 * @key_exports
 * - EventsPage (Default Component)
 * @dependencies
 * - GlobalHeader: For high-level metrics visualization.
 * - AdvancedNewsFeed: For displaying the news stream.
 * - newsScoring, newsClustering: For data enrichment.
 * @lifecycle
 * - Route target for "/dashboard/events".
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useMemo, useState } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import AdvancedNewsFeed from "./AdvancedNewsFeed";
import { MOCK_NEWS } from "../data/newsData";
import { calculateNewsImpact } from "../engine/newsScoring";

// =============================
// Main Component
// =============================
export default function EventsPage() {
    // State
    const [searchQuery, setSearchQuery] = useState("");
    const [sortMode, setSortMode] = useState("latest"); // Default: Latest

    // 1. Enrich News Data (Auto-Scoring)
    const enrichedNews = useMemo(() => {
        return MOCK_NEWS.map(n => ({
            ...n,
            impactScore: n.impactScore || calculateNewsImpact(n)
        }));
    }, []);

    // 2. Compute Global Metrics (Sentiment, Regime, Sections)
    const { globalScore, globalSections, regime, sentimentScore } = useMemo(() => {
        // A. Categorize
        const categories = {
            'Macro': enrichedNews.filter(n => n.category === 'Macro' || n.category === 'Global'),
            'Policy': enrichedNews.filter(n => n.category === 'Policy'),
            'Corporate': enrichedNews.filter(n => n.category === 'Corporate'),
            'Sector': enrichedNews.filter(n => n.breadth === 'Sector')
        };

        // B. Section Scores
        const sectionsKeyed = Object.entries(categories).map(([label, items]) => {
            const sum = items.reduce((acc, curr) => acc + (curr.impactScore || 0), 0);
            return {
                id: label.toLowerCase(),
                label: label.toUpperCase(),
                rawScore: sum,
                normalizedScore: Math.max(-100, Math.min(100, sum * 5))
            };
        });

        // C. Net Sentiment
        const totalNet = enrichedNews.reduce((acc, curr) => acc + (curr.impactScore || 0), 0);

        // D. Contextualize (0-100 Gauge)
        const maxPotential = Math.max(1, enrichedNews.length * 10);
        const ratio = totalNet / maxPotential;
        const normalizedGauge = Math.max(0, Math.min(100, (ratio + 1) * 50));

        // E. Regime Logic
        const absScore = Math.abs(normalizedGauge - 50);
        const regimeLabel = absScore > 30 ? "Strong Trend" : absScore > 10 ? "Accumulation" : "Choppy";
        const regimeColor = normalizedGauge > 60 ? "text-emerald-400" : normalizedGauge < 40 ? "text-red-400" : "text-yellow-400";

        return {
            globalScore: normalizedGauge,
            sentimentScore: totalNet,
            sections: sectionsKeyed,
            regime: {
                label: regimeLabel,
                desc: "AI-Derived Sentiment Analysis",
                confidence: 85,
                color: regimeColor
            }
        };
    }, [enrichedNews]);

    // 3. Identify Tailwinds & Risks (Top Movers)
    const { tailwinds, risks } = useMemo(() => {
        const sorted = [...enrichedNews].sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));

        const topBulls = sorted.filter(n => n.impactScore > 0).slice(0, 3).map(n => ({
            id: n.id,
            label: n.title,
            value: n.impactScore,
            sub: n.category
        }));

        const topBears = sorted.filter(n => n.impactScore < 0).reverse().slice(0, 3).map(n => ({
            id: n.id,
            label: n.title,
            value: Math.abs(n.impactScore),
            sub: n.category
        }));

        return { tailwinds: topBulls, risks: topBears };
    }, [enrichedNews]);

    // 4. Filtering & Sorting Logic
    const filteredAndSortedNews = useMemo(() => {
        let items = [...enrichedNews];

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(n => {
                const tagMatch = n.tags?.some(t => t.label.toLowerCase().includes(q));
                const textMatch = n.title.toLowerCase().includes(q) || n.takeaway.toLowerCase().includes(q);
                return tagMatch || textMatch;
            });
        }

        // Sort
        items.sort((a, b) => {
            if (sortMode === 'latest') {
                return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
            }
            const scoreA = a.impactScore || 0;
            const scoreB = b.impactScore || 0;
            return sortMode === 'rel_asc' ? scoreA - scoreB : scoreB - scoreA;
        });

        return items;
    }, [enrichedNews, searchQuery, sortMode]);

    // 5. Construct Signal Cards for GlobalHeader
    const signalCards = useMemo(() => filteredAndSortedNews.map(n => ({
        ...n,
        normalized: (n.impactScore || 0) / 4
    })), [filteredAndSortedNews]);

    // Handlers
    const handleReset = () => {
        setSearchQuery("");
        setSortMode("latest");
    };

    return (
        <div className="p-4 md:p-6 space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">

            <GlobalHeader
                title="Events Sentiment"
                score={globalScore}
                prevScore={globalScore - (sentimentScore * 0.1)}
                regime={regime}
                sections={globalSections}

                // AI Insights
                tailwinds={tailwinds}
                risks={risks}

                // Integrity & Credits
                integrity={{ coverage: "Global Sources", source: "AI Aggregation", freshness: "Realtime" }}
                totalCredits={filteredAndSortedNews.length}
                creditLabel="News"
                cards={signalCards}

                // Controls
                controls={{
                    search: searchQuery,
                    onSearchChange: setSearchQuery,
                    sortMode: sortMode,
                    onSortChange: setSortMode,
                    sortOptions: [
                        { value: "latest", label: "Latest" },
                        { value: "rel_desc", label: "High Impact" },
                        { value: "rel_asc", label: "Low Impact" },
                    ],
                    matchCount: filteredAndSortedNews.length
                }}

                // Info Popover Content
                infoContent={
                    <div className="w-80">
                        <div className="flex items-center gap-2 mb-2 border-b border-border-default pb-2">
                            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                                Events & News Module
                            </span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            The Events module uses NLP to score news sentiment, policy shifts, and earnings reports, clustering them into bullish or bearish market drivers.
                        </p>
                        <div className="mt-3 pt-2 border-t border-border-default flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                            <span>Click to read full manual</span>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </div>
                    </div>
                }
                manualLink="/dashboard/manual/events"
            />

            <AdvancedNewsFeed
                newsItems={filteredAndSortedNews}
                onReset={handleReset}
            />

        </div>
    );
}
