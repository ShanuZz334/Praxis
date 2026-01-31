import React from "react";
import Card from "@/shared/components/common/Card";

export default function ProDeskPicks({ data }) {
    if (!data) return null;
    const { calls, puts } = data;

    return (
        <Card className="h-full flex flex-col">

            <div className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-6 border-b border-border-subtle pb-3">
                Pro Desk Picks
            </div>

            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* CALLS SECTION */}
                <div>
                    <div className="text-[10px] font-bold text-state-bullish-text uppercase tracking-wider mb-2">Top Calls (Bullish)</div>
                    <div className="space-y-2">
                        {calls.map((item, i) => (
                            <OptionRow key={i} item={item} type="call" />
                        ))}
                    </div>
                </div>

                {/* PUTS SECTION */}
                <div>
                    <div className="text-[10px] font-bold text-state-bearish-text uppercase tracking-wider mb-2">Top Puts (Bearish)</div>
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

function OptionRow({ item, type }) {
    const isCall = type === 'call';
    const accent = isCall ? 'text-state-bullish-text' : 'text-state-bearish-text';
    const border = isCall ? 'border-emerald-500/20' : 'border-red-500/20';
    const bg = isCall ? 'bg-emerald-500/[0.10]' : 'bg-red-500/[0.10]';

    return (
        <div className={`p-3 rounded-lg border ${border} ${bg} hover:bg-background-subtle transition-colors flex justify-between items-center group`}>

            {/* Left: Strike & DTE */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-primary tracking-tight">{item.strike}</span>
                <span className="text-[9px] font-bold text-text-tertiary bg-background-elevated px-1.5 py-0.5 rounded border border-border-subtle">{item.dte}</span>
            </div>

            {/* Right: Data */}
            <div className="text-right">
                <div className={`text-sm font-mono font-bold ${accent}`}>₹{item.price}</div>
                <div className="flex items-center justify-end gap-3 text-[9px] font-medium text-text-secondary">
                    <span className={item.change.startsWith('+') ? 'text-state-bullish-text' : 'text-state-bearish-text'}>
                        Δ {item.change}
                    </span>
                    <span>OI {item.oi}</span>
                </div>
            </div>

        </div>
    );
}
