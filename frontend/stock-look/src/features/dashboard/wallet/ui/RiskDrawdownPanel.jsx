import React from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, Lock } from "lucide-react";

export default function RiskDrawdownPanel({ drawdown, riskRules }) {
    const fillPct = (drawdown.current / drawdown.maxAllowed) * 100;
    const isCritical = fillPct > 80;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* 1. DRAWDOWN MONITOR */}
            <div className="bg-[#0b1220] border border-white/5 rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.45)] flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <div className="text-xs font-bold text-white/40 uppercase tracking-widest">Drawdown Concentrator</div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className={`text-[10px] font-bold uppercase ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                            {isCritical ? 'Critical Zone' : 'Stable'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-8 flex-1">
                    {/* RING CHART */}
                    <div className="relative w-36 h-36 flex flex-col items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            {/* Track */}
                            <circle cx="72" cy="72" r="60" stroke="#1e293b" strokeWidth="12" fill="none" />
                            {/* Value */}
                            <circle
                                cx="72" cy="72" r="60"
                                stroke={isCritical ? "#ef4444" : "#f59e0b"}
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray="377"
                                strokeDashoffset={377 - (377 * fillPct) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className={`text-3xl font-bold ${isCritical ? 'text-red-500' : 'text-amber-400'}`}>
                                {drawdown.current}%
                            </span>
                            <span className="text-[9px] text-white/30 uppercase font-bold tracking-wider">Depletion</span>
                        </div>
                    </div>

                    {/* STAT STACK */}
                    <div className="flex-1 space-y-4">
                        <DrawdownStat
                            label="Max Allowed DD"
                            value={`${drawdown.maxAllowed}%`}
                            subtext={`₹${((drawdown.peakCapital * drawdown.maxAllowed) / 100).toLocaleString()}`}
                        />
                        <DrawdownStat
                            label="Remaining Risk Budget"
                            value={`₹${drawdown.remainingBudget.toLocaleString()}`}
                            subtext="Before Freeze"
                            color="text-emerald-400"
                        />
                        <DrawdownStat
                            label="Recovery to ATH"
                            value={`${drawdown.recoveryNeeded}%`}
                            subtext="Growth Required"
                            color="text-blue-400"
                        />
                    </div>
                </div>
            </div>

            {/* 2. AUTO-RISK PROTOCOLS */}
            <div className="bg-[#0b1220] border border-white/5 rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.45)] flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <div className="text-xs font-bold text-white/40 uppercase tracking-widest">Active Risk Protocols</div>
                    <div className="bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-blue-400 uppercase">
                        System Armed
                    </div>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                    {riskRules.map(rule => (
                        <div key={rule.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">

                            {/* Icon */}
                            <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 border 
                                ${rule.active
                                    ? (rule.triggered ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500')
                                    : 'bg-slate-500/10 border-slate-500/20 text-slate-500'
                                }`}>
                                {rule.active
                                    ? (rule.triggered ? <AlertTriangle size={14} /> : <ShieldAlert size={14} />)
                                    : <Lock size={14} />
                                }
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-bold truncate ${rule.triggered ? 'text-red-300' : 'text-white/90'}`}>
                                    {rule.text}
                                </div>
                                <div className="text-[10px] font-mono text-white/40 mt-0.5 truncate">
                                    Condition: {rule.condition}
                                </div>
                            </div>

                            {/* Status Pill */}
                            <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border shrink-0
                                ${rule.active
                                    ? (rule.triggered
                                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400')
                                    : 'bg-slate-500/10 border-slate-500/20 text-slate-500'
                                }`}>
                                {rule.status}
                            </div>

                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

function DrawdownStat({ label, value, subtext, color = "text-white" }) {
    return (
        <div className="flex justify-between items-center pb-2 border-b border-white/5 last:border-0">
            <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">{label}</div>
            </div>
            <div className="text-right">
                <div className={`text-sm font-mono font-bold ${color}`}>{value}</div>
                <div className="text-[9px] text-white/20 italic">{subtext}</div>
            </div>
        </div>
    );
}
