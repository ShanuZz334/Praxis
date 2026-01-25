import React from "react";

export default function GlobalImpactStrip({ impact }) {
    if (!impact) return null;

    // Severity Logic
    const isBearish = impact.bias.includes('Bear') || impact.bias.includes('Negative');
    const isBullish = impact.bias.includes('Bull') || impact.bias.includes('Positive');

    // Determining Style - Premium Glass Gradients
    const style = isBearish
        ? "bg-gradient-to-r from-red-950/60 via-red-900/40 to-slate-900/80 border-red-500/30 shadow-[0_4px_30px_rgba(220,38,38,0.1)]"
        : isBullish
            ? "bg-gradient-to-r from-emerald-950/60 via-emerald-900/40 to-slate-900/80 border-emerald-500/30 shadow-[0_4px_30px_rgba(16,185,129,0.1)]"
            : "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-white/10";

    const textStyle = isBearish ? "text-red-100" : isBullish ? "text-emerald-100" : "text-slate-100";

    return (
        <div className={`w-full border-b backdrop-blur-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-0 animate-in slide-in-from-top duration-700 ${style}`}>

            {/* LEFT: THE VERDICT */}
            <div className="flex-1">
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 opacity-70 ${textStyle}`}>Net Impact on NIFTY Today</div>
                <div className="flex items-center gap-6">
                    <span className={`text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none drop-shadow-lg ${textStyle}`}>
                        {impact.bias}
                    </span>
                    <div className="h-12 w-px bg-white/10 hidden md:block" />
                    <span className="text-xl font-mono font-bold text-white/90 hidden md:block">
                        {impact.primary}
                    </span>
                </div>
            </div>

            {/* RIGHT: DRIVERS & CONFIDENCE */}
            <div className="flex gap-10 items-center border-l border-white/10 pl-10">
                <div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Key Drivers</div>
                    <div className="text-base font-bold text-white flex gap-2 items-center">
                        <span className="border-b border-white/20 pb-0.5">{impact.primary}</span>
                        <span className="text-white/40">+</span>
                        <span className="opacity-70">{impact.secondary}</span>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Signal Confidence</div>
                    <div className="text-2xl font-bold font-mono text-white tracking-tight">{impact.confidence}</div>
                </div>
            </div>

        </div>
    );
}
