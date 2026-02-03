/**
 * @file TransmissionEngine.jsx
 * @purpose Visualizes how Global factors transmit to Local (Indian) market segments.
 * @responsibilities
 * - Renders a list of "Transmission Paths" (e.g., Crude -> OMCs).
 * - Shows transmission thresholds and bias direction.
 * - Highlights the primary impact segments.
 * @key_exports
 * - TransmissionEngine (Default Component)
 * @dependencies
 * - Lucide React (Icons)
 * @lifecycle
 * - Rendered in Dashboard/Foreign.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import { ArrowRight, Activity, Zap } from "lucide-react";

// =============================
// Main Component
// =============================
export default function TransmissionEngine({ transmission }) {
    if (!transmission) return null;

    return (
        <div className="bg-background-card-secondary border border-border-subtle-faint rounded-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.45)] h-full flex flex-col">

            {/* Header */}
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-3 flex justify-between items-center">
                <span>Global → India Transmission</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase">
                    Impact Map
                </span>
            </div>

            {/* Content List */}
            <div className="flex-1 grid grid-cols-1 gap-4">
                {transmission.map((path, i) => (
                    <TransmissionCard key={i} data={path} />
                ))}
            </div>
        </div>
    );
}

// =============================
// Helper Component
// =============================
function TransmissionCard({ data }) {
    const isBearish = data.bias.includes('Bearish') || data.bias.includes('Start') || data.bias.includes('Risk');
    const color = isBearish ? 'text-red-400' : 'text-emerald-400';
    const border = isBearish ? 'border-red-500/20' : 'border-emerald-500/20';
    const bg = isBearish ? 'bg-red-500/[0.02]' : 'bg-emerald-500/[0.02]';

    return (
        <div className={`relative p-4 rounded-lg border ${border} ${bg} group hover:bg-white/[0.02] transition-colors`}>

            {/* Top Row: Driver & Threshold */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <Activity size={12} className="text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{data.driver}</span>
                </div>
                <div className="text-[9px] font-mono font-bold text-slate-300 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                    {data.threshold}
                </div>
            </div>

            {/* Middle: Bias */}
            <div className={`text-sm font-bold tracking-tight mb-3 ${color} flex items-center gap-2`}>
                <Zap size={14} className={color} />
                {data.bias}
            </div>

            {/* Bottom: Segment Impact */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Primary Impact</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <span>{data.segment}</span>
                    <ArrowRight size={10} className="text-slate-500 -rotate-45" />
                </div>
            </div>
        </div>
    );
}
