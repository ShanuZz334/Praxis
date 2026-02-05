/**
 * @file EventsGrid.jsx
 * @purpose Grid layout for displaying news intelligence cards.
 * @responsibilities
 * - Renders a responsive grid of `GlobalCard` or specialized `NewsCard` components.
 * - Sorts items by impact magnitude (Absolute Score) to highlight biggest movers.
 * - Maps AI Sentiment Scores to visual cues (Bullish/Bearish indicators).
 * - Handles empty states gracefully.
 * @key_exports
 * - EventsGrid (Default Component)
 * @dependencies
 * - GlobalCard (Common UI)
 * @lifecycle
 * - Rendered by EventsPage to show filtered news results.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard";

// =============================
// Main Component
// =============================
export default function EventsGrid({ newsItems, onNewsClick }) {

    if (!newsItems || newsItems.length === 0) {
        return (
            <div className="text-center py-12 text-text-tertiary">
                No events or news intelligence available
            </div>
        );
    }

    // 1. Sort by Magnitude (High Impact First)
    const sortedNews = [...newsItems].sort((a, b) => Math.abs(b.impactScore || 0) - Math.abs(a.impactScore || 0));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
            {sortedNews.map((item) => {
                const score = item.impactScore || 0;
                const absScore = Math.abs(score);
                const isEvent = item.type === 'event';

                // 2. Sentiment Mapping
                const sentiment = score > 0 ? "Bullish" : score < 0 ? "Bearish" : "Neutral";
                const sentimentIcon = score > 0 ? "▲" : score < 0 ? "▼" : "•";

                // 3. Normalize Score for UI Gauge (0..1)
                const gaugeValue = isEvent ? (score / 10) : ((score + 10) / 20);

                return (
                    <GlobalCard
                        key={item.id}
                        label={item.title}
                        raw={isEvent ? `${item.category} • Scheduled` : `${item.source} • ${formatTime(item.timestamp)}`}
                        unit=""
                        normalized={gaugeValue}
                        creditAllocation={item.creditAllocation || Math.round(absScore)}
                        totalPageCredits={TOTAL_EVENTS_CREDITS}
                        reason={isEvent ? `R: ${item.reliability}` : (item.aiDecision || `${sentimentIcon} ${sentiment}: ${item.takeaway}`)}
                        aiBadge={item.aiConfidence ? `${item.aiConfidence}% AI` : null}
                        onClick={() => onNewsClick?.(item)}
                    />
                );
            })}
        </div>
    );
}

// =============================
// Utility Functions
// =============================

/**
 * formatTime
 * Helper to display relative time.
 */
function formatTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return "1d+";
}
