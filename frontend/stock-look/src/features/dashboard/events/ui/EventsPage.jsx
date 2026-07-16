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

import React, { useState } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import AdvancedNewsFeed from "./AdvancedNewsFeed";

export default function EventsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortMode, setSortMode] = useState("latest");

    const newsItems = [];

    return (
        <div className="px-4 md:px-6 pt-2 space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">

            <GlobalHeader
                title="Events Sentiment"
                score={0}
                prevScore={null}
                gauge={{ label: "—", color: "#64748B" }}
                regime={{ label: "—", description: "No data loaded", color: "#64748B", confidence: 0 }}
                sections={[]}
                tailwinds={[]}
                risks={[]}
                integrity={{ coverage: "—", source: "—", freshness: "—" }}
                totalCredits={0}
                creditLabel="R Credits"
                cards={[]}
                syncId={{ instrumentKey: 'EVENTS', category: 'events' }}
                controls={{
                    search: searchQuery,
                    onSearchChange: setSearchQuery,
                    sortMode,
                    onSortChange: setSortMode,
                    matchCount: 0
                }}
            />

            {/* News Feed — empty until real data is wired */}
            <AdvancedNewsFeed
                newsItems={newsItems}
                onReset={() => { setSearchQuery(""); setSortMode("latest"); }}
            />

        </div>
    );
}
