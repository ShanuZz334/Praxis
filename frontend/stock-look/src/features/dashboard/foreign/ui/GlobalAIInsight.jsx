/**
 * @file GlobalAIInsight.jsx
 * @purpose High-level AI/Analyst summary of global conditions.
 * @responsibilities
 * - Generates natural language insights using `globalRiskEngine`.
 * - Displays critical strategy directives (e.g., "Maintain bullish bias").
 * - Shows quantitative bias output for key indices (Nifty, Bank Nifty).
 * @key_exports
 * - GlobalAIInsight (Default Component)
 * @dependencies
 * - globalRiskEngine: Insight generation logic.
 * @lifecycle
 * - Rendered by GlobalMetricsDesk.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import { generateGlobalInsight } from "../engine/globalRiskEngine";

// =============================
// Main Component
// =============================
export default function GlobalAIInsight({ globalData }) {
    const insight = generateGlobalInsight(globalData);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT: ANALYST VIEW */}
            <div className="lg:col-span-2 bg-background-card/85 backdrop-blur-xl border border-border-default rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl -rotate-12 transition-transform group-hover:rotate-0 duration-1000">🌍</div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-1.5 h-6 bg-accent-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                        <h3 className="text-xl font-black text-text-primary tracking-tight">{insight.title}</h3>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed mb-6 max-w-2xl font-medium">
                        {insight.text}
                    </p>
                    <div className="inline-flex items-center gap-2 bg-background-elevated border border-border-subtle px-4 py-2 rounded-xl shadow-sm">
                        <span className="text-[10px] text-text-tertiary uppercase font-black tracking-widest opacity-60">Strategy Directive</span>
                        <span className="text-xs text-accent-primary font-bold">{insight.action}</span>
                    </div>
                </div>
            </div>

            {/* RIGHT: SYSTEM BIAS OUTPUT */}
            <div className="bg-background-card/85 backdrop-blur-xl border border-border-default rounded-2xl p-6 shadow-2xl flex flex-col justify-center gap-5">
                <div className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mb-1 opacity-60">Quant System Output</div>

                <div className="space-y-3">
                    <BiasRow label="Nifty Bias" value="Bullish" confidence="72%" color="text-state-bullish-text" />
                    <BiasRow label="Bank Nifty Bias" value="Neutral" confidence="55%" color="text-amber-600" />
                    <BiasRow label="Options Regime" value="Short Vol" confidence="68%" color="text-purple-600" />
                </div>

                <div className="mt-2 pt-4 border-t border-border-subtle text-center">
                    <span className="text-[8px] font-black text-text-tertiary uppercase tracking-[0.3em] opacity-30">Stocky Intelligence Engine v4.0</span>
                </div>
            </div>

        </div>
    );
}

// =============================
// Helper Component
// =============================
function BiasRow({ label, value, confidence, color }) {
    return (
        <div className="flex justify-between items-center p-3.5 bg-background-elevated/40 rounded-xl border border-border-subtle hover:border-border-hover transition-colors shadow-sm">
            <span className="text-xs text-text-secondary font-bold">{label}</span>
            <div className="text-right">
                <div className={`text-sm font-black tracking-tight ${color}`}>{value}</div>
                <div className="text-[9px] text-text-tertiary font-bold uppercase opacity-50">Conf: {confidence}</div>
            </div>
        </div>
    );
}
