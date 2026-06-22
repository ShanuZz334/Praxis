/**
 * @file OptionsHeader.jsx
 * @purpose Main Dashboard Header for the Options Module.
 * @responsibilities
 * - Unified visualization of the composite "Positioning Score".
 * - Displays the current Options Market Regime (Gamma/IV environment).
 * - Highlights Data Integrity and Next Expiry details.
 * - Extracts and visualizes top "Tailwinds" (Bullish Factors) and "Risks" (Bearish Factors).
 * @key_exports
 * - OptionsHeader (Default Component)
 * @dependencies
 * - OptionsGauge: Visualization component.
 * - optionsHelper: Logic for regime and insight extraction.
 * - PortalTooltip: For context menus.
 * @lifecycle
 * - Rendered by OptionsPage.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PortalTooltip from "@/shared/components/ui/PortalTooltip";
import OptionsGauge from "./OptionsGauge";
import { getOptionsRegime, extractOptionsTailwinds, extractOptionsRisks } from "@/features/dashboard/options/engine/optionsHelper";
import AiInsightSection from "@/shared/components/ui/AiInsightSection";

// =============================
// Main Component
// =============================
export default function OptionsHeader({
    scoreData, // { score, details }
    cards = [],
    metrics = {}, // { pcr, maxPain, netDelta }
}) {
    const navigate = useNavigate();
    const score = scoreData?.score || 50;

    // Derived Logic
    const regimeData = useMemo(() => getOptionsRegime(score, metrics), [score, metrics]);
    const tailwinds = useMemo(() => extractOptionsTailwinds(cards), [cards]);
    const risks = useMemo(() => extractOptionsRisks(cards), [cards]);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl bg-background-card-primary border border-border-subtle-translucent overflow-hidden shadow-2xl">

                {/* ================= SECTION 1: METRICS ROW ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10 border-b border-white/10 bg-white/[0.02]">

                    {/* COL 1: Gauge & Score */}
                    <div className="p-6 flex flex-col items-center justify-center relative">
                        <div className="absolute top-4 left-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                                Options Positioning
                                <PortalTooltip
                                    content={
                                        <div className="w-80">
                                            <div className="flex items-center gap-2 mb-2 border-b border-border-default pb-2">
                                                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Options Module</span>
                                            </div>
                                            <p className="text-xs text-text-secondary leading-relaxed">
                                                The Options module analyzes dealer gamma exposure (GEX), open interest flow, and volatility skews to identifying turning points.
                                            </p>
                                            <div className="mt-3 pt-2 border-t border-border-default flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                                                <span>Click to read full manual</span>
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </div>
                                        </div>
                                    }
                                >
                                    <button
                                        onClick={() => navigate('/dashboard/manual/options')}
                                        className="group/btn flex items-center justify-center w-5 h-5 rounded-full bg-white/5 hover:bg-blue-500/20 text-white/20 hover:text-blue-400 transition-all cursor-pointer"
                                    >
                                        <span className="text-xs font-serif italic font-bold">i</span>
                                    </button>
                                </PortalTooltip>
                            </div>
                            <div className="text-[10px] text-white/40">Dealer & Flow-Based Bias</div>
                        </div>
                        <div className="mt-6 w-full">
                            <OptionsGauge scoreData={scoreData} />
                        </div>
                    </div>

                    {/* COL 2: AI INSIGHT */}
                    <div className="p-0 flex flex-col justify-center overflow-hidden">
                        <AiInsightSection 
                            actionType={regimeData.label}
                        />
                    </div>

                    {/* COL 3: Data Integrity */}
                    <div className="p-6 flex flex-col justify-center gap-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Data Integrity</div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm text-white/80">Options Chain Live</span>
                            </div>
                            <div className="text-xs font-mono text-white/50">
                                Next Expiry
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-white/60">
                                <span>Strike Coverage</span>
                                <span>100%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 w-full rounded-full" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                            <span className="text-purple-400">● 1m Snapshot</span>
                            <span>Calculated Greeks</span>
                        </div>
                    </div>
                </div>

                {/* ================= SECTION 2: INSIGHTS ROW ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/5 border-t border-white/5 mx-6 mb-6 rounded-xl overflow-hidden">
                    {/* Tailwinds Panel */}
                    <div className="p-5 bg-emerald-900/[0.05] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                </div>
                                <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Top Tailwinds</div>
                            </div>
                        </div>
                        <div className="space-y-3 relative z-10">
                            {tailwinds.length > 0 ? tailwinds.map(tw => (
                                <div key={tw.id} className="flex items-center justify-between text-xs group">
                                    <span className="text-white/80 font-medium group-hover:text-emerald-300 transition-colors">{tw.label}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 h-1.5 bg-emerald-900/30 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${tw.score * 100}%` }} />
                                        </div>
                                        <span className="text-emerald-400 font-mono font-bold w-6 text-right">{Number(tw.score * 100 || 0).toFixed(0)}</span>
                                    </div>
                                </div>
                            )) : <div className="text-white/30 text-xs italic">No major tailwinds</div>}
                        </div>
                    </div>

                    {/* Risks Panel */}
                    <div className="p-5 bg-red-900/[0.05] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-red-500/10 border border-red-500/20">
                                    <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                                </div>
                                <div className="text-red-400 text-xs font-bold uppercase tracking-widest">Key Risks</div>
                            </div>
                        </div>
                        <div className="space-y-3 relative z-10">
                            {risks.length > 0 ? risks.map(risk => (
                                <div key={risk.id} className="flex items-center justify-between text-xs group">
                                    <span className="text-white/80 font-medium group-hover:text-red-300 transition-colors">{risk.label}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 h-1.5 bg-red-900/30 rounded-full overflow-hidden">
                                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${(1 - risk.score) * 100}%` }} />
                                        </div>
                                        <span className="text-red-400 font-mono font-bold w-6 text-right">{Number(risk.score * 100 || 0).toFixed(0)}</span>
                                    </div>
                                </div>
                            )) : <div className="text-white/30 text-xs italic">No major risks</div>}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
