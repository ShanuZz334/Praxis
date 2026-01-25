import React from "react";
import { generateWalletInsights } from "../engine/riskEngine";

export default function WalletAIInsights({ walletData }) {
    const insights = generateWalletInsights(walletData);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 1. ANALYST VIEW */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#0b1220] to-[#131b2d] border border-white/10 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="opacity-10 absolute top-0 right-0 p-4 text-9xl">🧠</div>

                <div className="relative z-10">
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Portfolio Intelligence
                    </div>

                    <div className="space-y-6">
                        {insights.map((insight, i) => (
                            <div key={i} className="flex gap-4 items-start">
                                <div className={`mt-1 h-8 w-1 rounded-full ${insight.type === 'danger' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">{insight.title}</h4>
                                    <p className="text-xs text-white/60 leading-relaxed font-medium max-w-xl">
                                        {insight.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. ACTIONABLE RECS */}
            <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Recommended Actions</div>

                <div className="space-y-4">
                    <ActionCard title="Reduce Options Size" reason="Approaching Vega limit" confidence="High" />
                    <ActionCard title="Increase Cash Buffer" reason="Volatility regime shift" confidence="Medium" />
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-white/30 italic text-center">
                    AI Model updated: Just now
                </div>
            </div>

        </div>
    );
}

function ActionCard({ title, reason, confidence }) {
    const confColor = confidence === 'High' ? 'text-green-400' : 'text-yellow-400';
    return (
        <div className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group">
            <div className="flex justify-between items-start mb-1">
                <div className="text-sm font-semibold text-white/90 group-hover:text-blue-300 transition-colors">{title}</div>
                <div className={`text-[9px] uppercase font-bold ${confColor}`}>{confidence} Conf.</div>
            </div>
            <div className="text-xs text-white/50">{reason}</div>
        </div>
    );
}
