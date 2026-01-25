import React from "react";
import { GlobalCard } from "@/shared/components/ui/GlobalCard";

export default function EventsGrid({ newsItems, onNewsClick }) {

    if (!newsItems || newsItems.length === 0) {
        return (
            <div className="text-center py-12 text-white/40">
                No events or news intelligence available
            </div>
        );
    }

    // Sort by absolute impact (Magnitude) to show biggest movers first
    const sortedNews = [...newsItems].sort((a, b) => Math.abs(b.impactScore || 0) - Math.abs(a.impactScore || 0));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
            {sortedNews.map((news) => {
                // Determine display properties from AI Score
                const score = news.impactScore || 0;

                // Color coding based on sign
                // Positive = Bullish (Green), Negative = Bearish (Red)
                // We normalize this for the GlobalCard "normalized" prop (0-1) 
                // but we might need a way to tell GlobalCard to be RED.
                // Currently GlobalCard uses 0-1. Let's map -10 to +10 range to 0-1 for intensity, 
                // but we need a "trend" or "reason" to convey direction.

                const absScore = Math.abs(score);
                const normalized = Math.min(1, absScore / 8); // Scale 0-8 to 0-1 intensity

                // Formulate "Analysis" string
                const sentiment = score > 0 ? "Bullish" : score < 0 ? "Bearish" : "Neutral";
                const sentimentIcon = score > 0 ? "▲" : score < 0 ? "▼" : "•";

                return (
                    <GlobalCard
                        key={news.id}
                        label={news.title}
                        // Use Source + Time as "Raw Value" context
                        raw={`${news.source} • ${formatTime(news.timestamp)}`}
                        unit=""

                        // Pass the direction/sentiment explicitly via reason or separate prop if supported
                        // GlobalCard primarily uses 'normalized' for the gauge color (Red->Green). 
                        // If we want Negative to be Red and Positive to be Green, we can just map simple 0-1.
                        // However, standard GlobalCard mapping is 0(Red)...1(Green).
                        // So: -10 -> 0 (Red), 0 -> 0.5 (Yellow), +10 -> 1 (Green).
                        normalized={(score + 10) / 20}

                        // Use impact score as "Credit Weight" equivalent
                        creditAllocation={Math.round(absScore)} // High impact = More credits/weight
                        totalPageCredits={10} // Relative scale

                        reason={`${sentimentIcon} ${sentiment}: ${news.takeaway}`}

                        onClick={() => onNewsClick?.(news)}
                    />
                );
            })}
        </div>
    );
}

function formatTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return "1d+";
}
