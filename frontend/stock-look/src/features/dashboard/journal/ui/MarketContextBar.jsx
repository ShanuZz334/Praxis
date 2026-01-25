import React from "react";

export default function MarketContextBar({ context }) {
    if (!context) return null;

    return (
        <div className="w-full flex items-center justify-between py-2.5 text-xs select-none animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">

            {/* DATE */}
            <div className="flex items-center gap-2">
                <div className="h-1 w-1 bg-slate-500 rounded-full" />
                <div className="font-mono text-slate-500 uppercase tracking-widest text-[10px] font-bold">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
                </div>
            </div>

            {/* CONTEXT DATA */}
            <div className="hidden md:flex items-center gap-4">
                <ContextItem label="Market Regime" value={context.regime} color="text-slate-300" />
                <ContextItem label="Options Flow" value={context.optionsRegime} color="text-blue-400" />
                <ContextItem label="Global Risk" value={context.globalRisk} color="text-emerald-400" />
                <ContextItem label="Vol Bias" value={context.volBias} color="text-amber-400" />
            </div>

        </div>
    );
}

function ContextItem({ label, value, color }) {
    return (
        <div className="flex items-center gap-2 bg-[#0b1220] border border-white/5 pl-2 pr-1 py-1 rounded-lg shadow-sm">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wide">{label}</span>
            <div className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/5 ${color}`}>
                {value}
            </div>
        </div>
    );
}
