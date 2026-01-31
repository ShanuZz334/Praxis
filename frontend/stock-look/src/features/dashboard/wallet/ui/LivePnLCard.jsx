import React from "react";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";

export default function LivePnLCard({ pnl }) {
    const isProfit = pnl.net >= 0;
    const color = isProfit ? "#10b981" : "#ef4444";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-background-card-primary border border-border-subtle-faint rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.45)]">

            {/* LEFT: DETAILED P&L BREAKDOWN */}
            <div className="p-6 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col justify-between">

                {/* HEADLINE */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold text-white/40 uppercase tracking-widest">Today's Realized P&L</div>
                        <div className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-mono text-white/60">
                            INTRADAY
                        </div>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className={`text-4xl font-bold tracking-tighter ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isProfit ? '+' : ''}₹{pnl.net.toLocaleString()}
                        </span>
                        <span className={`text-sm font-bold ${isProfit ? 'text-emerald-500/60' : 'text-red-500/60'}`}>
                            {pnl.todayPct}%
                        </span>
                    </div>
                    <div className="text-[10px] text-white/30 mt-1 font-medium">
                        Net after charges.
                    </div>
                </div>

                {/* BREAKDOWN GRID */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <MetricBox label="Gross P&L" value={`₹${pnl.gross}`} accent="text-white" />
                    <MetricBox label="Charges & Slip" value={`-₹${pnl.charges}`} accent="text-red-400/80" />

                    <MetricBox
                        label="Win Contribution"
                        value={`+₹${pnl.winContribution}`}
                        accent="text-emerald-400"
                        subtext="From Winners"
                    />
                    <MetricBox
                        label="Loss Drag"
                        value={`₹${pnl.lossContribution}`}
                        accent="text-red-400"
                        subtext="From Losers"
                    />
                </div>
            </div>

            {/* RIGHT: EQUITY CURVE ANALYTICS */}
            <div className="p-6 bg-black/10 relative flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Equity Curve (7D)</div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-white">₹{pnl.weekly.toLocaleString()}</span>
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 rounded border border-emerald-500/20">
                                +{((pnl.weekly / 70000) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <MiniStat label="Max DD" value={`${pnl.stats7D.maxDrawdown}%`} color="text-red-400" />
                        <MiniStat label="Best Day" value={`+₹${pnl.stats7D.bestDay}`} color="text-emerald-400" />
                    </div>
                </div>

                {/* CHART */}
                <div className="flex-1 min-h-[100px] -ml-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={pnl.equityCurve}>
                            <defs>
                                <linearGradient id="gradientEq" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.1} />
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
        <div className="bg-white/[0.03] border border-white/5 p-3 rounded-lg flex flex-col justify-center">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1">{label}</span>
            <span className={`text-lg font-mono font-bold ${accent}`}>{value}</span>
            {subtext && <span className="text-[9px] text-white/20 mt-0.5">{subtext}</span>}
        </div>
    );
}

function MiniStat({ label, value, color }) {
    return (
        <div className="flex items-center gap-2 text-[10px] font-medium">
            <span className="text-slate-500 uppercase">{label}</span>
            <span className={`font-mono ${color}`}>{value}</span>
        </div>
    );
}
