/**
 * @file BacktestEquityCurve.jsx
 * @purpose Bottom strip displaying cumulative equity progression, drawdown underlay, and trade-by-trade progression.
 * @date 2026-09-12
 */

import React, { useState } from 'react';
import { TrendingUp, ShieldAlert, ArrowUpRight, DollarSign, Percent } from 'lucide-react';

export default function BacktestEquityCurve({
    equityCurve = [],
    initialCapital = 100000,
    endingCapital = 100000,
    maxDrawdownPct = 0
}) {
    const [viewMode, setViewMode] = useState('EQUITY'); // 'EQUITY' | 'PERCENT'
    const [hoveredPoint, setHoveredPoint] = useState(null);

    if (!equityCurve || equityCurve.length < 2) {
        return (
            <div className="h-[110px] bg-background-card border-t border-border-subtle px-4 flex items-center justify-center text-xs text-text-tertiary">
                <span>Equity curve will populate once backtest simulation executes.</span>
            </div>
        );
    }

    const n = equityCurve.length;
    const initialCap = initialCapital || 100000;

    // Numerical bounds spanning both Strategy and Buy & Hold Benchmark
    const allStrategyVals = equityCurve.map(p => viewMode === 'EQUITY' ? p.equity : p.pnlPct);
    const allBenchVals = equityCurve.map(p => {
        const b = p.benchmarkEquity || initialCap;
        return viewMode === 'EQUITY' ? b : ((b - initialCap) / initialCap) * 100;
    });
    const combinedVals = [...allStrategyVals, ...allBenchVals];

    const minVal = Math.min(...combinedVals);
    const maxVal = Math.max(...combinedVals);
    const range = maxVal - minVal || 1;

    const minEquity = Math.min(...equityCurve.map(p => p.equity));
    const maxEquity = Math.max(...equityCurve.map(p => p.equity));
    const minPct = Math.min(...equityCurve.map(p => p.pnlPct));
    const maxPct = Math.max(...equityCurve.map(p => p.pnlPct));

    const width = 800;
    const height = 65;

    // Baseline value & Y coordinate (initialCapital for EQUITY, 0 for PERCENT)
    const baselineVal = viewMode === 'EQUITY' ? initialCap : 0;
    const baselineY = height - ((baselineVal - minVal) / range) * (height - 14) - 7;

    // Strategy SVG Points
    const points = equityCurve.map((d, i) => {
        const x = (i / (n - 1)) * width;
        const val = viewMode === 'EQUITY' ? d.equity : d.pnlPct;
        const y = height - ((val - minVal) / range) * (height - 14) - 7;
        return { x, y, data: d };
    });

    // Buy & Hold Benchmark SVG Points
    const benchPoints = equityCurve.map((d, i) => {
        const x = (i / (n - 1)) * width;
        const benchEq = d.benchmarkEquity || initialCap;
        const val = viewMode === 'EQUITY' ? benchEq : ((benchEq - initialCap) / initialCap) * 100;
        const y = height - ((val - minVal) / range) * (height - 14) - 7;
        return { x, y };
    });

    const pathString = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
    const fillString = `${pathString} L ${width} ${height} L 0 ${height} Z`;
    const benchPathString = benchPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

    const netReturnPct = Math.round(((endingCapital - initialCap) / initialCap) * 1000) / 10;

    return (
        <div className="h-[110px] w-full max-w-full bg-background-card/95 backdrop-blur-md border-t border-border-subtle px-3 sm:px-4 py-2 flex items-center justify-between gap-3 relative z-40 select-none overflow-visible">
            {/* Left: Summary Metrics (switches based on viewMode) */}
            <div className="flex items-center gap-5 min-w-[230px]">
                <div>
                    <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider block">
                        {viewMode === 'EQUITY' ? 'Account Progression' : 'Cumulative % Return'}
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                        {viewMode === 'EQUITY' ? (
                            <>
                                <span className="text-xl font-black font-mono text-text-primary">
                                    ₹{endingCapital.toLocaleString('en-IN')}
                                </span>
                                <span className={`text-xs font-bold font-mono ${
                                    netReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                    {netReturnPct >= 0 ? '+' : ''}{netReturnPct}%
                                </span>
                            </>
                        ) : (
                            <>
                                <span className={`text-xl font-black font-mono ${
                                    netReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                    {netReturnPct >= 0 ? '+' : ''}{netReturnPct}%
                                </span>
                                <span className="text-xs font-bold font-mono text-text-tertiary">
                                    (₹{endingCapital.toLocaleString('en-IN')})
                                </span>
                            </>
                        )}
                    </div>
                    <span className="text-[9px] font-mono text-text-muted block mt-0.5">
                        {viewMode === 'EQUITY' 
                            ? `Net PnL: ${endingCapital >= initialCap ? '+' : ''}₹${(endingCapital - initialCap).toLocaleString('en-IN')}`
                            : `Max DD: -${maxDrawdownPct}% • Initial: ₹${initialCap.toLocaleString('en-IN')}`}
                    </span>
                </div>

                <div className="border-l border-border-subtle pl-4 hidden sm:block">
                    <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider block">Max Drawdown</span>
                    <span className="text-sm font-bold font-mono text-rose-400 mt-0.5 block">
                        -{maxDrawdownPct}%
                    </span>
                </div>
            </div>

            {/* Center: Interactive SVG Curve with Watermark & Y-Axis Scale */}
            <div className="flex-1 min-w-0 relative h-full flex items-center gap-1.5">
                <div className="flex-1 min-w-0 relative h-[70px]">
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-full overflow-visible"
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={netReturnPct >= 0 ? '#10b981' : '#f43f5e'} stopOpacity="0.25" />
                                <stop offset="100%" stopColor={netReturnPct >= 0 ? '#10b981' : '#f43f5e'} stopOpacity="0.0" />
                            </linearGradient>
                        </defs>

                        {/* Area Fill */}
                        <path d={fillString} fill="url(#equityGrad)" />

                        {/* Baseline Reference Line (0% in PERCENT mode, initialCapital in EQUITY mode) */}
                        {baselineY >= 0 && baselineY <= height && (
                            <g>
                                <line
                                    x1="0"
                                    y1={baselineY}
                                    x2={width}
                                    y2={baselineY}
                                    stroke="rgba(148, 163, 184, 0.25)"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x="6"
                                    y={baselineY > 15 ? baselineY - 3 : baselineY + 10}
                                    fill="#94a3b8"
                                    fontSize="8"
                                    fontFamily="monospace"
                                    fontWeight="bold"
                                >
                                    {viewMode === 'EQUITY' ? `Base: ₹${initialCap.toLocaleString('en-IN')}` : 'Base: 0.0%'}
                                </text>
                            </g>
                        )}

                        {/* Benchmark Buy & Hold Overlay Line */}
                        <path
                            d={benchPathString}
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                            opacity="0.6"
                        />

                        {/* Strategy Stroke Line */}
                        <path
                            d={pathString}
                            fill="none"
                            stroke={netReturnPct >= 0 ? '#10b981' : '#f43f5e'}
                            strokeWidth="2"
                        />

                        {/* Hover dot */}
                        {hoveredPoint && (
                            <circle
                                cx={hoveredPoint.x}
                                cy={hoveredPoint.y}
                                r="4.5"
                                fill="#ffffff"
                                stroke="#3b82f6"
                                strokeWidth="2.5"
                            />
                        )}
                    </svg>

                    {/* Hover overlay crosshair zones */}
                    <div className="absolute inset-0 flex">
                        {points.map((p, i) => (
                            <div
                                key={i}
                                className="flex-1 h-full cursor-crosshair"
                                onMouseEnter={() => setHoveredPoint(p)}
                                onMouseLeave={() => setHoveredPoint(null)}
                            />
                        ))}
                    </div>

                    {/* Tooltip on hover */}
                    {hoveredPoint && (
                        <div
                            className="absolute bottom-full mb-2 pointer-events-none bg-background-surface/95 backdrop-blur-md border border-border-default rounded-lg px-2.5 py-1.5 shadow-2xl text-[10px] font-mono z-50 whitespace-nowrap"
                            style={{ left: `${(hoveredPoint.x / width) * 100}%`, transform: 'translateX(-50%)' }}
                        >
                            <div className="text-[9px] text-text-tertiary flex items-center justify-between gap-3 mb-1 border-b border-border-subtle/60 pb-0.5">
                                <span>{hoveredPoint.data.tradeIndex ? `Trade #${hoveredPoint.data.tradeIndex}` : 'Initial Baseline'}</span>
                                {hoveredPoint.data.outcome && (
                                    <span className={hoveredPoint.data.outcome === 'WIN' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                        {hoveredPoint.data.outcome}
                                    </span>
                                )}
                            </div>
                            {viewMode === 'EQUITY' ? (
                                <>
                                    <div className="text-text-primary font-bold text-xs">
                                        ₹{hoveredPoint.data.equity.toLocaleString('en-IN')}
                                    </div>
                                    <div className="text-text-secondary text-[9px] mt-0.5">
                                        Strategy: <span className={hoveredPoint.data.pnlPct >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                            {hoveredPoint.data.pnlPct >= 0 ? '+' : ''}{hoveredPoint.data.pnlPct}%
                                        </span>
                                    </div>
                                    <div className="text-text-tertiary text-[9px] mt-0.5">
                                        Buy & Hold: <span className="font-bold text-slate-300">
                                            ₹{(hoveredPoint.data.benchmarkEquity || initialCap).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={`font-bold text-xs ${hoveredPoint.data.pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {hoveredPoint.data.pnlPct >= 0 ? '+' : ''}{hoveredPoint.data.pnlPct}%
                                    </div>
                                    <div className="text-text-secondary text-[9px] mt-0.5">
                                        Equity: ₹{hoveredPoint.data.equity.toLocaleString('en-IN')}
                                    </div>
                                    <div className="text-text-tertiary text-[9px] mt-0.5">
                                        Buy & Hold: <span className="font-bold text-slate-300">
                                            {Math.round((((hoveredPoint.data.benchmarkEquity || initialCap) - initialCap) / initialCap) * 1000) / 10 >= 0 ? '+' : ''}
                                            {Math.round((((hoveredPoint.data.benchmarkEquity || initialCap) - initialCap) / initialCap) * 1000) / 10}%
                                        </span>
                                    </div>
                                </>
                            )}
                            <div className="text-rose-400 text-[9px] mt-0.5">
                                Drawdown: -{hoveredPoint.data.drawdown}%
                            </div>
                            {/* Downward indicator caret */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-background-surface border-r border-b border-border-default" />
                        </div>
                    )}
                </div>

                {/* Y-Axis Scale Legend (Toggles dynamically between ₹ and %) */}
                <div className="flex flex-col justify-between h-[65px] text-[9px] font-mono select-none px-2 py-0.5 border-l border-border-subtle/80 bg-background-surface/30 rounded-r-lg shrink-0 w-[78px] text-right">
                    <div className="text-emerald-400 font-bold truncate" title="Peak Value">
                        {viewMode === 'EQUITY' ? `₹${Math.round(maxEquity).toLocaleString('en-IN')}` : `${maxPct >= 0 ? '+' : ''}${Math.round(maxPct * 10) / 10}%`}
                    </div>
                    <div className="text-text-muted font-bold truncate" title="Starting Baseline">
                        {viewMode === 'EQUITY' ? `₹${initialCap.toLocaleString('en-IN')}` : `0.0%`}
                    </div>
                    <div className={`font-bold truncate ${minVal < baselineVal ? 'text-rose-400' : 'text-text-tertiary'}`} title="Trough Value">
                        {viewMode === 'EQUITY' ? `₹${Math.round(minEquity).toLocaleString('en-IN')}` : `${minPct >= 0 ? '+' : ''}${Math.round(minPct * 10) / 10}%`}
                    </div>
                </div>
            </div>

            {/* Right: View Mode Toggle & Legend */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
                {/* Toggle Tabs */}
                <div className="flex items-center gap-1 bg-background-surface p-1 rounded-lg border border-border-subtle">
                    <button
                        onClick={() => setViewMode('EQUITY')}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                            viewMode === 'EQUITY'
                                ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                                : 'text-text-tertiary hover:text-text-primary border border-transparent'
                        }`}
                        title="Display cumulative account equity progression in INR"
                    >
                        ₹ Equity
                    </button>
                    <button
                        onClick={() => setViewMode('PERCENT')}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                            viewMode === 'PERCENT'
                                ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                                : 'text-text-tertiary hover:text-text-primary border border-transparent'
                        }`}
                        title="Display cumulative percentage return and baseline"
                    >
                        % Return
                    </button>
                </div>
                {/* Legend row */}
                <div className="flex items-center gap-3 text-[9px] font-mono text-text-tertiary px-0.5">
                    <span className="flex items-center gap-1">
                        <svg width="16" height="6" viewBox="0 0 16 6"><line x1="0" y1="3" x2="16" y2="3" stroke={netReturnPct >= 0 ? '#10b981' : '#f43f5e'} strokeWidth="2" strokeLinecap="round"/></svg>
                        Strategy
                    </span>
                    <span className="flex items-center gap-1">
                        <svg width="16" height="6" viewBox="0 0 16 6"><line x1="0" y1="3" x2="16" y2="3" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2"/></svg>
                        Buy &amp; Hold
                    </span>
                </div>
            </div>
        </div>
    );
}
