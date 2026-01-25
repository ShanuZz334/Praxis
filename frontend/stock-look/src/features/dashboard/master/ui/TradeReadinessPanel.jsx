import React from "react";
import { Crosshair, AlertOctagon, Wallet } from "lucide-react";
import Card from "@/shared/components/common/Card";

export default function TradeReadinessPanel({ readiness }) {
    const { capital } = readiness;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

            {/* 1. FOCUS (Action) */}
            <Card className="border-emerald-500/20 hover:border-emerald-500/30 flex flex-col relative overflow-hidden group">
                <div className="flex items-center gap-2 mb-4">
                    <Crosshair size={14} className="text-emerald-400" />
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Focus Areas</div>
                </div>

                <div className="space-y-4 z-10">
                    <div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase mb-1.5">Preferred Instruments</div>
                        <div className="flex gap-2 flex-wrap">
                            {readiness.do.instruments.map(i => (
                                <span key={i} className="text-[10px] font-bold text-slate-200 bg-white/5 px-2 py-1 rounded border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                                    {i}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Strategy Type</div>
                        <div className="text-sm font-bold text-emerald-300 font-mono tracking-tight">{readiness.do.strategy}</div>
                    </div>
                </div>
            </Card>

            {/* 2. RISK ZONES (Avoid) */}
            <Card className="border-red-500/20 hover:border-red-500/30 flex flex-col relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                    <AlertOctagon size={14} className="text-red-400" />
                    <div className="text-xs font-bold text-red-400 uppercase tracking-widest">Risk Zones</div>
                </div>

                <div className="space-y-4 z-10">
                    <div>
                        <div className="text-[9px] text-red-400/50 font-bold uppercase mb-1">Avoid Time Windows</div>
                        <div className="text-sm font-medium text-red-200 font-mono">
                            {readiness.avoid.windows.join(", ")}
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] text-red-400/50 font-bold uppercase mb-1">Traps</div>
                        <ul className="list-disc list-inside text-xs text-red-100/70 space-y-0.5">
                            {readiness.avoid.traps.map((trap, i) => (
                                <li key={i}>{trap}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Card>

            {/* 3. CAPITAL DEPLOYMENT (Constraint) */}
            <Card className="border-blue-500/20 hover:border-blue-500/30 flex flex-col justify-center relative">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Wallet size={14} className="text-blue-400" />
                        <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Capital Plan</div>
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${capital.mode === 'Aggressive' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' :
                        capital.mode === 'Defensive' ? 'text-amber-400 border-amber-400/30 bg-amber-400/10' :
                            'text-blue-400 border-blue-400/30 bg-blue-400/10'
                        }`}>
                        {capital.mode} Mode
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                    <div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Max Session Risk</div>
                        <div className="text-2xl font-bold text-slate-200 font-mono tracking-tighter">{capital.maxRisk}</div>
                        <div className="text-[9px] text-slate-600 mt-1">Stop limit enforced.</div>
                    </div>
                    <div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Allocation Bias</div>
                        <div className="text-sm font-medium text-blue-200 font-mono leading-snug">{capital.deployment}</div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
