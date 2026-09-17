/**
 * @file EventsPage.jsx
 * @purpose Main entry point for the Events & News Intelligence feature.
 * @responsibilities
 * - Renders GlobalHeader for the Events module.
 * - Renders AdvancedNewsFeed with filtered or full event pool.
 * - Wires trading mode (POSITIONAL/SWING/INTRADAY) into composite scoring.
 * - Provides Instrument Focus Mode: filters events to only those mentioning
 *   the currently selected instrument.
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
import { useDashboardContext } from "@/shared/context/DashboardContext";
import { useTheme } from "@/shared/context/ThemeContext";
import { FO_EQUITIES, FO_INDICES } from "@/shared/utils/foInstruments";
import { useAiSync } from "@/shared/hooks/useAiSync";
import { saveIntelScore } from "@/shared/utils/intelCache";

// ---------------------------------------------------------------------------
// Alias resolver — handles naming inconsistencies in AI-generated affected_assets.
// e.g. "NIFTY" appears in events as "NIFTY", "NIFTY50", "NIFTY 50" etc.
// ---------------------------------------------------------------------------
function buildAliases(label) {
    if (!label) return new Set();
    const base = label.trim().toUpperCase();
    const aliases = new Set([base]);
    aliases.add(base.replace(/\s+/g, ''));          // "NIFTY 50" -> "NIFTY50"
    aliases.add(base.replace(/\s+/g, ' ').trim());  // normalize extra spaces
    // Known index aliases
    if (base === 'NIFTY')      { aliases.add('NIFTY50'); aliases.add('NIFTY 50'); }
    if (base === 'BANKNIFTY')  { aliases.add('BANK NIFTY'); aliases.add('NIFTY BANK'); aliases.add('BANKNIFTY50'); }
    if (base === 'FINNIFTY')   { aliases.add('NIFTY FIN SERVICE'); aliases.add('FINNIFTY50'); }
    if (base === 'MIDCPNIFTY') { aliases.add('NIFTY MID SELECT'); aliases.add('MIDCAP NIFTY'); }
    return aliases;
}

export default function EventsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortMode, setSortMode]       = useState("latest");
    const [newsItems, setNewsItems]     = useState([]);
    const [loading, setLoading]         = useState(true);
    const [isFocusMode, setIsFocusMode] = useState(false);

    // Context
    const { selectedInstrument, setAdditionalCharts } = useDashboardContext();
    const { tradingMode }        = useTheme();

    const fetchEvents = React.useCallback(async () => {
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
    }, []);

    const handleDeleteEvent = React.useCallback(async (id) => {
        try {
            const res = await axiosInstance.delete(`/api/v1/events/${id}`);
            if (res.data.success) {
                fetchEvents();
            }
        } catch (e) {
            console.error("Failed to delete event:", e);
        }
    }, [fetchEvents]);

    const handleReset = React.useCallback(() => {
        setSearchQuery("");
        setSortMode("latest");
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Auto-refresh when auto-processor saves new events from live news feed
    useEffect(() => {
        const handleEventsUpdated = (updatedEvents) => {
            if (Array.isArray(updatedEvents)) {
                setNewsItems(updatedEvents);
            } else {
                fetchEvents();
            }
        };
        socket.on("events:updated", handleEventsUpdated);
        return () => socket.off("events:updated", handleEventsUpdated);
    }, []);

    // ---------------------------------------------------------------------------
    // Core Filter: Strip out fully expired events
    // ---------------------------------------------------------------------------
    const liveNewsItems = useMemo(() => {
        return newsItems.filter(news => {
            const date = news.published_time ? new Date(news.published_time) : new Date(news.created_at || Date.now());
            const diffMins = Math.floor((new Date() - date) / 60000);
            const ttlMins = (Number(news.ttl_hours) || 72) * 60;
            return diffMins < ttlMins;
        });
    }, [newsItems]);

    // ---------------------------------------------------------------------------
    // Instrument Focus Mode — resolve selected instrument to a ticker label
    // ---------------------------------------------------------------------------
    const instrumentLabel = useMemo(() => {
        const all = [...FO_EQUITIES, ...FO_INDICES];
        return all.find(i => i.value === selectedInstrument)?.label ?? null;
    }, [selectedInstrument]);

    const instrumentAliases = useMemo(() => buildAliases(instrumentLabel), [instrumentLabel]);

    // Events filtered to only those mentioning the selected instrument (plus market-wide macro events)
    const focusedEvents = useMemo(() => {
        if (!instrumentLabel) return [];
        return liveNewsItems.filter(ev => {
            const isDirectAsset = Array.isArray(ev.affected_assets) &&
                ev.affected_assets.some(a => instrumentAliases.has(a.trim().toUpperCase()));
            const isMacro = ['MACRO', 'POLICY', 'GEOPOLITICAL'].includes(ev.category?.toUpperCase());
            return isDirectAsset || isMacro;
        });
    }, [liveNewsItems, instrumentAliases, instrumentLabel]);

    // Active pool — switches between full market view and instrument-focused view
    const activeEvents = isFocusMode ? focusedEvents : liveNewsItems;

    // ---------------------------------------------------------------------------
    // All derived values recompute from activeEvents — fully coherent on toggle
    // ---------------------------------------------------------------------------
    const { tailwinds, headwinds } = useMemo(
        () => extractInstitutionalImpacts(activeEvents),
        [activeEvents]
    );
    const metrics = useMemo(
        () => computePortfolioMetrics(activeEvents, tradingMode),
        [activeEvents, tradingMode]
    );
    const regime = useMemo(
        () => getCompositeState(metrics.compositeScore || 0),
        [metrics.compositeScore]
    );

    // ── Persistence: write Events composite score to SQLite (header_data) + localStorage ──
    // This is the fix for the ONLY page that never persisted its score to the backend.
    // The Master Dashboard reads header_data.events.composite_score via /api/v1/snapshots/header.
    useAiSync('GLOBAL', 'events', {
        compositeScore: metrics.compositeScore,
        regime: { label: regime?.label, color: regime?.color },
        tailwinds: tailwinds?.slice(0, 3).map(t => ({ id: t.id, label: t.label, value: t.sentiment })) || [],
        risks: headwinds?.slice(0, 3).map(h => ({ id: h.id, label: h.label, value: h.sentiment })) || [],
        sections: []
    });

    // L1: also persist to localStorage for instant Master Dashboard hydration (even without backend)
    useEffect(() => {
        if (metrics.compositeScore != null) {
            saveIntelScore('evt', 'GLOBAL', metrics.compositeScore, regime?.label, 'live');
            
            // Persist to backend DB (fire & forget) - ensures Master Dashboard has the latest Events score
            axiosInstance.post('/api/v1/snapshots/header', {
                instrument_key: 'GLOBAL',
                category: 'events',
                composite_score: metrics.compositeScore,
                regime_json: { label: regime?.label, color: regime?.color },
                tailwinds_json: tailwinds,
                risks_json: headwinds,
                counts_json: metrics.cardScores || {}
            }).catch(() => {});
        }
    }, [metrics.compositeScore, regime?.label, tailwinds, headwinds]);

    // Search-filtered count against the active pool
    const filteredNewsCount = useMemo(() => {
        if (!searchQuery) return activeEvents.length;
        const query = searchQuery.toLowerCase();
        return activeEvents.filter(news => {
            const inHeadline = news.headline?.toLowerCase().includes(query);
            const inSummary  = news.summary?.toLowerCase().includes(query);
            const inAssets   = Array.isArray(news.affected_assets) &&
                               news.affected_assets.some(a => a.toLowerCase().includes(query));
            return inHeadline || inSummary || inAssets;
        }).length;
    }, [activeEvents, searchQuery]);

    if (loading && liveNewsItems.length === 0) {
        return (
            <div className="w-full min-h-[80vh] flex flex-col items-center justify-center bg-background-base animate-in fade-in duration-500">
                <Loader size="lg" color="indigo" />
                <p className="text-text-secondary mt-8 font-mono text-[11px] tracking-[0.2em] animate-pulse uppercase">
                    Synchronizing Events Pipeline...
                </p>
            </div>
        );
    }

    // Dynamic header title based on focus mode
    const headerTitle = isFocusMode && instrumentLabel
        ? `${instrumentLabel} Events`
        : "Events Sentiment";

    return (
        <div className="px-4 md:px-6 pt-2 space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full mx-auto">

            <GlobalHeader
                title={headerTitle}
                score={metrics.compositeScore || 0}
                prevScore={null}
                gauge={{ label: regime.label, color: regime.color }}
                regime={{ label: regime.label, description: "Algorithmic Momentum Tracking", color: regime.color, confidence: metrics.marketConfidence || 0 }}
                sections={metrics.sections || []}
                masterPayload={{
                    metrics,
                    topTailwinds: tailwinds,
                    topHeadwinds: headwinds,
                    activeEvents: activeEvents.map(item => ({
                        headline:       item.headline,
                        score:          item.event_score,
                        sentiment:      item.sentiment,
                        severity:       item.severity,
                        importance:     item.importance,
                        horizon:        item.horizon,
                        affectedAssets: item.affected_assets || [],
                        keyDataPoints:  item.key_data_points || []
                    }))
                }}
                tailwinds={tailwinds}
                headwinds={headwinds}
                integrity={{
                    coverage:        liveNewsItems.length > 0 ? "1 / 1" : "0 / 1",
                    coveragePercent: liveNewsItems.length > 0 ? 100 : 0,
                    source:          "Auto",
                    freshness:       "Realtime"
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
                    search:        searchQuery,
                    onSearchChange: setSearchQuery,
                    sortMode,
                    onSortChange:  setSortMode,
                    sortOptions: [
                        { value: "latest",     label: "Latest" },
                        { value: "score_desc", label: "High Score" },
                        { value: "score_asc",  label: "Low Score" }
                    ],
                    matchCount: filteredNewsCount,
                    // Focus mode toggle — rendered inside GlobalHeader controls row
                    focusMode: {
                        enabled:    isFocusMode,
                        label:      instrumentLabel,
                        matchCount: focusedEvents.length,
                        totalCount: liveNewsItems.length,
                        onToggle:   () => setIsFocusMode(p => !p),
                    }
                }}
                customBackContent={
                    <EventsManualForm onEventSubmitted={fetchEvents} />
                }
            />

            {/* News Feed — receives the active (possibly filtered) event pool */}
            <AdvancedNewsFeed
                newsItems={activeEvents}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortMode={sortMode}
                onReset={handleReset}
                onDeleteEvent={handleDeleteEvent}
                setAdditionalCharts={setAdditionalCharts}
            />

        </div>
    );
}
