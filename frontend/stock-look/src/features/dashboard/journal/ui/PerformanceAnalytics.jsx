/**
 * @file PerformanceAnalytics.jsx
 * @purpose Visualization of trading performance metrics (Expectancy, Profit Factor).
 * @responsibilities
 * - Displays high-level system viability stats.
 * - Shows strategy-specific performance breakdowns.
 * - Uses responsive cards for data presentation.
 * @key_exports
 * - PerformanceAnalytics (Default Component)
 * @dependencies
 * - lucide-react (Icons)
 * @lifecycle
 * - Rendered by JournalPage (Sidebar).
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";

// =============================
// Main Component
// =============================

export default function PerformanceAnalytics({ analytics }) {
    if (!analytics) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* CARD A: SYSTEM VIABILITY */}
            <div className="relative bg-background-card border border-border-default rounded-2xl p-6 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/3 to-transparent" />
                <div className="relative z-10">
                    <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-6 border-b border-border-default pb-2">
                        System Viability
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Expectancy</div>
                            <div className="text-2xl font-bold text-text-primary font-mono tracking-tighter">{analytics.expectancy}R</div>
                            <div className="text-[9px] text-emerald-400 mt-1">Positive Edge</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Profit Factor</div>
                            <div className="text-2xl font-bold text-text-primary font-mono tracking-tighter">{analytics.profitFactor}</div>
                            <div className="text-[9px] text-blue-400 mt-1">Scalable</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD B: STRATEGY ALLOCATION */}
            <div className="relative bg-background-card border border-border-default rounded-2xl p-6 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/3 to-transparent" />
                <div className="relative z-10">
                    <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-4 border-b border-border-default pb-2">
                        Strategy Performance
                    </div>

                    <div className="space-y-3">
                        {analytics.strategies.map((strat, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-border-default last:border-0 hover:bg-background-surface -mx-2 px-2 rounded-lg transition-colors">
                                <div>
                                    <div className="text-xs font-bold text-text-secondary">{strat.name}</div>
                                    <div className="text-[9px] text-text-tertiary uppercase font-medium">{strat.winRate}% Win Rate</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xs font-bold font-mono ${strat.expectancy > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {strat.expectancy > 0 ? '+' : ''}{strat.expectancy}R
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
