/**
 * @file EventsPage.jsx
 * @purpose Main entry point for the Events & News Intelligence feature.
 * @responsibilities
 * - Renders GlobalHeader for the Events module.
 * - Renders AdvancedNewsFeed (empty — ready for real data).
 * @key_exports
 * - EventsPage (Default Component)
 * @lifecycle
 * - Route target for "/dashboard/events".
 */

import React, { useState, useEffect, useMemo } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import { extractInstitutionalImpacts, computePortfolioMetrics } from "@/shared/global/logic/eventsEngine";
import { getCompositeState } from "@/shared/global/logic/signals";
import AdvancedNewsFeed from "./AdvancedNewsFeed";
import EventsManualForm from "./EventsManualForm";
import axiosInstance from "@/shared/utils/axiosInstance";
import socket from "@/shared/utils/socket";
import Loader from "@/shared/components/ui/Loader";

export default function EventsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortMode, setSortMode] = useState("latest");
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/api/v1/events');
            if (res.data.success) {
                setNewsItems(res.data.data);
            }
        } catch (e) {
            console.error("Failed to fetch events:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (id) => {
        try {
            const res = await axiosInstance.delete(`/api/v1/events/${id}`);
            if (res.data.success) {
                fetchEvents();
            }
        } catch (e) {
            console.error("Failed to delete event:", e);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const { tailwinds, headwinds } = useMemo(() => extractInstitutionalImpacts(newsItems), [newsItems]);
    const metrics = useMemo(() => computePortfolioMetrics(newsItems), [newsItems]);
    const regime = useMemo(() => getCompositeState(metrics.compositeScore || 0), [metrics.compositeScore]);

    // Auto-refresh when auto-processor saves new events from live news feed
    useEffect(() => {
        const handleEventsUpdated = (updatedEvents) => {
            if (Array.isArray(updatedEvents)) {
                setNewsItems(updatedEvents);
            } else {
                // Fallback: re-fetch from API
                fetchEvents();
            }
        };

        socket.on("events:updated", handleEventsUpdated);
        return () => socket.off("events:updated", handleEventsUpdated);
    }, []);

    if (loading) {
        return (
            <div className="w-full min-h-[80vh] flex flex-col items-center justify-center bg-background-base animate-in fade-in duration-500">
                <Loader size="lg" color="indigo" />
                <p className="text-text-secondary mt-8 font-mono text-[11px] tracking-[0.2em] animate-pulse uppercase">
                    Synchronizing Events Pipeline...
                </p>
            </div>
        );
    }

    return (
        <div className="px-4 md:px-6 pt-2 space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full mx-auto">

            <GlobalHeader
                title="Events Sentiment"
                score={metrics.compositeScore || 0}
                prevScore={null}
                gauge={{ label: regime.label, color: regime.color }}
                regime={{ label: regime.label, description: "Algorithmic Momentum Tracking", color: regime.color, confidence: metrics.marketConfidence || 0 }}
                sections={metrics.sections || []}
                masterPayload={{
                    metrics,
                    topTailwinds: tailwinds,
                    topHeadwinds: headwinds,
                    activeEvents: newsItems.map(item => ({
                        headline: item.headline,
                        score: item.event_score,
                        sentiment: item.sentiment,
                        severity: item.severity,
                        importance: item.importance,
                        horizon: item.horizon,
                        affectedAssets: item.affected_assets || [],
                        keyDataPoints: item.key_data_points || []
                    }))
                }}
                tailwinds={tailwinds}
                headwinds={headwinds}
                integrity={{ 
                    coverage: newsItems.length > 0 ? "1 / 1" : "0 / 1", 
                    coveragePercent: newsItems.length > 0 ? 100 : 0,
                    source: "Auto", 
                    freshness: "Realtime" 
                }}
                totalCredits={metrics.totalWeight}
                creditLabel="Total Weight"
                customStats={[
                    { 
                        label: "Net Momentum", 
                        value: metrics.netMomentum, 
                        color: metrics.netMomentumRaw > 0 ? "text-emerald-500" : metrics.netMomentumRaw < 0 ? "text-red-500" : "text-amber-500" 
                    },
                    { 
                        label: "Total Events", 
                        value: metrics.eventCount, 
                        color: "text-text-primary" 
                    },
                    { 
                        label: "Avg Impact", 
                        value: metrics.eventCount > 0 ? (metrics.totalWeight / metrics.eventCount).toFixed(2) : "0.00", 
                        color: "text-blue-500" 
                    }
                ]}
                cards={[]}
                syncId={{ instrumentKey: 'EVENTS', category: 'events' }}
                controls={{
                    search: searchQuery,
                    onSearchChange: setSearchQuery,
                    sortMode,
                    onSortChange: setSortMode,
                    sortOptions: [
                        { value: "latest", label: "Latest" },
                        { value: "score_desc", label: "High Score" },
                        { value: "score_asc", label: "Low Score" }
                    ],
                    matchCount: newsItems.length
                }}
                customBackContent={
                    <EventsManualForm onEventSubmitted={fetchEvents} />
                }
            />

            {/* News Feed */}
            <AdvancedNewsFeed
                newsItems={newsItems}
                searchQuery={searchQuery}
                sortMode={sortMode}
                onReset={() => { setSearchQuery(""); setSortMode("latest"); }}
                onDeleteEvent={handleDeleteEvent}
            />

        </div>
    );
}
