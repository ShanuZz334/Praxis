import React, { useState } from "react";
import NewsFeed from "./NewsFeed";
import NewsImpactPanel from "./NewsImpactPanel";
import CardSegmented from "@/shared/components/controls/CardSegmented";

export default function NewsSection({ newsItems }) {
    const [activeTab, setActiveTab] = useState("All");
    const [hoveredNews, setHoveredNews] = useState(null);
    const [selectedNews, setSelectedNews] = useState(null);

    const tabs = [
        { value: "All", label: "All News" },
        { value: "Macro", label: "Macro" },
        { value: "Policy", label: "Policy" },
        { value: "Corporate", label: "Corporate" },
        { value: "Global", label: "Global" }
    ];

    const filteredNews = activeTab === "All"
        ? newsItems
        : newsItems.filter(n => n.category === activeTab);

    // Use the hovered news for the right panel, or fallback to selected, or null
    const activeDisplayNews = hoveredNews || selectedNews;

    return (
        <div className="space-y-6">
            {/* TITLE & FILTERS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Market News Intelligence</h2>
                    <div className="text-xs text-white/40 mt-1">Filtered, scored & mapped to market impact</div>
                </div>
                <CardSegmented
                    value={activeTab}
                    onChange={setActiveTab}
                    options={tabs}
                />
            </div>

            {/* TWO-COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LEFT: FEED (70% - span 8) */}
                <div className="lg:col-span-8">
                    <NewsFeed
                        newsItems={filteredNews}
                        onHoverNews={setHoveredNews}
                        onSelectNews={setSelectedNews}
                        selectedNewsId={selectedNews?.id}
                    />
                </div>

                {/* RIGHT: IMPACT PANEL (30% - span 4) */}
                <div className="hidden lg:block lg:col-span-4 h-full">
                    <NewsImpactPanel news={activeDisplayNews} />
                </div>

            </div>

        </div>
    );
}
