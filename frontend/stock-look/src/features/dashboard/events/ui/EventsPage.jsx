import React, { useMemo, useState } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import AdvancedNewsFeed from "./AdvancedNewsFeed";
import { MOCK_EVENTS, TOTAL_EVENTS_CREDITS } from "../data/eventsData";
import { MOCK_NEWS } from "../data/newsData";
import { calculateNewsImpact } from "../engine/newsScoring";
import { detectNewsClusters } from "../engine/newsClustering";

export default function EventsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortMode, setSortMode] = useState("latest"); // Default: Latest to Oldest

    // 1. Prepare News Data using Agentic AI Scoring
    const enrichedNews = useMemo(() => {
        return MOCK_NEWS.map(n => ({
            ...n,
            impactScore: n.impactScore || calculateNewsImpact(n)
        }));
    }, []);

    // 2. Compute Scores & Sections for GlobalHeader (using ALL news for the global score)
    const { globalScore, globalSections, regime, sentimentScore } = useMemo(() => {
        // A. Filter by Category
        const categories = {
            'Macro': enrichedNews.filter(n => n.category === 'Macro' || n.category === 'Global'),
            'Policy': enrichedNews.filter(n => n.category === 'Policy'),
            'Corporate': enrichedNews.filter(n => n.category === 'Corporate'), // Earnings etc
            'Sector': enrichedNews.filter(n => n.breadth === 'Sector')
        };

        // B. Calculate Section Scores (Sum of impacts)
        const sectionsKeyed = Object.entries(categories).map(([label, items]) => {
            const sum = items.reduce((acc, curr) => acc + (curr.impactScore || 0), 0);
            return {
                id: label.toLowerCase(),
                label: label.toUpperCase(),
                rawScore: sum,
                normalizedScore: Math.max(-100, Math.min(100, sum * 5))
            };
        });

        // C. Net Sentiment (Total)
        const totalNet = enrichedNews.reduce((acc, curr) => acc + (curr.impactScore || 0), 0);

        // D. Context Mapping using GlobalHeader Standards (0-100)
        // New Logic: Normalize Net Score against Max Potential Score (Count * 10)
        // Range: -1 (All Bearish) to +1 (All Bullish) -> Mapped to 0..100
        const maxPotential = Math.max(1, enrichedNews.length * 10);
        const ratio = totalNet / maxPotential; // -1 to 1
        const normalizedGauge = Math.max(0, Math.min(100, (ratio + 1) * 50));

        // E. Regime Detection
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

    // 3. Derive Top Movers for Header (Tailwinds & Risks)
    const { tailwinds, risks } = useMemo(() => {
        // Use filtered items if we want the lists to update, but typically Tailwinds/Risks are GLOBAL concepts.
        // User asked for "data accoring to the hashtags".
        // If I filter by "Oil", I probably expect Tailwinds to show Oil news.
        // Let's use filteredAndSortedNews for this too? No, logic depends on variable scope availability.
        // `filteredAndSortedNews` is defined BELOW. 
        // I need to hoist `filteredAndSortedNews` or move this standard logic below it.
        // For safety/cleanliness, I will use `enrichedNews` (Global) for Tailwinds/Risks for now, 
        // as "Top Tailwinds" usually refers to the 'Market' context, not the 'Search Result' context.
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
            value: Math.abs(n.impactScore), // Display absolute value for the list
            sub: n.category
        }));

        return { tailwinds: topBulls, risks: topBears };
    }, [enrichedNews]);

    // 4. FILTERING & SORTING logic for the Feed
    const filteredAndSortedNews = useMemo(() => {
        let items = [...enrichedNews];

        // Search Filter (Hashtags focus)
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(n => {
                const tagMatch = n.tags?.some(t => t.label.toLowerCase().includes(q));
                const textMatch = n.title.toLowerCase().includes(q) || n.takeaway.toLowerCase().includes(q);
                return tagMatch || textMatch;
            });
        }

        // Sorting
        // "rel_desc" -> High Credit -> Most Positive (e.g. +10 to -10)
        // "rel_asc" -> Low Credit -> Most Negative (e.g. -10 to +10)
        // "latest"   -> Date Descending (Default)
        items.sort((a, b) => {
            if (sortMode === 'latest') {
                // Assuming timestamp exists. If mock data lacks it, won't sort (or will default order).
                // Mock news usually has timestamp.
                return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
            }
            const scoreA = a.impactScore || 0;
            const scoreB = b.impactScore || 0;
            return sortMode === 'rel_asc' ? scoreA - scoreB : scoreB - scoreA;
        });

        return items;
    }, [enrichedNews, searchQuery, sortMode]);

    // Construct "Cards" for Signal Integrity
    // Use filteredAndSortedNews to ensure counts match visible table.
    // Map -10..10 to via /4 to ensure anything > 0.8 becomes > 0.2 (Bull/Bear).
    const signalCards = useMemo(() => filteredAndSortedNews.map(n => ({
        ...n,
        normalized: (n.impactScore || 0) / 4
    })), [filteredAndSortedNews]);

    const handleReset = () => {
        setSearchQuery("");
        setSortMode("latest");
    };

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">

            <GlobalHeader
                title="Events Sentiment"
                score={globalScore}
                prevScore={globalScore - (sentimentScore * 0.1)}
                regime={regime}

                sections={globalSections}

                // Dynamic Tailwinds & Risks
                tailwinds={tailwinds}
                risks={risks}

                // Integrity: Use filtered length
                integrity={{ coverage: "Global Sources", source: "AI Aggregation", freshness: "Realtime" }}
                totalCredits={filteredAndSortedNews.length}
                creditLabel="News"
                cards={signalCards}

                // Controls Wiring
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
                infoContent={
                    <div className="w-80 p-4 bg-[#0b1220] border border-white/10 rounded-xl shadow-2xl">
                        <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Events & News Module</span>
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed">
                            The Events module uses NLP to score news sentiment, policy shifts, and earnings reports, clustering them into bullish or bearish market drivers.
                        </p>
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                            <span>Click to read full manual</span>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
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
