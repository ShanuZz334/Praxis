/**
 * @file ProDeskPicks.jsx
 * @purpose Displays curated high-probability options setups.
 * @responsibilities
 * - Renders lists of Call (bullish) and Put (bearish) recommendations.
 * - Shows key metrics like Strike, DTE, Price, Change, and Open Interest.
 * - Provides visual distinction between bullish and bearish setups.
 * @key_exports
 * - ProDeskPicks (Default Component)
 * @dependencies
 * - React, Card (Shared)
 * @lifecycle
 * - Rendered by MasterDashboard (Grid Section).
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from "react";
import Card from "@/shared/components/common/Card";

// =============================
// Helper Component
// =============================

function OptionRow({ item, type }) {
    const isCall = type === 'call';
    const accent = isCall ? 'text-state-bullish-text' : 'text-state-bearish-text';
    const border = isCall ? 'border-emerald-500/20' : 'border-red-500/20';
    const bg = isCall ? 'bg-emerald-500/[0.10] dark:bg-transparent' : 'bg-red-500/[0.10] dark:bg-transparent';
    const hoverBg = isCall ? 'group-hover:bg-emerald-500/[0.05]' : 'group-hover:bg-red-500/[0.05]';

    return (
        <div className={`p-2.5 md:p-3 rounded-lg border-2 ${border} ${bg} ${hoverBg} transition-colors flex justify-between items-center group cursor-pointer active:scale-[0.99]`}>

            {/* Left: Strike & DTE */}
            <div className="flex items-center gap-1.5 md:gap-2">
                <span className="text-xs md:text-sm font-bold text-text-primary tracking-tight">{item.strike}</span>
                <span className="text-[8px] md:text-[9px] font-bold text-text-tertiary bg-background-elevated px-1 md:px-1.5 py-0.5 rounded border border-border-subtle">{item.dte}</span>
            </div>

            {/* Right: Data */}
            <div className="text-right">
                <div className={`text-xs md:text-sm font-mono font-bold ${accent}`}>₹{item.price}</div>
                <div className="flex items-center justify-end gap-2 md:gap-3 text-[8px] md:text-[9px] font-medium text-text-secondary">
                    <span className={item.change.startsWith('+') ? 'text-state-bullish-text' : 'text-state-bearish-text'}>
                        Δ {item.change}
                    </span>
                    <span>OI {item.oi}</span>
                </div>
            </div>

        </div>
    );
}

// =============================
// Main Component
// =============================

export default function ProDeskPicks({ data }) {
    if (!data) return null;
    const { calls, puts } = data;

    return (
        <Card className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">

            <div className="text-[10px] md:text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4 md:mb-6 border-b border-border-subtle pb-2 md:pb-3">
                Pro Desk Picks
            </div>

            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 custom-scrollbar">

                {/* CALLS SECTION */}
                <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                    <div className="text-[10px] font-bold text-state-bullish-text uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Top Calls (Bullish)
                    </div>
                    <div className="space-y-2">
                        {calls.map((item, i) => (
                            <OptionRow key={i} item={item} type="call" />
                        ))}
                    </div>
                </div>

                {/* PUTS SECTION */}
                <div className="animate-in fade-in slide-in-from-right-2 duration-500">
                    <div className="text-[10px] font-bold text-state-bearish-text uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Top Puts (Bearish)
                    </div>
                    <div className="space-y-2">
                        {puts.map((item, i) => (
                            <OptionRow key={i} item={item} type="put" />
                        ))}
                    </div>
                </div>

            </div>
        </Card>
    );
}
