/**
 * @file NewsSection.jsx
 * @purpose Section controller for the news/events dashboard view.
 * @responsibilities
 * - Manages tabs/filters for news categories (Macro, Policy, Corporate, etc).
 * - Coordinates state between the `NewsFeed` and the detailed `NewsImpactPanel`.
 * - Handles layout responsiveness (two-column vs stacked).
 * @key_exports
 * - NewsSection (Default Component)
 * @dependencies
 * - NewsFeed: The list component.
 * - NewsImpactPanel: The detail component.
 * - CardSegmented: Tab control.
 * @lifecycle
 * - Rendered by EventsPage.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useState } from "react";
import NewsFeed from "./NewsFeed";
import NewsImpactPanel from "./NewsImpactPanel";
import CardSegmented from "@/shared/components/controls/CardSegmented";

// =============================
// Constants
// =============================
const TABS = [
    { value: "All", label: "All News" },
    { value: "Macro", label: "Macro" },
    { value: "Policy", label: "Policy" },
    { value: "Corporate", label: "Corporate" },
    { value: "Global", label: "Global" }
];

// =============================
// Main Component
// =============================
export default function NewsSection({ newsItems }) {
    // State
    const [activeTab, setActiveTab] = useState("All");
    const [hoveredNews, setHoveredNews] = useState(null);
    const [selectedNews, setSelectedNews] = useState(null);

    // Filter Logic
    const filteredNews = activeTab === "All"
        ? newsItems
        : newsItems.filter(n => n.category === activeTab);

    // Derived Display Logic
    const activeDisplayNews = hoveredNews || selectedNews;

    return (
        <div className="space-y-6">

            {/* Header: Title & Segmented Control */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Market News Intelligence</h2>
                    <div className="text-xs text-white/40 mt-1">Filtered, scored & mapped to market impact</div>
                </div>
                <CardSegmented
                    value={activeTab}
                    onChange={setActiveTab}
                    options={TABS}
                />
            </div>

            {/* Content: Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left: Feed Panel (66%) */}
                <div className="lg:col-span-8">
                    <NewsFeed
                        newsItems={filteredNews}
                        onHoverNews={setHoveredNews}
                        onSelectNews={setSelectedNews}
                        selectedNewsId={selectedNews?.id}
                    />
                </div>

                {/* Right: Impact Detail Panel (33%) */}
                <div className="hidden lg:block lg:col-span-4 h-full">
                    <NewsImpactPanel news={activeDisplayNews} />
                </div>

            </div>
        </div>
    );
}
