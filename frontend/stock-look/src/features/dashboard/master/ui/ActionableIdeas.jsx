/**
 * @file ActionableIdeas.jsx
 * @purpose Displays curated, high-conviction trading ideas.
 * @responsibilities
 * - Lists top trade ideas with direction, instrument, and rationale.
 * - Highlights the conviction level (e.g., High Conviction).
 * @key_exports
 * - ActionableIdeas (Default Component)
 * @dependencies
 * - React, lucide-react
 * @lifecycle
 * - Rendered by MasterDashboard (Grid Section).
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import { ArrowRight, Target } from "lucide-react";

// =============================
// Helper Component
// =============================

function IdeaRow({ idea }) {
    const isLong = idea.direction === 'Long';
    const dirColor = isLong ? 'text-emerald-400' : 'text-red-400';
    const dirBg = isLong ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20';

    return (
        <div className="group p-3 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors cursor-pointer active:scale-[0.98]">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${dirBg} ${dirColor}`}>
                        {idea.direction}
                    </span>
                    <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                        {idea.instrument}
                    </span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 uppercase border border-white/5 px-1 py-0.5 rounded">
                    {idea.type}
                </div>
            </div>

            <div className="flex items-start gap-2">
                <ArrowRight size={12} className="text-slate-600 mt-0.5 shrink-0 group-hover:text-emerald-400 transition-colors" />
                <span className="text-xs text-slate-400 italic leading-snug">
                    "{idea.note}"
                </span>
            </div>
        </div>
    );
}

// =============================
// Main Component
// =============================

export default function ActionableIdeas({ ideas }) {
    if (!ideas) return null;

    return (
        <div className="bg-[#0b1220] border border-white/5 rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.45)] h-full animate-in fade-in zoom-in duration-500">

            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                    <Target size={14} className="text-emerald-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Top Focus Ideas</span>
                </div>
                <div className="text-[9px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shadow-sm">
                    High Conviction Only
                </div>
            </div>

            <div className="space-y-3">
                {ideas.slice(0, 3).map((idea, i) => (
                    <IdeaRow key={i} idea={idea} />
                ))}
            </div>
        </div>
    );
}
