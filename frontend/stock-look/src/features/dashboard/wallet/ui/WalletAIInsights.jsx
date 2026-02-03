/**
 * @file WalletAIInsights.jsx
 * @purpose Renders AI-driven insights and strategic directives for the portfolio.
 * @responsibilities
 * - Generates natural language analysis of portfolio health.
 * - Displays actionable recommendations (e.g., "Reduce Options Size").
 * @key_exports
 * - WalletAIInsights (Default)
 * @dependencies
 * - riskEngine
 * @lifecycle
 * - Rendered by WalletPage (Optional/Expanded view).
 * @date 2026-02-03
 */

import React from "react";
import { generateWalletInsights } from "../engine/riskEngine";

export default function WalletAIInsights({ walletData }) {
    const insights = generateWalletInsights(walletData);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 1. ANALYST VIEW */}
            <div className="lg:col-span-2 bg-background-card/85 backdrop-blur-xl border border-border-default rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="opacity-5 absolute top-0 right-0 p-4 text-9xl transition-transform group-hover:scale-110 duration-1000">🧠</div>

                <div className="relative z-10">
                    <div className="text-[10px] font-black text-accent-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
                        Portfolio Intelligence
                    </div>

                    <div className="space-y-6">
                        {insights.map((insight, i) => (
                            <div key={i} className="flex gap-5 items-start p-4 bg-background-elevated/40 border border-border-subtle rounded-2xl transition-all hover:bg-background-elevated/60 shadow-sm">
                                <div className={`mt-1 h-10 w-1.5 rounded-full ${insight.type === 'danger' ? 'bg-state-bearish-text' : 'bg-state-bullish-text'}`}></div>
                                <div>
                                    <h4 className="text-base font-black text-text-primary mb-1.5 tracking-tight">{insight.title}</h4>
                                    <p className="text-sm text-text-secondary leading-relaxed font-medium max-w-xl">
                                        {insight.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. ACTIONABLE RECS */}
            <div className="bg-background-card/85 backdrop-blur-xl border border-border-default rounded-2xl p-6 shadow-2xl flex flex-col justify-between group">
                <div>
                    <div className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mb-6 opacity-60">Strategic Directives</div>

                    <div className="space-y-4">
                        <ActionCard title="Reduce Options Size" reason="Approaching Vega limit" confidence="High" />
                        <ActionCard title="Increase Cash Buffer" reason="Volatility regime shift" confidence="Medium" />
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border-subtle text-[9px] text-text-tertiary font-black italic text-center opacity-30 uppercase tracking-widest">
                    Last Computed: Just Now
                </div>
            </div>

        </div>
    );
}

function ActionCard({ title, reason, confidence }) {
    const confColor = confidence === 'High' ? 'text-state-bullish-text' : 'text-amber-600';
    return (
        <div className="p-4 bg-background-elevated/40 border border-border-subtle rounded-2xl hover:bg-background-subtle hover:border-border-default hover:-translate-y-1 transition-all cursor-pointer group shadow-sm">
            <div className="flex justify-between items-start mb-1.5">
                <div className="text-sm font-black text-text-primary group-hover:text-accent-primary transition-colors tracking-tight">{title}</div>
                <div className={`text-[9px] uppercase font-black tracking-widest ${confColor}`}>{confidence}</div>
            </div>
            <div className="text-xs text-text-tertiary font-medium">{reason}</div>
        </div>
    );
}
