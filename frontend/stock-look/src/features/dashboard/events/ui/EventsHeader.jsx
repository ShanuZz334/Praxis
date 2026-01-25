import React from "react";
import PortalTooltip from "@/shared/components/ui/PortalTooltip";

export default function EventsHeader({
    cluster,
    regime = "Calm", // Calm, Event-Loaded, Binary Risk
    sentimentScore = 0, // -100 to +100
    nextHighImpact, // Event object
}) {

    // Logic for color/labels based on sentiment score
    let sentimentColor = "text-yellow-400";
    let sentimentLabel = "Neutral";
    let progressColor = "bg-yellow-500";

    // Scale -100 to +100 for progress bar (0 to 100%)
    // -100 -> 0%, 0 -> 50%, +100 -> 100%
    const progressWidth = Math.min(100, Math.max(0, (sentimentScore + 100) / 2));

    if (sentimentScore >= 20) {
        sentimentColor = "text-emerald-400";
        sentimentLabel = "Bullish";
        progressColor = "bg-emerald-500";
    } else if (sentimentScore <= -20) {
        sentimentColor = "text-red-500";
        sentimentLabel = "Bearish";
        progressColor = "bg-red-500";
    }

    return (
        <div className="rounded-2xl bg-[#0b1220] border border-white/10 overflow-hidden shadow-2xl space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10">

                {/* 1. SENTIMENT GAUGE */}
                <div className="p-6 relative group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                            Net Market Sentiment
                            <PortalTooltip content={<div className="p-2 bg-black border border-white/10 text-xs">AI-derived aggregate score of news sentiment (-100 to +100).</div>}>
                                <span className="cursor-help text-white/20 hover:text-white/60">ⓘ</span>
                            </PortalTooltip>
                        </div>
                        {cluster?.detected && (
                            <div className="animate-pulse px-2 py-0.5 rounded bg-red-500/20 border border-red-500/50 text-[10px] text-red-400 font-bold uppercase tracking-wide">
                                Cluster Detected
                            </div>
                        )}
                    </div>

                    <div className="flex items-baseline gap-3 mb-4">
                        <div className="text-6xl font-bold text-white tracking-tighter">
                            {sentimentScore > 0 ? "+" : ""}{sentimentScore}
                        </div>
                        <div className="flex flex-col justify-end h-full py-1">
                            <div className={`text-lg font-bold ${sentimentColor} transition-colors duration-500 uppercase`}>
                                {sentimentLabel}
                            </div>
                            <div className="text-[10px] text-white/30 font-mono">/ ±100</div>
                        </div>
                    </div>

                    {/* Progress Bar (Centered at 50%) */}
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-4 relative">
                        {/* Center Marker */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/10 z-10" />
                        <div
                            className={`h-full ${progressColor} transition-all duration-1000 ease-out`}
                            style={{ width: `${progressWidth}%` }}
                        />
                    </div>
                </div>

                {/* 2. REGIME & NEXT BIG EVENT */}
                <div className="p-6 flex flex-col justify-center">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Market Regime</div>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl font-bold text-white">{regime}</div>
                        {regime === 'Vol Expansion' && (
                            <div className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                Vega Long
                            </div>
                        )}
                    </div>

                    {nextHighImpact && (
                        <div className="mt-2 p-3 rounded bg-white/5 border border-white/5">
                            <div className="text-[10px] text-white/40 uppercase mb-1">Next Catalyst</div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-white/90">{nextHighImpact.title}</span>
                                <span className="text-xs text-red-400 font-mono font-bold">In {differenceInHours(nextHighImpact)}h</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. DATA INTEGRITY */}
                <div className="p-6 flex flex-col justify-center gap-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Data Integrity</div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm text-white/80">Live Calendar</span>
                        </div>
                        <div className="text-xs font-mono text-white/50">
                            Bloomberg/NSE
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-white/60">
                            <span>Coverage</span>
                            <span>Global & Domestic</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-full rounded-full" />
                        </div>
                    </div>
                </div>

            </div>

            {/* CLUSTER WARNING BANNER */}
            {cluster?.detected && (
                <div className="bg-red-500/10 border-t border-red-500/20 p-2 flex items-center justify-center gap-3 text-xs text-red-300">
                    <span className="font-bold">⚠️ High Volatility Alert:</span>
                    <span>{cluster.count} High-Impact events detected within {cluster.days} days. Expect IV expansion.</span>
                </div>
            )}
        </div>
    );
}

// Simple helper for hours diff (mock since we don't have the lib imported in this file yet)
function differenceInHours(event) {
    if (!event?.date) return 0;
    const diff = new Date(event.date) - new Date();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
}
