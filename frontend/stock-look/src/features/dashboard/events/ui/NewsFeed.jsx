import React from "react";
import NewsCard from "./NewsCard";

export default function NewsFeed({ newsItems, onHoverNews, onSelectNews, selectedNewsId }) {
    return (
        <div className="space-y-4">
            {newsItems.length === 0 ? (
                <div className="text-center py-10 text-white/30">
                    No news items match current filters.
                </div>
            ) : (
                newsItems.map(item => (
                    <NewsCard
                        key={item.id}
                        news={item}
                        onHover={onHoverNews}
                        onClick={onSelectNews}
                        isSelected={selectedNewsId === item.id}
                    />
                ))
            )}
        </div>
    );
}
