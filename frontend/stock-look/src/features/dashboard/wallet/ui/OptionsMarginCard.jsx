import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function OptionsMarginCard({ optionsStats, scenarios }) {
    if (!scenarios) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 1. OPTIONS EXPOSURE */}
            <div className="bg-background-card-primary border border-border-subtle-faint rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                <div className="flex justify-between items-start mb-6">
                    <div className="text-xs font-bold text-white/40 uppercase tracking-widest">Options Exposure Map</div>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border 
                        ${optionsStats.directionalBias.includes('Long') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            optionsStats.directionalBias.includes('Short') ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
                        {optionsStats.directionalBias}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <MetricBox
                        label="Net Delta"
                        value={optionsStats.netDelta}
                        subtext="Beta Weighted"
                        accent={optionsStats.netDelta > 0 ? "text-emerald-400" : "text-red-400"}
                    />
                    <MetricBox
                        label="Net Vega"
                        value={optionsStats.netVega}
                        subtext="Risk / 1% Vol"
                        accent={optionsStats.netVega < 0 ? "text-emerald-400" : "text-red-400"}
                    />
                    <MetricBox
                        label="Gamma Risk"
                        value={optionsStats.gammaRisk}
                        subtext="Accel. Exposure"
                        accent="text-white"
                    />
                    <MetricBox
                        label="Theta Burn"
                        value={`₹${Math.abs(optionsStats.thetaBurn)}`}
                        subtext="Daily Decay"
                        accent="text-emerald-400"
                    />
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-white/40 flex items-center gap-2">
                    <span className="text-amber-400">⚠</span>
                    <span>Volatility expansion increases margin requirements by ~15%</span>
                </div>
            </div>

            {/* 2. MARGIN STRESS SIMULATION */}
            <div className="bg-background-card-primary border border-border-subtle-faint rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.45)] flex flex-col">
                <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6">Margin Stress Simulation</div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] text-white/30 uppercase border-b border-white/5">
                                <th className="pb-3 font-medium pl-2">Scenario</th>
                                <th className="pb-3 font-medium">Margin Req</th>
                                <th className="pb-3 font-medium text-right pr-2">Capital Impact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scenarios.map((row, idx) => (
                                <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                    <td className="py-3 pl-2">
                                        <div className="text-xs font-bold text-white/80">{row.label}</div>
                                    </td>
                                    <td className="py-3">
                                        <div className="text-xs font-mono text-white/60">₹{row.marginReq.toLocaleString()}</div>
                                    </td>
                                    <td className="py-3 text-right pr-2">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-xs font-mono font-bold text-white">{row.pctCapital}%</span>
                                            <span className={`w-1.5 h-1.5 rounded-full 
                                                ${row.status === 'Safe' ? 'bg-emerald-500' :
                                                    row.status === 'Caution' ? 'bg-amber-500' : 'bg-red-500'}`}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 text-[10px] text-right text-white/30">
                    modeled on span margin parameters
                </div>
            </div>

        </div>
    );
}

function MetricBox({ label, value, subtext, accent }) {
    return (
        <div className="bg-white/[0.02] border border-white/5 p-3 rounded-lg flex flex-col">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1">{label}</span>
            <span className={`text-xl font-mono font-bold ${accent}`}>{value}</span>
            <span className="text-[9px] text-white/20 mt-0.5">{subtext}</span>
        </div>
    );
}
