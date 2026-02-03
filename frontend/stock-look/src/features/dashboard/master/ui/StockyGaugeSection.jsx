/**
 * @file StockyGaugeSection.jsx
 * @purpose Renders the primary visual gauge for the Stocky Master Score.
 * @responsibilities
 * - Visualizes the aggregate score using an SVG circular gauge.
 * - Displays the current market regime with descriptive text.
 * - Shows a risk monitor panel with system constraints.
 * @key_exports
 * - StockyGaugeSection (Default Component)
 * @dependencies
 * - React, lucide-react
 * - getRegimeColor (stockyEngine)
 * @lifecycle
 * - Rendered by MasterDashboard (Legacy/Alternative View - possibly deprecated by GlobalHeader but kept for safety).
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import { Activity, ShieldAlert } from "lucide-react";
import { getRegimeColor } from "../engine/stockyEngine";

// =============================
// Helper Components
// =============================

function RiskRow({ label, value, color = "text-slate-200" }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-red-400/50 uppercase">{label}</span>
            <span className={`text-xs font-bold font-mono ${color}`}>{value}</span>
        </div>
    );
}

function ContextStat({ label, value, color }) {
    return (
        <div>
            <div className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">{label}</div>
            <div className={`text-sm font-bold font-mono ${color}`}>{value}</div>
        </div>
    );
}

// =============================
// Main Component
// =============================

export default function StockyGaugeSection({ score, regime, risk, readiness }) {
    const regimeColor = getRegimeColor(regime);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* 1. MASTER GAUGE (Hero) - REVOLVING BORDER */}
            <div className="lg:col-span-1 relative group">
                {/* Animated Revolving Border */}
                <div className="absolute -inset-0.5 bg-[conic-gradient(from_0deg_at_50%_50%,#10b981_0%,#ef4444_50%,#10b981_100%)] rounded-2xl opacity-75 blur-sm animate-[spin_4s_linear_infinite]" />

                {/* Main Card Content */}
                <div className="relative h-full bg-[#0b1220] border border-white/5 rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.45)] flex flex-col items-center justify-center overflow-hidden">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity size={14} className="text-slate-500" />
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Stocky Score</div>
                    </div>

                    <div className="relative w-40 h-40 flex items-center justify-center mb-2">
                        <svg className="w-full h-full transform -rotate-90">
                            {/* Background Circle */}
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800/50" />
                            {/* Value Circle */}
                            <circle
                                cx="80" cy="80" r="70"
                                stroke="currentColor" strokeWidth="8" fill="transparent"
                                className={`${score >= 75 ? 'text-emerald-500' :
                                    score >= 60 ? 'text-lime-500' :
                                        score >= 40 ? 'text-yellow-500' :
                                            score >= 25 ? 'text-amber-500' :
                                                'text-red-500'} transition-all duration-1000 shadow-[0_0_20px_currentColor]`}
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * score) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-5xl font-bold text-white tracking-tighter leading-none">{score}</span>
                            <div className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${score >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                score >= 60 ? 'bg-lime-500/10 text-lime-400 border-lime-500/20' :
                                    score >= 40 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                        score >= 25 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                {readiness.bias} Bias
                            </div>
                        </div>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono">
                        Model Confidence: <span className="text-slate-300">{readiness.confidence}%</span>
                    </div>
                </div>
            </div>

            {/* 2. REGIME & CONTEXT (Strategist Brief) */}
            <div className="lg:col-span-2 bg-[#0b1220] border border-white/5 rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.45)] flex flex-col justify-center relative">
                <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Market Regime Identifier</div>
                    <div className="text-[10px] bg-white/[0.02] px-2 py-0.5 rounded text-slate-400 font-bold border border-white/[0.05] uppercase">
                        Phase: {score > 50 ? 'Expansion' : 'Contraction'}
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <h2 className={`text-4xl font-bold mb-2 tracking-tight ${regimeColor}`}>{regime}</h2>
                    <p className="text-sm text-slate-400 font-medium max-w-lg mb-6">
                        {regime === "Risk-On Trend" ? "Broad participation with low volatility. Deploy capital aggressively." :
                            regime === "Volatile Breakout" ? "Fast moves with expanding ranges. Focus on momentum and tight stops." :
                                regime === "Selective Bullish" ? "Market is rising but breadth is thinning. Focus on high-quality setups." :
                                    regime === "Emotional Rally" ? "FOMO-driven moves with high volatility. Be wary of sharp reversals." :
                                        regime === "Neutral / Range" ? "Mean reversion dominant. Sell resistance and buy support." :
                                            regime === "Choppy / Uncertain" ? "Unpredictable price action with whipsaws. Stay on the sidelines." :
                                                regime === "Defensive / Hedge" ? "Risk-off environment. Protect capital and consider hedging." :
                                                    regime === "Liquidation Risk" ? "Heavy selling with high volatility. Exit weak positions immediately." :
                                                        regime === "Capital Protection" ? "Extreme risk. Sit in cash and wait for stability." :
                                                            "Current structure implies mixed signals. Reduce position sizing."}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-6 border-t border-white/5 pt-4">
                    <ContextStat label="Tech Trend" value="Bullish" color="text-emerald-400" />
                    <ContextStat label="Event Risk" value="Elevated" color="text-amber-400" />
                    <ContextStat label="Global Sync" value="Supportive" color="text-emerald-400" />
                </div>
            </div>

            {/* 3. RISK MONITOR (Constraint Box) */}
            <div className="lg:col-span-1 bg-[#1a0b0b] border border-red-500/10 rounded-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.45)] flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4 z-10">
                    <ShieldAlert size={14} className="text-red-400" />
                    <div className="text-xs font-bold text-red-400 uppercase tracking-widest">Risk Constraints</div>
                </div>

                <div className="space-y-4 z-10">
                    <RiskRow label="Volatility" value={risk.volatility} />
                    <RiskRow label="Event Risk" value={risk.eventRisk} color="text-amber-400" />
                    <RiskRow label="Liquidity" value={risk.liquidity} />
                </div>

                <div className="mt-4 pt-3 border-t border-red-500/10 z-10">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-red-400/60 uppercase font-bold">System Status</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            <span className="text-[10px] font-bold text-red-300 uppercase">
                                {risk.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Subtle BG Pattern */}
                <div className="absolute -right-4 -bottom-4 text-red-900/10 transform rotate-12">
                    <ShieldAlert size={120} />
                </div>
            </div>

        </div>
    );
}
