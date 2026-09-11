/**
 * @file WalletHeader.jsx
 * @purpose Top-level summary component for the Wallet feature.
 * @responsibilities
 * - Displays active capital, P&L, trading mode, and risk monitor.
 * - Matches modern Praxis glassmorphic design system.
 * @key_exports
 * - WalletHeader (Default)
 * @dependencies
 * - PortalTooltip, Lucide React
 * @lifecycle
 * - Rendered by WalletPage.
 * @date 2026-02-03
 */

import React from "react";
import { HelpCircle, TrendingUp, TrendingDown, ShieldCheck, ShieldAlert, Zap } from "lucide-react";
import PortalTooltip from "@/shared/components/ui/PortalTooltip";

export default function WalletHeader({ summary }) {
    if (!summary) return null;

    const {
        availableCapital = 0,
        todayPnL = 0,
        todayPnLPct = 0,
        activeMode = "Balanced",
        openRiskPct = 0,
        maxRiskAllowedPct = 2.0
    } = summary;

    const isPnLPositive = todayPnL > 0;
    const isPnLNegative = todayPnL < 0;
    const deltaColor = isPnLPositive ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        : isPnLNegative ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
            : "text-text-tertiary bg-background-surface/80 border-border-subtle/40";
    const deltaSign = isPnLPositive ? "+" : "";

    // Capital formatting
    const formattedCapital = availableCapital === 0 
        ? "0.00" 
        : availableCapital >= 100000 
            ? `${(availableCapital / 100000).toFixed(2)}L` 
            : availableCapital >= 1000 
                ? `${(availableCapital / 1000).toFixed(1)}k` 
                : availableCapital.toFixed(2);

    // Determine Mode visuals
    const modeConfig = activeMode.toLowerCase().includes('aggressive') 
        ? { label: 'Aggressive', color: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30', activeIndex: 2 }
        : activeMode.toLowerCase().includes('conservative')
            ? { label: 'Conservative', color: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', activeIndex: 0 }
            : { label: 'Balanced', color: 'text-sky-400', badge: 'bg-sky-500/10 text-sky-300 border-sky-500/30', activeIndex: 1 };

    const isRiskElevated = openRiskPct > 1.2;
    const isRiskCritical = openRiskPct >= maxRiskAllowedPct;

    return (
        <div className="relative rounded-2xl border border-border-default/40 bg-background-card/60 backdrop-blur-xl shadow-sm hover:border-border-default/60 transition-all overflow-hidden">
            <div className="flex flex-col lg:grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border-default/20 bg-transparent">

                {/* A. AVAILABLE CAPITAL */}
                <div className="p-4 md:p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2 gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-tertiary uppercase tracking-wider min-w-0">
                                <span className="truncate">Available Capital</span>
                                <PortalTooltip content={<div className="p-2 text-xs">Total trading balance currently free for intraday or overnight positions.</div>}>
                                    <HelpCircle className="w-3.5 h-3.5 text-text-tertiary hover:text-sky-400 cursor-pointer transition-colors shrink-0" />
                                </PortalTooltip>
                            </div>

                            {/* P&L Pill */}
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${deltaColor} shrink-0`}>
                                {isPnLPositive ? <TrendingUp size={11} /> : isPnLNegative ? <TrendingDown size={11} /> : null}
                                <span>{deltaSign}₹{Math.abs(todayPnL).toLocaleString('en-IN')}</span>
                                <span className="opacity-75 font-normal ml-0.5">({deltaSign}{Math.abs(todayPnLPct)}%)</span>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-2xl md:text-3xl text-text-tertiary font-medium">₹</span>
                            <div className="text-4xl md:text-5xl font-bold font-mono tracking-tight text-text-primary">
                                {formattedCapital}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-border-subtle/20 text-[10px] text-text-tertiary font-mono">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="tracking-wider uppercase">Live Margin Feed</span>
                        </div>
                        <span>₹{availableCapital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* B. ACTIVE RISK PROFILE */}
                <div className="p-4 md:p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                                Active Profile
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${modeConfig.badge}`}>
                                {modeConfig.label}
                            </span>
                        </div>

                        <div className="mb-3">
                            <div className={`text-2xl md:text-3xl font-bold ${modeConfig.color} tracking-tight mb-1`}>
                                {modeConfig.label} Engine
                            </div>
                            <div className="text-xs text-text-secondary leading-relaxed">
                                Dynamic position sizing calibrated to current market volatility.
                            </div>
                        </div>
                    </div>

                    {/* Segmented Mode Track */}
                    <div className="pt-3 mt-2 border-t border-border-subtle/20">
                        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-background-surface/50 border border-border-subtle/40">
                            {[
                                { id: 0, name: "Conservative", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" },
                                { id: 1, name: "Balanced", color: "text-sky-400 bg-sky-500/15 border-sky-500/30" },
                                { id: 2, name: "Aggressive", color: "text-rose-400 bg-rose-500/15 border-rose-500/30" },
                            ].map(seg => {
                                const isActive = modeConfig.activeIndex === seg.id;
                                return (
                                    <div
                                        key={seg.id}
                                        className={`py-1 text-center text-[10px] font-bold rounded-lg transition-all border ${
                                            isActive
                                                ? `${seg.color} shadow-sm font-semibold`
                                                : "text-text-tertiary border-transparent opacity-60"
                                        }`}
                                    >
                                        {seg.name}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* C. RISK MONITOR */}
                <div className="p-4 md:p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                                Risk Monitor
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                                isRiskCritical 
                                    ? "bg-rose-500/15 text-rose-400 border-rose-500/30" 
                                    : isRiskElevated 
                                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30" 
                                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            }`}>
                                {isRiskCritical ? "Critical" : isRiskElevated ? "Elevated" : "Optimal"}
                            </span>
                        </div>

                        <div className="space-y-3 mt-3">
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs text-text-secondary font-medium">Open Margin Risk</span>
                                <span className={`font-mono font-bold text-2xl ${
                                    isRiskCritical ? 'text-rose-400' : isRiskElevated ? 'text-amber-400' : 'text-emerald-400'
                                }`}>
                                    {openRiskPct}%
                                </span>
                            </div>

                            {/* Risk Progress Bar */}
                            <div className="w-full bg-background-surface/80 border border-border-subtle/50 h-2 rounded-full overflow-hidden p-0.5">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        isRiskCritical ? 'bg-rose-500' : isRiskElevated ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min((openRiskPct / maxRiskAllowedPct) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-border-subtle/20 text-[10px] text-text-tertiary font-mono">
                        <span className="uppercase tracking-wider">Max Allowed / Day</span>
                        <span className="font-bold text-text-secondary">{maxRiskAllowedPct}%</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

