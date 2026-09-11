/**
 * @file PerformanceStats.jsx
 * @purpose Breakdown of trading performance statistics.
 * @responsibilities
 * - Displays Avg R-Multiple, Profit Factor, Expectancy, and Hold Time.
 * - Highlights best and worst setups.
 * @key_exports
 * - PerformanceStats (Default)
 * @dependencies
 * - Lucide React
 * @lifecycle
 * - Rendered by WalletPage.
 * @date 2026-02-03
 */

import React from "react";
import { BarChart3, TrendingUp, Compass, Clock, Sparkles } from "lucide-react";

export default function PerformanceStats({ stats = {} }) {
    const rawAvgR = stats.avgR;
    const displayAvgR = (rawAvgR && rawAvgR !== "—" && !isNaN(rawAvgR)) ? `${rawAvgR}R` : "—";
    const displayPF = (stats.profitFactor && stats.profitFactor !== "—") ? stats.profitFactor : "—";
    const displayExp = (stats.expectancy && stats.expectancy !== "—") ? stats.expectancy : "—";
    const displayHold = (stats.avgHoldTime && stats.avgHoldTime !== "N/A" && stats.avgHoldTime !== "—") ? stats.avgHoldTime : "—";
    const bestSetup = (stats.bestSetup && stats.bestSetup !== "N/A") ? stats.bestSetup : "—";
    const worstSetup = (stats.worstSetup && stats.worstSetup !== "N/A") ? stats.worstSetup : "—";

    return (
        <div className="bg-background-card/60 backdrop-blur-xl border border-border-default/40 rounded-2xl p-5 md:p-6 shadow-sm hover:border-border-default/60 transition-all">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-border-default/30">
                <div className="flex items-center gap-2">
                    <BarChart3 size={15} className="text-sky-400" />
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                        Trade Performance Breakdown
                    </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-background-surface/60 border border-border-subtle/50 text-text-tertiary">
                    <span>Journal Analytics</span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                <StatCard
                    icon={<TrendingUp size={13} className="text-emerald-400" />}
                    label="Avg R Multiple"
                    value={displayAvgR}
                    color={displayAvgR !== "—" ? "text-emerald-400" : "text-text-tertiary"}
                    subtext="Reward to Risk Ratio"
                />
                <StatCard
                    icon={<Sparkles size={13} className="text-amber-400" />}
                    label="Profit Factor"
                    value={displayPF}
                    color={displayPF !== "—" ? "text-amber-400" : "text-text-tertiary"}
                    subtext="Gross Win / Gross Loss"
                />
                <StatCard
                    icon={<Compass size={13} className="text-sky-400" />}
                    label="Expectancy"
                    value={displayExp}
                    color={displayExp !== "—" ? "text-text-primary" : "text-text-tertiary"}
                    subtext="Avg Value Per Trade"
                />
                <StatCard
                    icon={<Clock size={13} className="text-violet-400" />}
                    label="Avg Hold Time"
                    value={displayHold}
                    color={displayHold !== "—" ? "text-text-primary" : "text-text-tertiary"}
                    subtext="Trade Duration"
                />

                {/* Setups Analysis */}
                <div className="p-3.5 rounded-xl bg-background-surface/40 border border-border-subtle/40 flex flex-col justify-between col-span-2 sm:col-span-1">
                    <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
                        Setups Analysis
                    </div>
                    <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between items-center">
                            <span className="text-emerald-400/90 text-[11px]">Best:</span>
                            <span className="text-text-primary font-bold text-xs truncate max-w-[100px]">{bestSetup}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-rose-400/90 text-[11px]">Worst:</span>
                            <span className="text-text-primary font-bold text-xs truncate max-w-[100px]">{worstSetup}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color = "text-text-primary", subtext }) {
    return (
        <div className="p-3.5 rounded-xl bg-background-surface/40 border border-border-subtle/40 flex flex-col justify-between hover:bg-background-surface/60 transition-all">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase text-text-tertiary font-bold tracking-wider">{label}</span>
                {icon}
            </div>
            <div>
                <div className={`text-xl font-bold font-mono tracking-tight ${color}`}>{value}</div>
                {subtext && <div className="text-[9px] text-text-tertiary mt-0.5 opacity-70 font-medium">{subtext}</div>}
            </div>
        </div>
    );
}

