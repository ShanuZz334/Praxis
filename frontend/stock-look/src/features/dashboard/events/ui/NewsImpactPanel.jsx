import React, { useState } from "react";

export default function NewsImpactPanel({ news }) {
    if (!news) {
        return (
            <div className="flex flex-col items-center justify-center p-6 text-center text-white/20 border border-white/5 rounded-2xl bg-[#0b1220] h-[400px]">
                <div className="text-4xl mb-4 opacity-20">📡</div>
                <div className="text-sm">Hover over a news item to see its market impact analysis</div>
            </div>
        );
    }

    const { impact, playbook, impactScore, historicalReactionScore } = news;

    // Mock history values for visualization
    const avgNiftyMove = (historicalReactionScore * 0.25).toFixed(2); // Mock: 2.0% etc
    const avgIvChange = (historicalReactionScore * 1.5).toFixed(1); // Mock: 12% etc

    return (
        <div className="flex flex-col gap-4 sticky top-6 animate-in slide-in-from-right-4 duration-500">

            {/* 1. IMPACT SUMMARY & SCORE */}
            <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                    <div className="text-xs font-bold text-white/40 uppercase tracking-wider">Impact Assessment</div>
                    <div className="flex items-end gap-1">
                        <div className="text-2xl font-bold text-white/90 leading-none">{impactScore}</div>
                        <div className="text-[10px] text-white/30 font-medium mb-1">/10</div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        {/* Directional Bias Badge */}
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] uppercase text-white/30">Bias</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${playbook.direction.includes('Risk-Off') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                playbook.direction.includes('Risk-On') ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                    'bg-slate-500/10 text-slate-300 border-slate-500/20'
                                }`}>
                                {playbook.direction}
                            </span>
                        </div>

                        {/* Trading Lens Grid */}
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="p-2 rounded bg-white/5 border border-white/5">
                                <div className="text-[9px] uppercase text-white/30 mb-1">Equity</div>
                                <div className="text-xs font-medium text-white/80 leading-tight">{playbook.equityBias}</div>
                            </div>
                            <div className="p-2 rounded bg-white/5 border border-white/5">
                                <div className="text-[9px] uppercase text-white/30 mb-1">Options</div>
                                <div className="text-xs font-medium text-white/80 leading-tight">{playbook.optionsBias}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. HISTORICAL REACTION (Visuals) */}
            <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-5 shadow-lg">
                <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4 flex justify-between">
                    <span>History (Similar Events)</span>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 rounded border border-blue-500/20">N=42</span>
                </div>

                <div className="space-y-4">
                    {/* Nifty Move Bar */}
                    <div>
                        <div className="flex justify-between text-[10px] text-white/50 mb-1">
                            <span>Avg Nifty Move</span>
                            <span className="text-white">{avgNiftyMove}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, historicalReactionScore * 10)}%` }} />
                        </div>
                    </div>

                    {/* IV Change Bar */}
                    <div>
                        <div className="flex justify-between text-[10px] text-white/50 mb-1">
                            <span>Avg IV Spike</span>
                            <span className="text-purple-300">+{avgIvChange}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, historicalReactionScore * 12)}%` }} />
                        </div>
                    </div>

                    {/* Conf Probability */}
                    <div>
                        <div className="flex justify-between text-[10px] text-white/50 mb-1">
                            <span>Follow-through Prob.</span>
                            <span className="text-emerald-300">High ({historicalReactionScore * 9}%)</span>
                        </div>
                        <div className="flex gap-0.5">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className={`h-1 flex-1 rounded-sm ${i < historicalReactionScore ? 'bg-emerald-500' : 'bg-white/10'}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

function ImpactRow({ label, value }) {
    let color = "text-slate-400";
    if (value.includes("Bearish") || value.includes("Put") || value.includes("Spike")) color = "text-red-400";
    if (value.includes("Bullish") || value.includes("Call")) color = "text-green-400";
    if (value.includes("Neutral") || value.includes("Stable")) color = "text-yellow-400";

    return (
        <div className="flex justify-between items-center text-xs">
            <span className="text-white/60">{label}</span>
            <span className={`font-semibold ${color}`}>{value}</span>
        </div>
    );
}
