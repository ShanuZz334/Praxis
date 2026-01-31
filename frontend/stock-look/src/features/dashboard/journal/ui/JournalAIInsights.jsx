import React from "react";
import { Activity, ShieldCheck, Zap, Edit3 } from "lucide-react";

export default function JournalAIInsights({ onToggleNotes }) {
    return (
        <div className="w-full px-6 py-4 bg-background-card/85 backdrop-blur-xl border-b border-border-default flex items-center justify-between select-none shadow-xl animate-in fade-in slide-in-from-top-4 duration-500 relative z-20">

            {/* LEFT: SYSTEM IDENTITY */}
            <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2.5 text-state-bullish-text bg-background-elevated px-3 py-1.5 rounded-lg border border-border-subtle shadow-sm">
                    <Activity size={16} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono">Stocky Journal v2.0</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text-tertiary font-black uppercase tracking-widest opacity-60">
                    <ShieldCheck size={14} className="text-text-tertiary" />
                    <span>Execution Monitoring Active</span>
                </div>
            </div>

            {/* RIGHT: LIVE STATUS */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <button
                    onClick={onToggleNotes}
                    className="flex w-full md:w-auto justify-center items-center gap-2.5 bg-background-elevated hover:bg-background-subtle border border-border-default px-4 py-2 rounded-xl text-accent-primary transition-all group active:scale-95 shadow-sm"
                    title="Open Session Journal & Heatmap"
                >
                    <Edit3 size={14} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Journal Log</span>
                </button>

                <div className="hidden md:flex items-center gap-2.5 bg-background-card px-4 py-2 rounded-full border border-border-default shadow-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-black text-state-bullish-text uppercase tracking-widest">System Online</span>
                </div>
            </div>
        </div>
    );
}
