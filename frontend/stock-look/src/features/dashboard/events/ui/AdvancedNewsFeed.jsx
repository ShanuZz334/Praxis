/**
 * @file AdvancedNewsFeed.jsx
 * @purpose Renders a high-density, Bloomberg-style news feed for real-time market intelligence.
 * @responsibilities
 * - Displays a live stream of scored news items.
 * - Indicators for sentiment, source credibility, and AI-driven analysis.
 * - Supports resetting filters via a clear action button.
 * - Uses animation for smooth entry of new items.
 * @key_exports
 * - AdvancedNewsFeed (Default Component)
 * @dependencies
 * - lucide-react (Icons)
 * @lifecycle
 * - Rendered by EventsPage and NewsSection.
 * - Updates efficiently as the `newsItems` prop changes.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import { Cpu, RotateCcw } from "lucide-react";

// =============================
// Main Component
// =============================
export default function AdvancedNewsFeed({ newsItems, onReset }) {
    if (!newsItems || newsItems.length === 0) return null;

    return (
        <div className="w-full space-y-4">
            {/* Header / Toolbar */}
            <div className="flex justify-between items-center pb-2 border-b border-border-default">
                <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-text-tertiary" />
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                        Live Intelligence Stream
                    </span>
                </div>

                {onReset && (
                    <button
                        onClick={onReset}
                        className="p-1 hover:bg-background-surface rounded-md transition-colors group"
                        title="Reset Sort & Filter"
                    >
                        <RotateCcw className="w-3 h-3 text-text-tertiary group-hover:text-emerald-400 transition-colors" />
                    </button>
                )}
            </div>

            {/* Feed List */}
            <div className="space-y-2">
                {newsItems.map((news) => (
                    <NewsItem key={news.id} news={news} />
                ))}
            </div>
        </div>
    );
}

// =============================
// Helper Component (Internal)
// =============================

/**
 * NewsItem
 * Renders a single news row with institutional-grade visual cues.
 */
function NewsItem({ news }) {
    const score = news.impactScore || 0;
    const isBull = score > 0;
    const isBear = score < 0;

    // Stylistic Logic
    const accentColor = isBull ? "bg-emerald-500" : isBear ? "bg-red-500" : "bg-slate-500";
    const scoreColor = isBull ? "text-emerald-400" : isBear ? "text-red-400" : "text-slate-400";
    const scoreBg = isBull ? "bg-emerald-500/10" : isBear ? "bg-red-500/10" : "bg-slate-500/10";

    return (
        <div className="group relative w-full bg-background-card border border-border-default hover:border-border-default hover:bg-background-surface transition-all duration-200 rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Left Accent Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg ${accentColor}`} />

            <div className="pl-4 pr-3 py-2.5 flex flex-col gap-1">
                {/* 1. Header: Source | Time | Badge */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary truncate">
                            {news.source}
                        </span>
                        {news.eventType && (
                            <>
                                <span className="text-[9px] text-text-tertiary">•</span>
                                <span className="text-[8px] font-bold uppercase px-1 py-0.5 rounded bg-background-surface text-text-tertiary border border-border-default shrink-0">
                                    {news.eventType}
                                </span>
                            </>
                        )}
                        <span className="text-[9px] text-text-tertiary">•</span>
                        <span className="text-[9px] text-text-tertiary font-mono shrink-0">
                            {formatTime(news.timestamp)}
                        </span>
                    </div>

                    {/* Impact Score Badge */}
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${scoreBg} shrink-0 ml-2`}>
                        <span className={`text-[10px] font-bold font-mono ${scoreColor}`}>
                            {score > 0 ? "+" : ""}{score}
                        </span>
                    </div>
                </div>

                {/* 2. Headline */}
                <h3 className="text-[12px] font-semibold text-text-primary leading-snug">
                    {news.title}
                </h3>

                {/* 3. AI Takeaway */}
                <div className="flex items-start gap-1.5">
                    <div className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${accentColor} opacity-60`} />
                    <div className="flex flex-col gap-0.5">
                        <p className="text-[10px] text-text-secondary italic leading-relaxed">
                            {news.takeaway}
                        </p>
                        {news.affectedInstruments && news.affectedInstruments.length > 0 && (
                            <div className="text-[9px] font-medium text-text-tertiary">
                                Affected: <span className="text-text-secondary">{news.affectedInstruments.join(' • ')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Footer: Tags & Horizon */}
                <div className="mt-1 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                        {news.tags && news.tags.length > 0 && news.tags.map((tag, i) => (
                            <span key={i} className="text-[8px] uppercase font-bold tracking-wide text-text-tertiary">
                                #{tag.label}
                            </span>
                        ))}
                    </div>

                    {news.horizon && (
                        <div className="text-[8px] font-bold uppercase tracking-widest text-text-tertiary shrink-0 ml-2">
                            Horizon: <span>{news.horizon}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// =============================
// Utility Functions
// =============================

/**
 * formatTime
 * Converts ISO string to relative "ago" format.
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
