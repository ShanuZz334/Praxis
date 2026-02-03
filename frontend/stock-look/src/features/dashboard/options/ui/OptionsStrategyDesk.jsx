/**
 * @file OptionsStrategyDesk.jsx
 * @purpose Actionable strategy panel based on Options Intelligence.
 * @responsibilities
 * - Displays the primary "Action Signal" (Bullish/Bearish/Neutral).
 * - Suggests top trading strategies (e.g., Bull Call Spread, Iron Condor) based on IV Rank and Bias.
 * - Highlights "Top Picks" (specific contracts) with high algorithmic scores.
 * - Provides execution notes explaining the "Why".
 * @key_exports
 * - OptionsStrategyDesk (Default Component)
 * @dependencies
 * - optionsHelper: Strategy logic.
 * @lifecycle
 * - Rendered by OptionsChainLayout (Sidebar).
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useMemo } from "react";
import { getStrategySuggestions, getTopContracts } from "@/features/dashboard/options/engine/optionsHelper";

// =============================
// Main Component
// =============================
export default function OptionsStrategyDesk({ score, metrics, ivRank = 30, chain = [] }) {

    // 1. Determine Bias Status
    let status = { label: "Neutral", color: "text-text-tertiary", bg: "bg-background-elevated" };
    if (score > 65) status = { label: "Bullish Bias", color: "text-state-bullish-text", bg: "bg-state-bullish-surface" };
    else if (score < 35) status = { label: "Bearish Bias", color: "text-state-bearish-text", bg: "bg-state-bearish-surface" };

    // 2. Compute Suggestions
    const strategies = useMemo(() => getStrategySuggestions(score, metrics?.pcr || 1, ivRank), [score, metrics, ivRank]);

    // 3. Get Top Contracts (Legacy Sort)
    const { ce: topCE, pe: topPE } = useMemo(() => getTopContracts(chain), [chain]);

    return (
        <div className="h-full flex flex-col bg-transparent">
            {/* Header */}
            <div className="p-4 border-b border-border-subtle">
                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1.5 opacity-60">
                    Action Signal
                </div>
                <div className={`text-lg font-black tracking-tight ${status.color}`}>
                    {status.label}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-5 custom-scrollbar">

                {/* Primary Strategy Card */}
                {strategies.length > 0 && (
                    <div className="relative group p-[1px] rounded-2xl overflow-hidden shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-r from-accent-primary via-purple-500 to-accent-primary opacity-30 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative bg-background-card rounded-2xl p-4 h-full">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary font-black uppercase tracking-wider border border-accent-primary/20 shadow-sm">
                                    Top Pick
                                </span>
                            </div>
                            <div className="text-base font-black text-text-primary mb-2 group-hover:text-accent-primary transition-colors">
                                {strategies[0].name}
                            </div>
                            <div className="text-xs text-text-secondary leading-relaxed font-normal">
                                <span className="text-text-primary font-bold">Why:</span> {strategies[0].reason}
                            </div>
                            <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-[10px] text-text-tertiary uppercase font-black">
                                <span>Risk: Medium</span>
                                <span className="text-state-bullish-text opacity-90">High Prob</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Secondary Strategies */}
                <div className="space-y-3">
                    {strategies.slice(1).map((strat, idx) => (
                        <div key={idx} className="bg-background-elevated/40 border border-border-subtle rounded-xl p-3.5 hover:bg-background-subtle transition-all shadow-sm group">
                            <div className="text-sm font-bold text-text-primary mb-1 group-hover:text-accent-primary transition-colors">
                                {strat.name}
                            </div>
                            <div className="text-[11px] text-text-tertiary leading-relaxed">
                                {strat.reason}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Execution Logic */}
                <div className="pt-2 p-4 bg-background-elevated/20 rounded-xl border border-border-subtle border-dashed shadow-inner">
                    <div className="text-[10px] uppercase text-text-tertiary font-black mb-3 tracking-widest opacity-60">Execution Notes</div>
                    <ul className="text-xs text-text-secondary space-y-2.5 list-none">
                        <li className="flex gap-2">
                            <span className="text-accent-primary mt-1">•</span>
                            <span>PCR at <strong className="text-text-primary font-bold">{metrics?.pcr?.toFixed(2) || '-'}</strong> suggests {metrics?.pcr > 1 ? 'support' : 'resistance'}.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-accent-primary mt-1">•</span>
                            <span>Max Pain at <strong className="text-text-primary font-bold">{metrics?.maxPain || '-'}</strong> acts as magnet.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-accent-primary mt-1">•</span>
                            <span>IV Rank is <strong className="text-text-primary font-bold">{ivRank}/100</strong>. {ivRank < 40 ? 'Option buying favored.' : 'Option selling favored.'}</span>
                        </li>
                    </ul>
                </div>

                {/* Activity Feed (Highest OI) */}
                <div className="pt-4 mt-2">
                    <div className="text-[10px] uppercase text-text-tertiary font-black mb-3 tracking-widest opacity-60">Highest Activity</div>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Calls */}
                        <div className="bg-state-bullish-surface/30 rounded-xl p-3 border border-state-bullish-text/10 shadow-sm">
                            <div className="text-[10px] uppercase text-state-bullish-text font-black mb-2.5 flex justify-between tracking-wider">
                                <span>Calls</span>
                                <span>OI</span>
                            </div>
                            <div className="space-y-2">
                                {topCE.map((c, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs group">
                                        <span className="text-text-primary font-mono font-bold group-hover:text-state-bullish-text transition-colors">{c.strike}</span>
                                        <span className="text-text-tertiary text-[10px] font-mono opacity-60">{(c.oi / 1000).toFixed(0)}k</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Puts */}
                        <div className="bg-state-bearish-surface/30 rounded-xl p-3 border border-state-bearish-text/10 shadow-sm">
                            <div className="text-[10px] uppercase text-state-bearish-text font-black mb-2.5 flex justify-between tracking-wider">
                                <span>Puts</span>
                                <span>OI</span>
                            </div>
                            <div className="space-y-2">
                                {topPE.map((p, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs group">
                                        <span className="text-text-primary font-mono font-bold group-hover:text-state-bearish-text transition-colors">{p.strike}</span>
                                        <span className="text-text-tertiary text-[10px] font-mono opacity-60">{(p.oi / 1000).toFixed(0)}k</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 text-center">
                    <span className="text-[8px] font-black text-text-tertiary uppercase tracking-[0.3em] opacity-30">Option Greeks Engine Live</span>
                </div>
            </div>
        </div>
    );
}
