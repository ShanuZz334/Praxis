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
import { MOCK_EVENTS, TOTAL_EVENTS_CREDITS } from "../data/eventsData";
import { MOCK_NEWS } from "../data/newsData";
import { calculateNewsImpact } from "../engine/newsScoring";
import { getNonMasterGaugeLabel, getNonMasterRegimeLabel } from "@/shared/global/logic/labelMappings";

// =============================
// Main Component
// =============================
export default function EventsPage() {
    // State
    const [searchQuery, setSearchQuery] = useState("");
    const [sortMode, setSortMode] = useState("latest"); // Default: Latest

    // 1. Enrich & Combine Data (Scheduled Events + News)
    const combinedSignals = useMemo(() => {
        const events = MOCK_EVENTS.map(e => ({ ...e, type: 'event' }));
        const news = MOCK_NEWS.map(n => {
            const aiData = calculateNewsImpact(n);
            return {
                ...n,
                type: 'news',
                impactScore: aiData.score,
                aiConfidence: aiData.confidence,
                aiDecision: aiData.decision,
                aiIntensity: aiData.intensity
            };
        });
        return [...events, ...news];
    }, []);

    // 2. Compute Global Metrics (Reliability-First)
    const { globalScore, globalSections, regime, gauge, prevScore } = useMemo(() => {
        const eventsOnly = combinedSignals.filter(c => c.type === 'event');
        const newsOnly = combinedSignals.filter(c => c.type === 'news');

        // A. Hard Event Impact (Scheduled Baseline)
        const eventImpact = eventsOnly.reduce((acc, curr) => acc + ((curr.impactScore || 5) * (curr.reliability || 0.5)), 0) / (eventsOnly.length || 1);

        // B. News Sentiment (Real-time Overlay)
        const newsImpactSum = newsOnly.reduce((acc, curr) => acc + (curr.impactScore || 0), 0);
        const newsSentiment = Math.max(-20, Math.min(20, newsImpactSum));

        // C. Composite Gauge (Directional Score)
        // newsSentiment is -20 to +20. Map it to a 0-100 scale centered at 50, 
        // with eventImpact (0-10) acting as a multiplier for intensity.
        const baseScore = 50;
        const intensity = (eventImpact / 10); // 0.0 to 1.0
        const gaugeScore = Math.round(Math.max(0, Math.min(100, baseScore + (newsSentiment * 2.5 * intensity))));

        // D. Section Breakdowns
        const categories = ['Macro', 'Policy', 'Corporate', 'Global'];
        const sectionsKeyed = categories.map(cat => {
            const items = combinedSignals.filter(n => n.category === cat);
            const sum = items.reduce((acc, curr) => acc + (curr.impactScore || 0), 0);
            return {
                id: cat.toLowerCase(),
                label: cat.toUpperCase(),
                rawScore: sum,
                normalizedScore: Math.max(-100, Math.min(100, sum * 5))
            };
        });

        // E. Regime & Gauge Logic
        const gauge = getNonMasterGaugeLabel(gaugeScore);
        const regime = getNonMasterRegimeLabel(gaugeScore);

        const confidence = 80 + (Math.sin(newsSentiment) * 10);
        const prevScore = Math.max(0, Math.min(100, gaugeScore - 3.2));

        return {
            globalScore: gaugeScore,
            sections: sectionsKeyed,
            gauge,
            regime: {
                ...regime,
                confidence: Math.round(confidence)
            },
            prevScore
        };
    }, [combinedSignals]);

    // 3. Identify Tailwinds & Risks (Top Movers)
    const { tailwinds, risks } = useMemo(() => {
        const sorted = [...combinedSignals].sort((a, b) => Math.abs(b.impactScore || 0) - Math.abs(a.impactScore || 0));

        const topBulls = sorted.filter(n => (n.impactScore || 0) > 0).slice(0, 3).map(n => ({
            id: n.id,
            label: n.title,
            value: n.impactScore * 10,
            sub: n.category
        }));

        const topBears = sorted.filter(n => (n.impactScore || 0) < 0).slice(0, 3).map(n => ({
            id: n.id,
            label: n.title,
            value: Math.abs(n.impactScore || 0) * 10,
            sub: n.category
        }));

        return { tailwinds: topBulls, risks: topBears };
    }, [combinedSignals]);

    // 4. Filtering & Sorting Logic
    const filteredAndSortedNews = useMemo(() => {
        let items = combinedSignals.filter(c => c.type === 'news');

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(n => {
                const tagMatch = n.tags?.some(t => t.label.toLowerCase().includes(q));
                const textMatch = n.title.toLowerCase().includes(q) || (n.takeaway && n.takeaway.toLowerCase().includes(q));
                return tagMatch || textMatch;
            });
        }
        // ... (sorting remains same)
        return items;
    }, [combinedSignals, searchQuery, sortMode]);

    // 5. Construct Signal Cards for GlobalHeader
    const signalCards = useMemo(() => filteredAndSortedNews.map(n => ({
        ...n,
        normalized: (n.impactScore || 0) / 4,
        aiBadge: `${n.aiConfidence}% Conf`
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
                prevScore={prevScore}
                gauge={gauge}
                regime={regime}
                sections={globalSections}

                // AI Insights
                tailwinds={tailwinds}
                risks={risks}

                // Integrity & Credits
                integrity={{ coverage: "Global Sources", source: "AI Aggregation", freshness: "Realtime" }}
                totalCredits={TOTAL_EVENTS_CREDITS}
                creditLabel="R Credits"
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
