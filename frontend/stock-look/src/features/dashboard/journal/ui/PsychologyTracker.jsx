import React from "react";
import { Brain } from "lucide-react";

export default function PsychologyTracker({ psychology }) {
    if (!psychology) return null;

    const heatmap = psychology.heatmap;
    const total = Object.values(heatmap).reduce((a, b) => a + b, 0);

    return (
        <div className="relative bg-[#0b1220] border border-white/5 rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.45)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/3 to-transparent" />
            <div className="relative z-10">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2 flex justify-between items-center">
                    <span>Emotional Risk Monitor</span>
                    <span className="text-[10px] text-emerald-400 font-bold">{psychology.ruleAdherence}% Adherence</span>
                </div>

                <div className="space-y-4">
                    <EmotionBar label="Calm / Focused" value={heatmap.Calm} total={total} color="bg-emerald-500" />
                    <EmotionBar label="Rushed / FOMO" value={heatmap.Rushed} total={total} color="bg-amber-500" />
                    <EmotionBar label="Hesitant" value={heatmap.Hesitant} total={total} color="bg-blue-500" />
                    <EmotionBar label="Frustrated / Revenge" value={heatmap.Frustrated} total={total} color="bg-red-500" />
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 text-center">
                    <div className="text-[10px] text-slate-500 italic">"Good process requires a calm state."</div>
                </div>
            </div>
        </div>
    );
}

function EmotionBar({ label, value, total, color }) {
    const pct = Math.round((value / total) * 100) || 0;

    return (
        <div>
            <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
                <span className="text-[10px] font-mono font-bold text-slate-200">{value}</span>
            </div>
            <div className="h-1.5 w-full bg-white/2 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full opacity-100 ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
