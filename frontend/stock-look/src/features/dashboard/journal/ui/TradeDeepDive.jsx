import React from "react";
import { X, Check, XCircle, Clock, Target, Shield } from "lucide-react";

export default function TradeDeepDive({ trade, onClose }) {
    if (!trade) return null;

    const isWin = trade.outcome === 'Win';
    const statusColor = isWin ? 'text-emerald-400' : 'text-red-400';
    const statusBg = isWin ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0b1220] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto invisibleScroll shadow-2xl relative">

                {/* HEADER */}
                <div className="px-6 py-5 border-b border-white/5 flex items-start justify-between bg-white/[0.02]">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusBg} ${statusColor}`}>
                                {trade.outcome}
                            </span>
                            <span className="text-sm text-slate-400 font-mono">
                                {new Date(trade.date).toLocaleString()}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{trade.instrument} <span className="text-slate-500 text-lg">({trade.direction})</span></h2>
                        <div className="text-xs font-bold text-slate-500 uppercase mt-1">Strategy: {trade.strategy}</div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-8 space-y-8">

                    {/* 1. EXECUTION REVIEW */}
                    <Section title="Execution Review" icon={<Clock size={14} />}>
                        <div className="grid grid-cols-4 gap-6">
                            <MetricBox label="Entry Price" value={trade.entry} />
                            <MetricBox label="Exit Price" value={trade.exit} />
                            <MetricBox label="Risk Taken" value={`${trade.riskPct}%`} />
                            <MetricBox label="R-Multiple" value={`${trade.rMultiple}R`} color={statusColor} />
                        </div>
                    </Section>

                    {/* 2. RULE ADHERENCE CHECKLIST */}
                    <Section title="Rule Adherence" icon={<Shield size={14} />}>
                        <div className="grid grid-cols-3 gap-4">
                            <CheckItem label="Early Entry?" value={trade.execution.earlyEntry ? "Yes (Violation)" : "No (Clean)"} isGood={!trade.execution.earlyEntry} />
                            <CheckItem label="SL Respected?" value={trade.execution.slRespected ? "Yes" : "No (Violation)"} isGood={trade.execution.slRespected} />
                            <CheckItem label="Target Managed?" value={trade.execution.targetManaged ? "Yes" : "No / Early"} isGood={trade.execution.targetManaged} />
                        </div>
                    </Section>

                    {/* 3. DECISION CONTEXT & PSYCHOLOGY */}
                    <Section title="Decision Context" icon={<Target size={14} />}>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white/5 p-4 rounded-lg">
                                <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Trader State</div>
                                <div className="text-lg font-bold text-slate-200 mb-1">{trade.psychology.state}</div>
                                <div className="text-xs text-slate-400 italic">"{trade.psychology.notes}"</div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500 font-bold uppercase">Market Regime</span>
                                    <span className="text-xs text-slate-200 font-mono">{trade.context.regime}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500 font-bold uppercase">Volatility</span>
                                    <span className="text-xs text-slate-200 font-mono">{trade.context.vol}</span>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* 4. ELITE VERDICT (If Available) */}
                    {trade.verdict && (
                        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20">
                            <div className="text-[10px] uppercase font-bold text-blue-400 mb-1">Stocky AI Verdict</div>
                            <div className="text-lg font-bold text-slate-200">{trade.verdict}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Section({ title, icon, children }) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-4 text-slate-500 border-b border-white/5 pb-2">
                {icon}
                <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
            </div>
            {children}
        </div>
    );
}

function MetricBox({ label, value, color = "text-slate-200" }) {
    return (
        <div>
            <div className="text-[10px] uppercase font-bold text-slate-600 mb-1">{label}</div>
            <div className={`text-xl font-mono font-bold tracking-tight ${color}`}>{value}</div>
        </div>
    );
}

function CheckItem({ label, value, isGood }) {
    return (
        <div className={`p-3 rounded border ${isGood ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">{label}</div>
            <div className={`text-sm font-bold flex items-center gap-2 ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
                {isGood ? <Check size={14} /> : <XCircle size={14} />}
                {value}
            </div>
        </div>
    );
}
