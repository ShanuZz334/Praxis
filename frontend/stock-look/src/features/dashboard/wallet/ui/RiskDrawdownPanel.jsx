/**
 * @file RiskDrawdownPanel.jsx
 * @purpose Advanced drawdown monitoring and risk protocol visualization.
 * @responsibilities
 * - Visualizes drawdown with a ring chart and critical zones.
 * - Lists active risk protocols and their status (Armed/Triggered).
 * @key_exports
 * - RiskDrawdownPanel (Default)
 * @dependencies
 * - Lucide React
 * @lifecycle
 * - Rendered by WalletPage.
 * @date 2026-02-03
 */

import React from "react";
import { ShieldAlert, AlertTriangle, ShieldCheck, Lock, Activity } from "lucide-react";

export default function RiskDrawdownPanel({ drawdown, riskRules }) {
    const fillPct = Math.min(100, Math.max(0, (drawdown.current / drawdown.maxAllowed) * 100));
    const isCritical = fillPct > 80;
    const isElevated = fillPct > 40;

    const meterColor = isCritical ? "#f43f5e" : isElevated ? "#f59e0b" : "#10b981";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">

            {/* 1. DRAWDOWN MONITOR */}
            <div className="bg-background-card/60 backdrop-blur-xl border border-border-default/40 rounded-2xl p-5 md:p-6 shadow-sm hover:border-border-default/60 transition-all flex flex-col justify-between">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-border-default/30">
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-sky-400" />
                        <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                            Drawdown Concentrator
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border bg-background-surface/60 border-border-subtle/50">
                        <div className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-rose-500 animate-pulse' : isElevated ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <span className={isCritical ? 'text-rose-400' : isElevated ? 'text-amber-400' : 'text-emerald-400'}>
                            {isCritical ? 'Critical Zone' : isElevated ? 'Caution Zone' : 'Stable'}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 flex-1">
                    {/* RING CHART */}
                    <div className="relative w-36 h-36 flex flex-col items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            {/* Track */}
                            <circle
                                cx="72" cy="72" r="58"
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="none"
                                className="text-background-surface/80"
                            />
                            {/* Value */}
                            <circle
                                cx="72" cy="72" r="58"
                                stroke={meterColor}
                                strokeWidth="10"
                                fill="none"
                                strokeDasharray="364.4"
                                strokeDashoffset={364.4 - (364.4 * fillPct) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center text-center">
                            <span className={`text-3xl font-bold font-mono tracking-tight ${isCritical ? 'text-rose-400' : isElevated ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {drawdown.current}%
                            </span>
                            <span className="text-[9px] text-text-tertiary uppercase font-bold tracking-wider mt-0.5">
                                Depletion
                            </span>
                        </div>
                    </div>

                    {/* STAT STACK */}
                    <div className="flex-1 w-full space-y-3.5">
                        <DrawdownStat
                            label="Max Allowed DD"
                            value={`${drawdown.maxAllowed}%`}
                            subtext={`₹${((drawdown.peakCapital * drawdown.maxAllowed) / 100).toLocaleString('en-IN')}`}
                        />
                        <DrawdownStat
                            label="Remaining Risk Budget"
                            value={`₹${drawdown.remainingBudget.toLocaleString('en-IN')}`}
                            subtext="Before Trade Freeze"
                            color="text-emerald-400"
                        />
                        <DrawdownStat
                            label="Recovery to ATH"
                            value={`${drawdown.recoveryNeeded}%`}
                            subtext="Required Growth"
                            color="text-sky-400"
                        />
                    </div>
                </div>
            </div>

            {/* 2. AUTO-RISK PROTOCOLS */}
            <div className="bg-background-card/60 backdrop-blur-xl border border-border-default/40 rounded-2xl p-5 md:p-6 shadow-sm hover:border-border-default/60 transition-all flex flex-col">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-border-default/30">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                            Active Risk Protocols
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        System Armed
                    </div>
                </div>

                <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                    {riskRules.map(rule => (
                        <div
                            key={rule.id}
                            className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all ${
                                rule.triggered
                                    ? "bg-rose-500/10 border-rose-500/30"
                                    : "bg-background-surface/40 border-border-subtle/40 hover:bg-background-surface/70"
                            }`}
                        >
                            {/* Icon */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                rule.active
                                    ? (rule.triggered 
                                        ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' 
                                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400')
                                    : 'bg-background-surface border-border-subtle text-text-tertiary'
                            }`}>
                                {rule.active
                                    ? (rule.triggered ? <AlertTriangle size={15} /> : <ShieldAlert size={15} />)
                                    : <Lock size={15} />
                                }
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className={`text-xs font-semibold truncate ${rule.triggered ? 'text-rose-300' : 'text-text-primary'}`}>
                                    {rule.text}
                                </div>
                                <div className="text-[10px] font-mono text-text-tertiary mt-0.5 truncate">
                                    Condition: {rule.condition}
                                </div>
                            </div>

                            {/* Status Pill */}
                            <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono uppercase tracking-wider border shrink-0 ${
                                rule.active
                                    ? (rule.triggered
                                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400')
                                    : 'bg-background-surface border-border-subtle text-text-tertiary'
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

function DrawdownStat({ label, value, subtext, color = "text-text-primary" }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-border-subtle/20 last:border-0 last:pb-0">
            <div>
                <div className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider">{label}</div>
            </div>
            <div className="text-right">
                <div className={`text-sm font-mono font-bold ${color}`}>{value}</div>
                <div className="text-[9px] text-text-tertiary italic font-medium">{subtext}</div>
            </div>
        </div>
    );
}

