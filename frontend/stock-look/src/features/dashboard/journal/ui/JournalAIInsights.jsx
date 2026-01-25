import React from "react";
import { Activity, ShieldCheck, Zap, Edit3 } from "lucide-react";

export default function JournalAIInsights({ onToggleNotes }) {
    return (
        <div className="w-full px-6 py-3 bg-[#0b1220] border-b border-white/5 flex items-center justify-between select-none shadow-[0_4px_20px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-top-4 duration-500">

            {/* LEFT: SYSTEM IDENTITY */}
            <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                    <Activity size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Stocky Journal v2.0</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <ShieldCheck size={12} className="text-slate-600" />
                    <span>Execution Monitoring Active</span>
                </div>
            </div>

            {/* RIGHT: LIVE STATUS */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <button
                    onClick={onToggleNotes}
                    className="flex w-full md:w-auto justify-center items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-lg text-blue-400 transition-all group active:scale-95"
                    title="Open Session Journal & Heatmap"
                >
                    <Edit3 size={12} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Journal Log</span>
                </button>

                <div className="hidden md:flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">System Online</span>
                </div>
            </div>
        </div>
    );
}
