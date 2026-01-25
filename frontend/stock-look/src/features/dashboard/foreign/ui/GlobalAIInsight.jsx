import React from "react";
import { generateGlobalInsight } from "../engine/globalRiskEngine";

export default function GlobalAIInsight({ globalData }) {
    const insight = generateGlobalInsight(globalData);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT: ANALYST VIEW */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#0b1220] to-[#162036] border border-white/10 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 text-8xl">🌍</div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                        <h3 className="text-lg font-bold text-white">{insight.title}</h3>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed mb-4 max-w-2xl">
                        {insight.text}
                    </p>
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                        <span className="text-[10px] text-white/40 uppercase font-bold">Recommended Action</span>
                        <span className="text-xs text-blue-300 font-medium">{insight.action}</span>
                    </div>
                </div>
            </div>

            {/* RIGHT: SYSTEM BIAS OUTPUT */}
            <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col justify-center gap-4">
                <div className="text-xs font-bold text-white/40 uppercase tracking-wider">Quant System Output</div>

                <BiasRow label="Nifty Bias" value="Bullish" confidence="72%" color="text-green-400" />
                <BiasRow label="Bank Nifty Bias" value="Neutral" confidence="55%" color="text-yellow-400" />
                <BiasRow label="Options Regime" value="Short Vol" confidence="68%" color="text-purple-300" />
            </div>

        </div>
    );
}

function BiasRow({ label, value, confidence, color }) {
    return (
        <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
            <span className="text-xs text-white/60 font-medium">{label}</span>
            <div className="text-right">
                <div className={`text-sm font-bold ${color}`}>{value}</div>
                <div className="text-[9px] text-white/30 uppercase">Conf: {confidence}</div>
            </div>
        </div>
    );
}
