import React from "react";
import ForeignGauge from "./ForeignGauge";

export default function GlobalRiskHeader({ riskData }) {
    if (!riskData) return null;
    const { index, state, regime, tactical, conditions, helper, lastUpdated } = riskData;

    return (
        <div className="w-full bg-background-card-secondary border border-border-subtle-faint rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.45)] flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5">

            {/* 1. RISK GAUGE (Visual Anchor) */}
            <div className="p-6 w-full lg:w-[320px] flex flex-col justify-center items-center bg-black/20 shrink-0">
                <ForeignGauge score={index} state={state} />
                <div className="mt-3 text-[10px] text-slate-400 font-medium italic text-center">
                    "{helper}"
                </div>
            </div>

            {/* 2. REGIME INTELLIGENCE (Strategist Brief) */}
            <div className="flex-1 p-6 flex flex-col justify-center gap-5">

                {/* Header & Conditions */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Macro Regime</div>
                        <div className="text-2xl font-bold text-slate-100 tracking-tight leading-none">
                            {regime}
                        </div>
                    </div>

                    {/* Condition Grouping */}
                    <div className="flex items-center gap-6 bg-white/[0.02] px-4 py-2 rounded-lg border border-white/5">
                        <ConditionItem label="Rates" value={conditions?.rates} color="text-red-400" />
                        <div className="w-px h-6 bg-white/10" />
                        <ConditionItem label="Volatility" value={conditions?.volatility} color={conditions?.volatility === 'Stressed' ? "text-amber-400" : "text-emerald-400"} />
                        <div className="w-px h-6 bg-white/10" />
                        <ConditionItem label="Liquidity" value={conditions?.liquidity} color="text-slate-300" />
                    </div>
                </div>

                <div className="h-px w-full bg-white/5" />

                {/* Tactical Meaning */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-blue-400">Tactical Playbook</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-blue-500/20 to-transparent"></div>
                    </div>
                    <div className="text-sm text-slate-200 font-medium font-sans">
                        {tactical}
                    </div>
                </div>
            </div>

            {/* 3. STATUS & TIMING */}
            <div className="p-6 flex flex-col justify-center items-end min-w-[150px] bg-white/[0.01]">
                <div className="flex items-center gap-2 mb-1 opacity-90">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live System</span>
                </div>
                <div className="text-[10px] text-slate-600 font-mono text-right">
                    Updated: {lastUpdated || "Now"}
                </div>
            </div>

        </div>
    );
}

function ConditionItem({ label, value, color }) {
    return (
        <div className="flex flex-col items-start min-w-[60px]">
            <span className="text-[9px] font-bold text-slate-500 uppercase mb-1">{label}</span>
            <div className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 ${color}`}>
                {value}
            </div>
        </div>
    );
}
