import React from "react";
import { ShieldAlert, Zap, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

export default function QuantSystemPanel({ system }) {
    if (!system) return null;
    const { primaryBias, invalidation, positioning, timeHorizon, confidence, crossFactor, scenarios } = system;

    return (
        <div className="w-full h-full bg-[#101a33] border border-white/5 rounded-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.45)] flex flex-col justify-between">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Logic Engine</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                    <Zap size={10} className="text-purple-400" />
                    <span className="text-[9px] text-purple-400 uppercase font-bold">Auto-Strategist</span>
                </div>
            </div>

            <div className="space-y-6 flex-1">

                {/* 1. PRIMARY BIAS & HORIZON */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Primary Model Bias</div>
                        <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                            <Clock size={10} />
                            {timeHorizon}
                        </div>
                    </div>
                    <div className="text-2xl font-bold font-mono tracking-tight text-white mb-2 leading-none">
                        {primaryBias}
                    </div>

                    {/* Invalidation */}
                    <div className="flex items-center gap-2 p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                        <ShieldAlert size={12} className="text-red-400" />
                        <span className="text-xs font-mono font-medium text-red-300">Inv: {invalidation}</span>
                    </div>
                </div>

                {/* 2. CROSS FACTOR AGREEMENT */}
                <div>
                    <div className="text-[9px] uppercase font-bold text-slate-600 mb-1">Macro Factor Alignment</div>
                    <div className="text-xs font-medium text-slate-300 mb-2">{crossFactor}</div>
                    <ConfidenceBar value={confidence} />
                </div>

                {/* 3. POSITIONING */}
                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                    <div className="text-[9px] uppercase font-bold text-blue-400 mb-1">Recommended Sizing</div>
                    <div className="text-sm font-bold text-slate-200">{positioning}</div>
                </div>

                {/* 4. SCENARIO CHECKLIST */}
                <div>
                    <div className="text-[9px] uppercase font-bold text-slate-500 mb-2">Bias Change Scenarios</div>
                    <div className="space-y-2">
                        {scenarios && scenarios.map((scen, i) => (
                            <div key={i} className="flex gap-3 items-start text-xs p-1.5 hover:bg-white/5 rounded transition-colors group">
                                <span className="text-[9px] font-mono text-slate-500 mt-0.5 group-hover:text-slate-400">{i + 1}.</span>
                                <div>
                                    <span className="text-slate-400 font-mono">{scen.cond}</span>
                                    <div className="text-emerald-400 font-bold text-[10px] mt-0.5">→ {scen.effect}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
}

function ConfidenceBar({ value }) {
    return (
        <div className="w-full mt-1">
            <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase mb-1">
                <span>Model Confidence</span>
                <span>{value}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-1">
                <div
                    className="h-full bg-slate-200 rounded-full transition-all duration-500"
                    style={{ width: `${value}%` }}
                />
            </div>
            <div className="text-[9px] text-slate-600 font-medium">
                Based on factor alignment & historical reliability.
            </div>
        </div>
    );
}
