/**
 * @file PerformanceStats.jsx
 * @purpose Breakdown of trading performance statistics.
 * @responsibilities
 * - Displays Avg R-Multiple, Profit Factor, Expectancy, and Hold Time.
 * - Highlights best and worst setups.
 * @key_exports
 * - PerformanceStats (Default)
 * @dependencies
 * - None (Pure UI)
 * @lifecycle
 * - Rendered by WalletPage (Future/Expanded).
 * @date 2026-02-03
 */

import React from "react";

export default function PerformanceStats({ stats }) {
    return (
        <div className="bg-background-card-primary border border-border-subtle-translucent rounded-2xl p-6 shadow-lg">
            <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-6">Trade Performance Breakdown</div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 divide-x divide-border-subtle">
                <StatItem label="Avg R Multiple" value={`${stats.avgR}R`} color="text-emerald-400" />
                <StatItem label="Profit Factor" value={stats.profitFactor} color="text-amber-400" />
                <StatItem label="Expectancy" value={stats.expectancy} />
                <StatItem label="Avg Hold Time" value={stats.avgHoldTime} />
                <div className="pl-4">
                    <div className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider mb-3">Setups Analysis</div>
                    <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between items-center">
                            <span className="text-emerald-400/80">Best:</span>
                            <span className="text-text-primary font-bold">{stats.bestSetup}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-red-400/80">Worst:</span>
                            <span className="text-text-primary font-bold">{stats.worstSetup}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatItem({ label, value, color = "text-text-primary" }) {
    return (
        <div className="px-4 first:pl-0 flex flex-col justify-center gap-1.5">
            <div className="text-[9px] uppercase text-text-tertiary font-bold tracking-widest">{label}</div>
            <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
        </div>
    );
}
