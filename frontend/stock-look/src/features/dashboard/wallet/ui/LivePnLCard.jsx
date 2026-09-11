/**
 * @file LivePnLCard.jsx
 * @purpose Displays real-time Profit & Loss metrics.
 * @responsibilities
 * - Shows Net P&L, Gross P&L, Charges, and Win/Loss contribution.
 * - Visualizes Equity Curve for the session/week.
 * @key_exports
 * - LivePnLCard (Default)
 * @dependencies
 * - Recharts, Lucide React
 * @lifecycle
 * - Rendered by WalletPage.
 * @date 2026-02-03
 */

import React from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function LivePnLCard({ pnl }) {
    const isProfit = pnl.net >= 0;
    const color = isProfit ? "#10b981" : "#f43f5e";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-background-card/60 backdrop-blur-xl border border-border-default/40 rounded-2xl overflow-hidden shadow-sm hover:border-border-default/60 transition-all">

            {/* LEFT: DETAILED P&L BREAKDOWN */}
            <div className="p-5 md:p-6 border-b lg:border-b-0 lg:border-r border-border-default/30 flex flex-col justify-between">

                {/* HEADLINE */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-sky-400" />
                            <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                                Today's Realized P&L
                            </span>
                        </div>
                        <div className="px-2 py-0.5 rounded-full bg-background-surface/80 border border-border-subtle/50 text-[10px] font-mono text-text-tertiary">
                            INTRADAY
                        </div>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className={`text-3xl md:text-4xl font-bold font-mono tracking-tight ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfit ? '+' : ''}₹{pnl.net.toLocaleString('en-IN')}
                        </span>
                        <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md border ${
                            isProfit ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                        }`}>
                            {pnl.todayPct}%
                        </span>
                    </div>
                    <div className="text-[10px] text-text-tertiary mt-1 font-medium">
                        Net realization after brokerage & statutory levies.
                    </div>
                </div>

                {/* BREAKDOWN GRID */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <MetricBox label="Gross P&L" value={`₹${pnl.gross.toLocaleString('en-IN')}`} accent="text-text-primary" />
                    <MetricBox label="Charges & Slip" value={`-₹${pnl.charges}`} accent="text-rose-400" />

                    <MetricBox
                        label="Win Contribution"
                        value={`+₹${pnl.winContribution.toLocaleString('en-IN')}`}
                        accent="text-emerald-400"
                        subtext="From Winners"
                    />
                    <MetricBox
                        label="Loss Drag"
                        value={`-₹${pnl.lossContribution.toLocaleString('en-IN')}`}
                        accent="text-rose-400"
                        subtext="From Losers"
                    />
                </div>
            </div>

            {/* RIGHT: EQUITY CURVE ANALYTICS */}
            <div className="p-5 md:p-6 bg-background-surface/20 relative flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1">
                            Equity Curve (7D)
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold font-mono text-text-primary">
                                ₹{pnl.weekly.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                +{((pnl.weekly / 70000) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <MiniStat label="Max DD" value={`${pnl.stats7D.maxDrawdown}%`} color="text-rose-400" />
                        <MiniStat label="Best Day" value={`+₹${pnl.stats7D.bestDay.toLocaleString('en-IN')}`} color="text-emerald-400" />
                    </div>
                </div>

                {/* CHART */}
                <div className="flex-1 min-h-[120px] -ml-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={pnl.equityCurve}>
                            <defs>
                                <linearGradient id="gradientEq" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="val"
                                stroke={color}
                                strokeWidth={2}
                                fill="url(#gradientEq)"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}

function MetricBox({ label, value, accent, subtext }) {
    return (
        <div className="bg-background-surface/50 border border-border-subtle/50 p-3 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">{label}</span>
            <span className={`text-base md:text-lg font-mono font-bold ${accent}`}>{value}</span>
            {subtext && <span className="text-[9px] text-text-tertiary mt-0.5 opacity-70">{subtext}</span>}
        </div>
    );
}

function MiniStat({ label, value, color }) {
    return (
        <div className="flex items-center gap-2 text-[10px] font-medium font-mono">
            <span className="text-text-tertiary uppercase text-[9px]">{label}</span>
            <span className={`font-bold ${color}`}>{value}</span>
        </div>
    );
}

