import React from "react";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";

export default function GlobalImpactBanner({ data }) {
    if (!data) return null;

    const { bias, actionHint, drivers, confidence } = data;

    // Determine styles
    const isBullish = bias.includes("Bullish");
    const isBearish = bias.includes("Bearish");

    const gradient = isBearish
        ? "bg-gradient-to-r from-red-950/50 via-red-900/20 to-slate-950 border-red-500/20"
        : isBullish
            ? "bg-gradient-to-r from-emerald-950/50 via-emerald-900/20 to-slate-950 border-emerald-500/20"
            : "bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-slate-950 border-slate-800";

    const accentColor = isBearish ? "text-red-400" : isBullish ? "text-emerald-400" : "text-slate-400";
    const Icon = isBearish ? TrendingDown : isBullish ? TrendingUp : Minus;

    return (
        <div className={`w-full px-8 py-6 backdrop-blur-md shadow-lg select-none border-b ${gradient}`}>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                {/* 1. PRIMARY DECISION BLOCK */}
                <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-xl bg-black/20 ring-1 ring-inset ring-white/10 ${accentColor}`}>
                        <Icon size={36} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Global Bias Verdict</div>
                        <div className={`text-4xl md:text-5xl font-bold tracking-tighter leading-none mb-2 ${accentColor}`}>
                            {bias.toUpperCase()}
                        </div>
                        {/* Action Hint */}
                        <div className="flex items-center gap-2 text-sm text-slate-300 font-medium bg-black/20 px-3 py-1 rounded-lg border border-white/5 inline-flex">
                            <ArrowRight size={14} className="opacity-70" />
                            <span>{actionHint}</span>
                        </div>
                    </div>
                </div>

                {/* 2. CONTEXT (Drivers & Confidence) */}
                <div className="flex items-center gap-8 border-l border-white/10 pl-8">

                    {/* Drivers (Simplified) */}
                    <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Key Drivers</div>
                        <div className="flex flex-col gap-1">
                            {drivers && drivers.map((driver, i) => (
                                <span key={i} className="text-xs font-mono font-medium text-slate-400">
                                    • {driver}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Confidence */}
                    <div className="text-right min-w-[80px]">
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Confidence</div>
                        <div className="text-3xl font-mono font-bold text-slate-200 tracking-tighter">{confidence}%</div>
                    </div>

                </div>

            </div>
        </div>
    );
}
