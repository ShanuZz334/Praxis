import React, { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from "recharts";
import { useTheme } from "@/shared/context/ThemeContext";
import { computeJournalStats } from "../engine/journalScoringEngine";

// ---------------------------------------------------------------------------
// SparklineCard — presentational, receives all values via props
// ---------------------------------------------------------------------------
function SparklineCard({ title, value, sub, subColor, subValue, colorTheme, subValueColor, chartData, chartType = 'area', tooltip }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Safe ID for SVG gradients (strip everything except letters/numbers)
    const safeId = title.replace(/[^a-zA-Z0-9]/g, '');

    const colors = {
        emerald: { text: 'text-emerald-400', stroke: '#34d399', fill: '#34d399', subText: 'text-emerald-500' },
        amber:   { text: 'text-amber-400',   stroke: '#fbbf24', fill: '#fbbf24', subText: 'text-amber-500' },
        blue:    { text: 'text-blue-400',     stroke: '#60a5fa', fill: '#60a5fa', subText: 'text-blue-500' },
        purple:  { text: 'text-purple-400',   stroke: '#c084fc', fill: '#c084fc', subText: 'text-purple-500' },
        red:     { text: 'text-red-400',      stroke: '#f87171', fill: '#f87171', subText: 'text-red-500' },
        cyan:    { text: 'text-cyan-400',     stroke: '#22d3ee', fill: '#22d3ee', subText: 'text-cyan-500' },
    };
    const c = colors[colorTheme] || colors.emerald;

    const maxVal = chartData?.length ? Math.max(...chartData.map(d => Math.abs(d.value))) : 1;

    return (
        <div className="relative bg-background-card border border-border-default rounded-xl p-4 md:p-5 shadow-lg flex flex-col justify-between overflow-hidden group hover:border-border-hover hover:-translate-y-1 transition-all duration-300 min-h-[140px] transform-gpu will-change-transform">
            {/* Top Label */}
            <div className={`mb-2 relative z-10 ${isDark ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : ''}`}>
                <span className="text-[10px] md:text-[11px] font-bold text-text-secondary uppercase tracking-widest leading-tight">{title}</span>
            </div>

            {/* Primary Value + Sub-label row */}
            <div className={`relative z-10 flex flex-col mb-6 ${isDark ? 'drop-shadow-[0_4px_10px_rgba(0,0,0,1)]' : ''}`}>
                <div className={`text-2xl md:text-3xl font-black tracking-tight ${c.text} mb-1 font-mono`}>
                    {value}
                </div>
                <div className="flex justify-between items-center">
                    <span className={`text-[10px] md:text-xs ${subColor || 'text-text-tertiary'} ${isDark ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,1)]' : ''}`}>{sub}</span>
                    {subValue && (
                        <span className={`text-[10px] md:text-xs font-semibold ${subValueColor || c.subText} ${isDark ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,1)]' : ''}`}>{subValue}</span>
                    )}
                </div>
            </div>

            {/* Sparkline Chart — sits behind text, fades in on hover */}
            <div className="absolute bottom-0 left-0 right-0 h-16 md:h-20 opacity-60 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'area' ? (
                        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`color-${safeId}`} x1="0" y1="0" x2="0" y2="1">
                                    {isDark ? (
                                        <>
                                            <stop offset="0%"   stopColor="#000000" stopOpacity={0.5}/>
                                            <stop offset="100%" stopColor="#000000" stopOpacity={0.9}/>
                                        </>
                                    ) : (
                                        <>
                                            <stop offset="5%"  stopColor={c.fill} stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor={c.fill} stopOpacity={0}/>
                                        </>
                                    )}
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={c.stroke}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#color-${safeId})`}
                                isAnimationActive={true}
                            />
                        </AreaChart>
                    ) : (
                        <BarChart data={chartData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
                            <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                                {chartData?.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.value === maxVal && maxVal > 0 ? c.fill : c.fill}
                                        opacity={entry.value === maxVal && maxVal > 0 ? 1 : 0.4}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// JournalHeader — consumes real dayMap, computes via institutional engine
// ---------------------------------------------------------------------------
export default function JournalHeader({ dayMap }) {
    const stats = useMemo(() => {
        if (!dayMap) return null;

        // Extract only days with actual trading activity (profit or loss)
        // sorted ascending by date for cumulative curve accuracy
        const tradingDays = Object.entries(dayMap)
            .filter(([_, d]) => d.state === 'profit' || d.state === 'loss')
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .map(([date, d]) => ({ date, pnl: d.pnl ?? 0, tradesCount: d.tradesCount ?? 1 }));

        return computeJournalStats(tradingDays);
    }, [dayMap]);

    if (!stats) return null;

    const {
        netPnl, winRate, winDays, totalTradingDays,
        grossProfit, grossLoss,
        profitFactor, expectancy,
        bestDayPnl, activeDays, totalTrades,
        charts,
    } = stats;

    // ── Formatting helpers ──────────────────────────────────────────────────
    const fmtINR = (val) =>
        `₹${Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const fmtINRShort = (val) => {
        const abs = Math.abs(val);
        if (abs >= 1_00_000) return `₹${(abs / 1_00_000).toFixed(2)}L`;
        if (abs >= 1_000)   return `₹${(abs / 1_000).toFixed(1)}K`;
        return `₹${abs.toFixed(0)}`;
    };

    // ── Net P&L ────────────────────────────────────────────────────────────
    const pnlSign        = netPnl >= 0 ? '+' : '-';
    const pnlColorTheme  = netPnl >= 0 ? 'emerald' : 'red';
    const pnlFormatted   = fmtINR(netPnl);

    // Profit Factor display — clamp Infinity to "∞" symbol
    const pfDisplay = profitFactor >= 99
        ? '∞'
        : profitFactor.toFixed(2);

    // Expectancy — positive is good (per trading day in ₹)
    const expSign        = expectancy >= 0 ? '+' : '-';
    const expColorTheme  = expectancy >= 0 ? 'emerald' : 'red';

    // Best day
    const bestDayDisplay = bestDayPnl > 0 ? `+${fmtINR(bestDayPnl)}` : fmtINR(0);

    // Win rate — institutional threshold: >55% is profitable, >65% is elite
    const winRateQuality = winRate >= 65 ? 'emerald' : winRate >= 55 ? 'amber' : winRate > 0 ? 'red' : 'amber';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. NET P&L (YTD) — Cumulative realised PnL for the selected year */}
            <SparklineCard
                title="Net P&L (YTD)"
                value={`${pnlSign}${pnlFormatted}`}
                sub="Year to Date"
                subColor="!text-blue-500"
                subValue={totalTradingDays > 0
                    ? `${grossProfit > 0 ? '+' : ''}${fmtINRShort(grossProfit)} / ${fmtINRShort(-grossLoss)}`
                    : null}
                subValueColor="!text-blue-500"
                colorTheme={pnlColorTheme}
                chartData={charts.pnlCurve}
            />

            {/* 2. WIN RATE — Day-level win rate (not trade level) */}
            <SparklineCard
                title="Win Rate"
                value={`${totalTradingDays > 0 ? winRate.toFixed(1) : '0.0'}%`}
                sub={`${winDays} W / ${totalTradingDays - winDays} L`}
                subValue={totalTradingDays > 0 ? `${totalTradingDays} Days` : null}
                colorTheme={winRateQuality}
                chartData={charts.winRateCurve}
            />

            {/* 3. PROFIT FACTOR — Gross Profit ÷ Gross Loss (PF > 2 = institutional grade) */}
            <SparklineCard
                title="Profit Factor"
                value={pfDisplay}
                sub="Gross Profit / Gross Loss"
                subValue={profitFactor > 0 && profitFactor < 99
                    ? (profitFactor >= 2 ? '🟢 Institutional' : profitFactor >= 1 ? '🟡 Profitable' : '🔴 Negative')
                    : null}
                colorTheme="blue"
                chartData={charts.pfCurve}
            />

            {/* 4. EXPECTANCY — (WinRate × AvgWin) − (LossRate × AvgLoss) per trading day */}
            <SparklineCard
                title="Expectancy"
                value={totalTradingDays > 0
                    ? `${expSign}${fmtINR(expectancy)}`
                    : '+₹0'}
                sub="Per Trading Day"
                subValue={totalTradingDays > 0
                    ? `${totalTrades} Trades`
                    : null}
                colorTheme={expColorTheme}
                chartData={charts.expectancyCurve}
            />

            {/* 5. BEST DAY — Peak single-day realised PnL */}
            <SparklineCard
                title="Best Day"
                value={bestDayDisplay}
                sub="Peak Performance"
                subValue={totalTradingDays > 0
                    ? `Worst: ${fmtINRShort(stats.worstDayPnl)}`
                    : null}
                colorTheme="purple"
                chartData={charts.bestDayCurve}
            />

            {/* 6. ACTIVE DAYS — Count of days with real trade activity */}
            <SparklineCard
                title="Active Days"
                value={activeDays.toString()}
                sub="Market Engagement"
                subValue={totalTrades > 0
                    ? `${(totalTrades / Math.max(activeDays, 1)).toFixed(1)} trades/day`
                    : null}
                colorTheme="cyan"
                chartType="bar"
                chartData={charts.activeDayCurve}
            />
        </div>
    );
}
