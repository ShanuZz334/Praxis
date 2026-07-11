/**
 * @file TradeDeepDive.jsx
 * @purpose Detail modal for analyzing individual trades.
 * @responsibilities
 * - Displays comprehensive trade details (Entry, Exit, R-Multiple, PnL).
 * - Shows execution checklist (Rule Adherence).
 * - Reveals psychological state and failure attribution.
 * - Provides AI-generated verdict if available.
 * @key_exports
 * - TradeDeepDive (Default Component)
 * @dependencies
 * - lucide-react (Icons)
 * - ThemeContext
 * @lifecycle
 * - Rendered by JournalPage when a trade is selected.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import { X, Check, XCircle, Clock, Target, Shield } from "lucide-react";
import { useTheme } from "@/shared/context/ThemeContext";

// =============================
// Helper Components
// =============================

function Section({ title, icon, children }) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-4 text-text-tertiary border-b border-border-subtle pb-2">
                {icon}
                <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
            </div>
            {children}
        </div>
    );
}

function MetricBox({ label, value, color }) {
    return (
        <div>
            <div className="text-[10px] uppercase font-bold text-text-tertiary mb-1">{label}</div>
            <div className={`text-xl font-mono font-bold tracking-tight ${color || 'text-text-primary'}`}>{value}</div>
        </div>
    );
}

function CheckItem({ label, value, isGood }) {
    return (
        <div className={`p-3 rounded border ${isGood ? 'bg-emerald-500/[0.05] border-emerald-500/20' : 'bg-red-500/[0.05] border-red-500/20'}`}>
            <div className="text-[10px] uppercase font-bold text-text-tertiary mb-1">{label}</div>
            <div className={`text-sm font-bold flex items-center gap-2 ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
                {isGood ? <Check size={14} /> : <XCircle size={14} />}
                {value}
            </div>
        </div>
    );
}

// =============================
// Main Component
// =============================

export default function TradeDeepDive({ trade, onClose }) {
    const { theme } = useTheme();
    if (!trade) return null;

    const isWin = trade.outcome === 'Win';
    const statusColor = isWin ? 'text-emerald-400' : 'text-red-400';
    const statusBg = isWin ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20';

    return (
        <div className={`hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 ${theme}`}>
            <div className="bg-background-tooltip border border-border-default rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto invisibleScroll shadow-2xl relative">

                {/* HEADER */}
                <div className="px-6 py-5 border-b border-border-default flex items-start justify-between bg-background-surface">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-wider border ${statusBg} ${statusColor}`}>
                                {trade.outcome}
                            </span>
                            <span className="text-xs md:text-sm text-text-secondary font-mono">
                                {new Date(trade.date).toLocaleString()}
                            </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">{trade.instrument} <span className="text-text-tertiary text-base md:text-lg">({trade.direction})</span></h2>
                        <div className="text-[10px] md:text-xs font-bold text-text-tertiary uppercase mt-1">Strategy: {trade.strategy}</div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-background-subtle rounded-full transition-colors">
                        <X size={20} className="text-text-tertiary hover:text-text-primary" />
                    </button>
                </div>

                {/* CONTENT BODY */}
                <div className="p-4 md:p-8 space-y-6 md:space-y-8">

                    {/* 1. EXECUTION REVIEW */}
                    <Section title="Execution Review" icon={<Clock size={14} />}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            <MetricBox label="Entry Price" value={trade.entry} />
                            <MetricBox label="Exit Price" value={trade.exit} />
                            <MetricBox label="Risk Taken" value={`${trade.riskPct}%`} />
                            <MetricBox label="R-Multiple" value={`${trade.rMultiple}R`} color={statusColor} />
                        </div>
                    </Section>

                    {/* 2. RULE ADHERENCE CHECKLIST */}
                    <Section title="Rule Adherence" icon={<Shield size={14} />}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                            <CheckItem label="Early Entry?" value={trade.execution.earlyEntry ? "Yes (Violation)" : "No (Clean)"} isGood={!trade.execution.earlyEntry} />
                            <CheckItem label="SL Respected?" value={trade.execution.slRespected ? "Yes" : "No (Violation)"} isGood={trade.execution.slRespected} />
                            <CheckItem label="Target Managed?" value={trade.execution.targetManaged ? "Yes" : "No / Early"} isGood={trade.execution.targetManaged} />
                        </div>
                    </Section>

                    {/* 3. DECISION CONTEXT & PSYCHOLOGY */}
                    <Section title="Decision Context" icon={<Target size={14} />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="bg-background-surface p-4 rounded-lg border border-border-subtle">
                                <div className="text-[10px] uppercase font-bold text-text-tertiary mb-2">Trader State</div>
                                <div className="text-base md:text-lg font-bold text-text-primary mb-1">{trade.psychology.state}</div>
                                <div className="text-[10px] md:text-xs text-text-secondary italic">"{trade.psychology.notes}"</div>
                            </div>
                            <div className="bg-background-surface p-4 rounded-lg border border-border-subtle space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-[10px] md:text-xs text-text-tertiary font-bold uppercase">Market Regime</span>
                                    <span className="text-[10px] md:text-xs text-text-primary font-mono">{trade.context.regime}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] md:text-xs text-text-tertiary font-bold uppercase">Volatility</span>
                                    <span className="text-[10px] md:text-xs text-text-primary font-mono">{trade.context.vol}</span>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* 4. ELITE VERDICT */}
                    {trade.verdict && (
                        <div className="mt-6 p-4 rounded-xl bg-blue-500/[0.05] border border-blue-500/20">
                            <div className="text-[10px] uppercase font-bold text-blue-400 mb-1">Praxis AI Verdict</div>
                            <div className="text-lg font-bold text-text-primary">{trade.verdict}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
