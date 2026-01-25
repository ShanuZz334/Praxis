import React from "react";

export default function PerformanceStats({ stats }) {
    return (
        <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-6 shadow-lg">
            <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-6">Trade Performance Breakdown</div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 divide-x divide-white/5">
                <StatItem label="Avg R Multiple" value={`${stats.avgR}R`} color="text-emerald-300" />
                <StatItem label="Profit Factor" value={stats.profitFactor} color="text-amber-300" />
                <StatItem label="Expectancy" value={`$${stats.expectancy}`} />
                <StatItem label="Avg Hold Time" value={stats.avgHoldTime} />
                <div className="pl-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase mb-2">Setups Analysis</div>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-green-400">Best:</span>
                            <span className="text-white/80">{stats.bestSetup}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-red-400">Worst:</span>
                            <span className="text-white/80">{stats.worstSetup}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatItem({ label, value, color = "text-white/90" }) {
    return (
        <div className="px-4 first:pl-0 flex flex-col justify-center gap-1">
            <div className="text-[9px] uppercase text-white/40 font-bold tracking-wide">{label}</div>
            <div className={`text-xl font-bold ${color}`}>{value}</div>
        </div>
    );
}
