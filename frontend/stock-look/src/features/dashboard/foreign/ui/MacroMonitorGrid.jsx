/**
 * @file MacroMonitorGrid.jsx
 * @purpose Dashboard grid for high-level Macro factors (Yields, DXY, Commodities).
 * @responsibilities
 * - Displays a grid of `FactorCard` components.
 * - Visualizes key macro-economic drivers affecting the market.
 * - Shows impact statements and confidence intervals for each factor.
 * @key_exports
 * - MacroMonitorGrid (Default Component)
 * @dependencies
 * - Lucide React (Icons)
 * @lifecycle
 * - Rendered on ForeignPage or Risk Dashboard.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import { TrendingUp, Activity, DollarSign, BarChart3, AlertCircle, Layers } from "lucide-react";

// =============================
// Main Component
// =============================
export default function MacroMonitorGrid({ macroData }) {
    if (!macroData) return null;
    const { vol, yields, dollar, commodities } = macroData;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

            {/* 1. US YIELDS */}
            <FactorCard
                data={yields}
                icon={<Activity size={16} />}
                accent="text-blue-400"
            />

            {/* 2. DOLLAR */}
            <FactorCard
                data={dollar}
                icon={<DollarSign size={16} />}
                accent="text-emerald-400"
            />

            {/* 3. VOLATILITY */}
            <FactorCard
                data={vol}
                icon={<BarChart3 size={16} />}
                accent="text-red-400"
            />

            {/* 4. COMMODITIES */}
            <FactorCard
                data={commodities}
                icon={<TrendingUp size={16} />}
                accent="text-amber-400"
            />

        </div>
    );
}

// =============================
// Helper Components
// =============================

function FactorCard({ data, icon, accent }) {
    const { headline, metric, subMetric, state, impact, affected, confidence, explanation } = data;

    return (
        <div className="bg-background-card-secondary border border-border-subtle-faint rounded-xl p-5 shadow-md hover:border-white/10 transition-all duration-300 flex flex-col h-full group relative overflow-hidden hover:shadow-2xl hover:-translate-y-1">

            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                    <div className={`text-slate-500 group-hover:${accent} transition-colors`}>{icon}</div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">{headline}</span>
                </div>
                <Badge label={confidence} />
            </div>

            {/* Body: Metric Block */}
            <div className="flex items-end justify-between mb-4">
                <div>
                    <div className="text-3xl font-bold text-white tracking-tighter leading-none mb-1">{metric}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">{subMetric}</div>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border bg-white/5 border-white/10 ${accent}`}>
                    {state}
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer: Intelligence */}
            <div className="space-y-3 pt-3 border-t border-white/5">

                {/* Impact Statement */}
                <div className="flex items-start gap-2">
                    <AlertCircle size={12} className="text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-200 leading-snug">{impact}</span>
                        {explanation && <span className="text-[9px] text-slate-500 leading-snug block mt-0.5">{explanation}</span>}
                    </div>
                </div>

                {/* Affected Assets */}
                <div className="flex items-center gap-2 bg-white/[0.02] p-1.5 rounded">
                    <Layers size={10} className="text-slate-600" />
                    <span className="text-[9px] font-semibold text-slate-500 uppercase">Affected: <span className="text-slate-400">{affected}</span></span>
                </div>

            </div>
        </div>
    );
}

function Badge({ label }) {
    let color = "bg-white/5 text-slate-500 border-white/10";
    if (label === 'High' || label === 'Strong') color = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (label === 'Moderate') color = "bg-amber-500/10 text-amber-400 border-amber-500/20";

    return (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${color}`}>
            {label} Conf.
        </span>
    );
}
