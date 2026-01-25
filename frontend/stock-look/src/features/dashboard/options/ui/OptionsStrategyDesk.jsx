import React, { useMemo } from "react";
import { getStrategySuggestions, getTopContracts } from "@/features/dashboard/options/engine/optionsHelper";

export default function OptionsStrategyDesk({ score, metrics, ivRank = 30, chain = [] }) {

    // Determine Signal Status
    let status = { label: "Neutral", color: "text-slate-400", bg: "bg-slate-500/10" };
    if (score > 65) status = { label: "Bullish Bias", color: "text-emerald-400", bg: "bg-emerald-500/10" };
    else if (score < 35) status = { label: "Bearish Bias", color: "text-red-400", bg: "bg-red-500/10" };

    // Get Suggestions
    const strategies = useMemo(() => getStrategySuggestions(score, metrics?.pcr || 1, ivRank), [score, metrics, ivRank]);

    // Get Top Contracts
    const { ce: topCE, pe: topPE } = useMemo(() => getTopContracts(chain), [chain]);

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-white/10">
                <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">
                    Action Signal
                </div>
                <div className={`text-lg font-bold ${status.color}`}>
                    {status.label}
                </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                {/* PRIMARY STRATEGY */}
                {strategies.length > 0 && (
                    <div className="relative group p-[1px] rounded-xl overflow-hidden">
                        {/* Gradient Border */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-xy" />

                        <div className="relative bg-[#0b1220] rounded-xl p-4 h-full">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold uppercase tracking-wider border border-blue-500/20">
                                    Top Pick
                                </span>
                            </div>
                            <div className="text-base font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                {strategies[0].name}
                            </div>
                            <div className="text-xs text-white/50 leading-relaxed font-light">
                                <span className="text-white/70 font-medium">Why:</span> {strategies[0].reason}
                            </div>
                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 uppercase font-bold">
                                <span>Risk: Medium</span>
                                <span className="text-emerald-400">High Prob</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* SECONDARY STRATEGIES */}
                {strategies.slice(1).map((strat, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                        <div className="text-sm font-semibold text-white/80 mb-1">
                            {strat.name}
                        </div>
                        <div className="text-xs text-white/40">
                            {strat.reason}
                        </div>
                    </div>
                ))}

                {/* EXECUTION NOTES */}
                <div className="pt-2">
                    <div className="text-[10px] uppercase text-white/30 font-bold mb-2">Execution Notes</div>
                    <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
                        <li>PCR at <strong>{metrics?.pcr?.toFixed(2) || '-'}</strong> suggests {metrics?.pcr > 1 ? 'support' : 'resistance'}.</li>
                        <li>Max Pain at <strong>{metrics?.maxPain || '-'}</strong> acts as expiry magnet.</li>
                        <li>IV Rank is {ivRank}/100. {ivRank < 40 ? 'Buying options favored.' : 'Selling options favored.'}</li>
                    </ul>
                </div>

                {/* TOP CONTRACTS (NEW) */}
                <div className="pt-4 border-t border-white/5">
                    <div className="text-[10px] uppercase text-white/30 font-bold mb-3 tracking-wider">Highest Activity</div>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Calls */}
                        <div className="bg-green-500/[0.02] rounded-lg p-3 border border-green-500/10">
                            <div className="text-[9px] uppercase text-green-400 font-bold mb-2 flex justify-between tracking-wider">
                                <span>Top Calls</span>
                                <span>OI</span>
                            </div>
                            <div className="space-y-2">
                                {topCE.map((c, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs group">
                                        <span className="text-white/90 font-mono font-medium group-hover:text-green-300 transition-colors">{c.strike}</span>
                                        <span className="text-white/50 text-[10px]">{(c.oi / 1000).toFixed(0)}k</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Puts */}
                        <div className="bg-red-500/[0.02] rounded-lg p-3 border border-red-500/10">
                            <div className="text-[9px] uppercase text-red-400 font-bold mb-2 flex justify-between tracking-wider">
                                <span>Top Puts</span>
                                <span>OI</span>
                            </div>
                            <div className="space-y-2">
                                {topPE.map((p, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs group">
                                        <span className="text-white/90 font-mono font-medium group-hover:text-red-300 transition-colors">{p.strike}</span>
                                        <span className="text-white/50 text-[10px]">{(p.oi / 1000).toFixed(0)}k</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
