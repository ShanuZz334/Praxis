import React from "react";
import { Cpu, RotateCcw } from "lucide-react";

export default function AdvancedNewsFeed({ newsItems, onReset }) {
    if (!newsItems || newsItems.length === 0) return null;

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-end pb-2 border-b border-border-default">
                <div className="flex items-center gap-3">
                    <Cpu className="w-4 h-4 text-text-tertiary" />
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Live Intelligence Stream</span>
                </div>

                {onReset && (
                    <button
                        onClick={onReset}
                        className="p-1 hover:bg-background-surface rounded-md transition-colors group"
                        title="Reset Sort & Filter"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-text-tertiary group-hover:text-emerald-400 transition-colors" />
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {newsItems.map((news) => (
                    <NewsItem key={news.id} news={news} />
                ))}
            </div>
        </div>
    );
}

// Single News Item Component (Bloomberg Style - Clean, Institutional)
function NewsItem({ news }) {
    const score = news.impactScore || 0;
    const isBull = score > 0;
    const isBear = score < 0;

    // Color Logic
    const accentColor = isBull ? "bg-emerald-500" : isBear ? "bg-red-500" : "bg-slate-500";
    const scoreColor = isBull ? "text-emerald-400" : isBear ? "text-red-400" : "text-slate-400";
    const scoreBg = isBull ? "bg-emerald-500/10" : isBear ? "bg-red-500/10" : "bg-slate-500/10";

    return (
        <div className="group relative w-full bg-background-card border border-border-default hover:border-border-default hover:bg-background-surface transition-all duration-200 rounded-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Left Accent Bar (Thin) */}
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentColor}`} />

            <div className="pl-5 pr-4 py-3 flex flex-col gap-1.5">
                {/* 1. Header Row: Source | Time | Score */}
                <div className="flex justify-between items-center h-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{news.source}</span>
                        {news.eventType && (
                            <>
                                <span className="text-[10px] text-text-tertiary">•</span>
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-background-surface text-text-tertiary border border-border-default">
                                    {news.eventType}
                                </span>
                            </>
                        )}
                        <span className="text-[10px] text-text-tertiary">•</span>
                        <span className="text-[10px] text-text-tertiary font-mono">{formatTime(news.timestamp)}</span>
                    </div>

                    {/* Impact Badge (Compact) */}
                    <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded ${scoreBg}`}>
                        <span className={`text-[10px] font-bold font-mono ${scoreColor}`}>
                            {score > 0 ? "+" : ""}{score}
                        </span>
                    </div>
                </div>

                {/* 2. Headline (Bold, Scannable) */}
                <h3 className="text-sm font-semibold text-text-primary leading-snug group-hover:text-text-primary transition-colors">
                    {news.title}
                </h3>

                {/* 3. AI Interpretation (Subtle) */}
                <div className="flex items-start gap-2 mt-1">
                    <div className={`mt-1.5 w-1 h-1 rounded-full ${accentColor} opacity-60`} />
                    <div className="flex flex-col gap-1">
                        <p className="text-xs text-text-secondary italic leading-relaxed">
                            {news.takeaway}
                        </p>
                        {news.affectedInstruments && news.affectedInstruments.length > 0 && (
                            <div className="text-[10px] font-medium text-text-tertiary tracking-tight">
                                Affected: <span className="text-text-secondary">{news.affectedInstruments.join(' • ')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Footer Row: Tags | Horizon */}
                <div className="mt-2 flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {news.tags && news.tags.length > 0 && news.tags.map((tag, i) => (
                            <span key={i} className="text-[9px] uppercase font-bold tracking-wide text-text-tertiary hover:text-text-secondary transition-colors">
                                #{tag.label}
                            </span>
                        ))}
                    </div>

                    {news.horizon && (
                        <div className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary">
                            Horizon: <span className="text-text-tertiary">{news.horizon}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
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
