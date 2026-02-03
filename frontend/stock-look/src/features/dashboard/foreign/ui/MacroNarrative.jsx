/**
 * @file MacroNarrative.jsx
 * @purpose Renders a text-based "Morning Macro Brief" or executive summary.
 * @responsibilities
 * - Displays a high-level, human-readable narrative of the current market state.
 * - Highlights key warnings or recommendations (e.g., "Fade morning gaps").
 * - Visually distinct to feel like a "Voice of God" or Strategist commentary.
 * @key_exports
 * - MacroNarrative (Default Component)
 * @lifecycle
 * - Rendered in Dashboard/Foreign.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";

// =============================
// Main Component
// =============================
export default function MacroNarrative({ impact, regime }) {
    if (!impact) return null;

    return (
        <div className="relative overflow-hidden bg-[#0f172a]/40 backdrop-blur-sm border border-slate-800/60 rounded-3xl flex flex-col shadow-xl">
            <div className="p-8 space-y-8 flex flex-col h-full">

                {/* Header */}
                <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
                    <span className="text-xl">🎙️</span>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Morning Macro Brief</div>
                </div>

                {/* Narrative Body */}
                <div className="flex-1 prose prose-invert max-w-none">
                    <p className="text-sm text-slate-300 leading-8 font-serif tracking-wide pl-2">
                        <span className="text-3xl float-left mr-2 leading-none text-slate-600 font-sans font-black">"</span>
                        Global setup currently dictates a <strong className="text-slate-100 font-semibold">{impact.bias.toLowerCase()}</strong> stance.
                        Primary pressure from <span className="text-blue-300 border-b border-blue-500/30 pb-0.5">{impact.primary}</span> suggests
                        immediate headwinds for rate-sensitive sectors. While {regime?.label} persists,
                        <span className="text-yellow-400 bg-yellow-400/10 px-1 rounded"> leverage should be reduced</span> until VIX stabilizes below 15.
                        Recommendation: Fade morning gaps if US Yields remain elevated above 4.2%.
                    </p>
                </div>
            </div>
        </div>
    );
}
