/**
 * @file TradeReadinessPanel.jsx
 * @purpose Displays the daily pre-market trading plan and readiness assessment.
 * @responsibilities
 * - Visualizes Focus Areas (instruments, strategy).
 * - Highlights Risk Zones (time windows, traps).
 * - Enforces Capital Deployment rules (risk limits, allocation bias).
 * @key_exports
 * - TradeReadinessPanel (Default Component)
 * @dependencies
 * - React, lucide-react, Card (Shared)
 * @lifecycle
 * - Rendered by MasterDashboard to guide the trader's session.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import { Crosshair, AlertOctagon, Wallet } from "lucide-react";
import Card from "@/shared/components/common/Card";

// =============================
// Main Component
// =============================

export default function TradeReadinessPanel({ readiness }) {
    const { capital } = readiness;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">

            {/* 1. FOCUS AREAS (What to Trade) */}
            <Card className="border-2 dark:border border-emerald-500/40 hover:border-emerald-500/60 flex flex-col relative overflow-hidden group">
                <div className="flex items-center gap-2 mb-4">
                    <Crosshair size={14} className="text-emerald-500" />
                    <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Focus Areas</div>
                </div>

                <div className="space-y-4 z-10">
                    <div>
                        <div className="text-[9px] text-text-tertiary font-bold uppercase mb-1.5">Preferred Instruments</div>
                        <div className="flex gap-2 flex-wrap">
                            {readiness.do.instruments.map(i => (
                                <span key={i} className="text-[10px] font-bold text-text-primary bg-background-elevated px-2 py-1 rounded border border-border-subtle cursor-default transition-colors hover:border-emerald-500/30">
                                    {i}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] text-text-tertiary font-bold uppercase mb-1">Strategy Type</div>
                        <div className="text-sm font-bold text-emerald-500 font-mono tracking-tight">{readiness.do.strategy}</div>
                    </div>
                </div>
            </Card>

            {/* 2. RISK ZONES (What to Avoid) */}
            <Card className="border-2 dark:border border-red-500/40 hover:border-red-500/60 flex flex-col relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                    <AlertOctagon size={14} className="text-red-500" />
                    <div className="text-xs font-bold text-red-500 uppercase tracking-widest">Risk Zones</div>
                </div>

                <div className="space-y-4 z-10">
                    <div>
                        <div className="text-[9px] text-red-500 opacity-70 font-bold uppercase mb-1">Avoid Time Windows</div>
                        <div className="text-sm font-medium text-red-500 font-mono">
                            {readiness.avoid.windows.join(", ")}
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] text-red-500 opacity-70 font-bold uppercase mb-1">Traps</div>
                        <ul className="list-disc list-inside text-xs text-text-secondary space-y-0.5">
                            {readiness.avoid.traps.map((trap, i) => (
                                <li key={i}>{trap}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Card>

            {/* 3. CAPITAL PLAN (How to Size) */}
            <Card className="border-2 dark:border border-blue-500/40 hover:border-blue-500/60 flex flex-col justify-center relative">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Wallet size={14} className="text-blue-500" />
                        <div className="text-xs font-bold text-blue-500 uppercase tracking-widest">Capital Plan</div>
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${capital.mode === 'Aggressive' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' :
                        capital.mode === 'Defensive' ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' :
                            'text-blue-500 border-blue-500/30 bg-blue-500/10'
                        }`}>
                        {capital.mode} Mode
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border-subtle pt-4">
                    <div>
                        <div className="text-[9px] text-text-tertiary font-bold uppercase mb-1">Max Session Risk</div>
                        <div className="text-2xl font-bold text-text-primary font-mono tracking-tighter">{capital.maxRisk}</div>
                        <div className="text-[9px] text-text-tertiary mt-1">Stop limit enforced.</div>
                    </div>
                    <div>
                        <div className="text-[9px] text-text-tertiary font-bold uppercase mb-1">Allocation Bias</div>
                        <div className="text-sm font-medium text-text-secondary font-mono leading-snug">{capital.deployment}</div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
