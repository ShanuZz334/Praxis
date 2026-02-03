/**
 * @file NewsFeed.jsx
 * @purpose Container component for iterating and rendering a list of NewsCards.
 * @responsibilities
 * - Maps through a list of news items.
 * - Handles empty state rendering.
 * - Passes interaction callbacks (hover/select) to child cards.
 * @key_exports
 * - NewsFeed (Default Component)
 * @dependencies
 * - NewsCard: Individual item renderer.
 * @lifecycle
 * - Child of NewsSection or AdvancedNewsFeed.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import NewsCard from "./NewsCard";

// =============================
// Main Component
// =============================
export default function NewsFeed({ newsItems, onHoverNews, onSelectNews, selectedNewsId }) {
    if (!newsItems || newsItems.length === 0) {
        return (
            <div className="text-center py-10 text-white/30">
                No news items match current filters.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {newsItems.map(item => (
                <NewsCard
                    key={item.id}
                    news={item}
                    onHover={onHoverNews}
                    onClick={onSelectNews}
                    isSelected={selectedNewsId === item.id}
                />
            ))}
        </div>
    );
}
