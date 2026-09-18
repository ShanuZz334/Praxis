/**
 * @file OptionsOiAnalysisChart.jsx
 * @purpose Top-tier Institutional Open Interest, Change in OI, Strike PCR, and Max Pain analysis chart
 * with live Upstox integration, multi-mode contextual intelligence ribbon, and light/dark theme optimization.
 */

import React, { useState, useMemo } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ReferenceLine,
    Cell
} from 'recharts';
import {
    Layers,
    TrendingUp,
    Scale,
    Target,
    Activity,
    RotateCw,
    Info,
    ShieldCheck,
    ArrowUpRight,
    ArrowDownRight,
    Compass
} from 'lucide-react';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import { useTheme } from '@/shared/context/ThemeContext';
import { toast } from 'sonner';

export default function OptionsOiAnalysisChart({
    chain = [],
    chainData = [],
    spotPrice = 0,
    selectedExpiry: propExpiry = '',
    onAddChart,
    onRefresh,
    loading = false,
    isLoading = false
}) {
    const context = useDashboardContext();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const selectedExpiry = propExpiry || context?.selectedExpiry || '';
    const activeChain = (chain && chain.length > 0) ? chain : (chainData || []);

    // Active tab state: 'OI' | 'CHG_OI' | 'PCR' | 'MAX_PAIN'
    const [activeTab, setActiveTab] = useState('CHG_OI');
    // Strike range limit around ATM (default 15 strikes either side)
    const [strikeRange, setStrikeRange] = useState(15);
    // Last refreshed timestamp
    const [lastUpdatedTime, setLastUpdatedTime] = useState(() => new Date());

    const handleManualRefresh = () => {
        setLastUpdatedTime(new Date());
        if (onRefresh) {
            onRefresh();
        }
        toast.info("Refreshed live options chain data", { id: 'oi-refresh' });
    };

    // Format expiry date for footer
    const formattedExpiry = useMemo(() => {
        if (!selectedExpiry) return 'Current Expiry';
        const d = new Date(selectedExpiry);
        if (isNaN(d.getTime())) return selectedExpiry;
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }, [selectedExpiry]);

    // Format Indian Lakhs / Crores for Y Axis and tooltips
    const formatOiLakhs = (val) => {
        if (val === undefined || val === null || isNaN(val)) return '0 L';
        const absVal = Math.abs(val);
        if (absVal >= 10000000) {
            return `${(val / 10000000).toFixed(1)} Cr`;
        }
        return `${(val / 100000).toFixed(1)} L`;
    };

    const formatFullOiLakhs = (val) => {
        if (val === undefined || val === null || isNaN(val)) return '0.00 L';
        const inLakhs = val / 100000;
        return `${inLakhs.toFixed(2)} L`;
    };

    // 1. Process and filter chain data centered around spot price
    const chartData = useMemo(() => {
        if (!activeChain || activeChain.length === 0) return [];

        // Sort ascending by strike
        const sorted = [...activeChain].sort((a, b) => a.strike - b.strike);
        
        // Find ATM index
        let atmIndex = sorted.findIndex(r => r.strike >= spotPrice);
        if (atmIndex === -1) atmIndex = Math.floor(sorted.length / 2);

        // Slice around ATM
        const start = Math.max(0, atmIndex - strikeRange);
        const end = Math.min(sorted.length, atmIndex + strikeRange + 1);
        const sliced = sorted.slice(start, end);

        // Precompute cumulative Max Pain for all strikes in the chain
        let minPain = Infinity;
        let calculatedMaxPainStrike = sorted[Math.floor(sorted.length / 2)]?.strike;

        const maxPainMap = {};
        sorted.forEach(target => {
            const K = target.strike;
            let currentCallPain = 0;
            let currentPutPain = 0;
            sorted.forEach(row => {
                if (K > row.strike && row.call?.oi) {
                    currentCallPain += (K - row.strike) * row.call.oi;
                }
                if (K < row.strike && row.put?.oi) {
                    currentPutPain += (row.strike - K) * row.put.oi;
                }
            });
            const totalPain = currentCallPain + currentPutPain;
            maxPainMap[K] = { callPain: currentCallPain, putPain: currentPutPain, totalPain };
            
            if (totalPain < minPain) {
                minPain = totalPain;
                calculatedMaxPainStrike = K;
            }
        });

        return sliced.map(row => {
            const callOi = row.call?.oi || 0;
            const putOi = row.put?.oi || 0;
            const callOiChg = row.call?.oiChg || 0;
            const putOiChg = row.put?.oiChg || 0;
            const pcr = callOi > 0 ? Number((putOi / callOi).toFixed(2)) : 0;
            
            const painData = maxPainMap[row.strike] || { callPain: 0, putPain: 0, totalPain: 0 };

            return {
                strike: row.strike,
                strikeStr: row.strike.toLocaleString('en-IN'),
                callOi,
                putOi,
                callOiChg,
                putOiChg,
                pcr,
                callPain: painData.callPain,
                putPain: painData.putPain,
                cumulativePain: painData.totalPain,
                isMaxPain: row.strike === calculatedMaxPainStrike,
                callData: row.call,
                putData: row.put,
                raw: row
            };
        });
    }, [activeChain, spotPrice, strikeRange]);

    // Find the closest strike to the spot price for the reference line
    const closestSpotStrike = useMemo(() => {
        if (!chartData || chartData.length === 0) return null;
        let closest = chartData[0];
        let minDiff = Math.abs(chartData[0].strike - spotPrice);
        chartData.forEach(item => {
            const diff = Math.abs(item.strike - spotPrice);
            if (diff < minDiff) {
                minDiff = diff;
                closest = item;
            }
        });
        return closest ? closest.strikeStr : null;
    }, [chartData, spotPrice]);

    // Derived high-level institutional summaries for active mode context banner
    const modeSummary = useMemo(() => {
        if (!chartData || chartData.length === 0) return null;

        let totalCallOi = 0;
        let totalPutOi = 0;
        let maxCallOiItem = chartData[0];
        let maxPutOiItem = chartData[0];

        let topCallAdd = chartData[0];
        let topPutAdd = chartData[0];
        let topCallUnwind = chartData[0];
        let topPutUnwind = chartData[0];
        let netCallChg = 0;
        let netPutChg = 0;

        let maxPcrItem = chartData[0];
        let minPcrItem = chartData[0];

        let maxPainItem = chartData.find(d => d.isMaxPain) || chartData[0];

        chartData.forEach(d => {
            totalCallOi += d.callOi;
            totalPutOi += d.putOi;
            if (d.callOi > maxCallOiItem.callOi) maxCallOiItem = d;
            if (d.putOi > maxPutOiItem.putOi) maxPutOiItem = d;

            netCallChg += d.callOiChg;
            netPutChg += d.putOiChg;
            if (d.callOiChg > topCallAdd.callOiChg) topCallAdd = d;
            if (d.putOiChg > topPutAdd.putOiChg) topPutAdd = d;
            if (d.callOiChg < topCallUnwind.callOiChg) topCallUnwind = d;
            if (d.putOiChg < topPutUnwind.putOiChg) topPutUnwind = d;

            if (d.pcr > maxPcrItem.pcr) maxPcrItem = d;
            if (d.pcr > 0 && (minPcrItem.pcr === 0 || d.pcr < minPcrItem.pcr)) minPcrItem = d;
        });

        const atmItem = closestSpotStrike ? chartData.find(d => d.strikeStr === closestSpotStrike) : chartData[0];
        const overallPcr = totalCallOi > 0 ? (totalPutOi / totalCallOi).toFixed(2) : '1.00';
        const maxPainDiff = spotPrice ? (maxPainItem.strike - spotPrice) : 0;
        const maxPainPct = spotPrice ? (((maxPainItem.strike - spotPrice) / spotPrice) * 100).toFixed(2) : '0.00';

        return {
            totalCallOi,
            totalPutOi,
            maxCallOiStrike: maxCallOiItem.strike,
            maxCallOiVal: maxCallOiItem.callOi,
            maxPutOiStrike: maxPutOiItem.strike,
            maxPutOiVal: maxPutOiItem.putOi,
            overallPcr,

            topCallAddStrike: topCallAdd.strike,
            topCallAddVal: topCallAdd.callOiChg,
            topPutAddStrike: topPutAdd.strike,
            topPutAddVal: topPutAdd.putOiChg,
            topCallUnwindStrike: topCallUnwind.callOiChg < 0 ? topCallUnwind.strike : null,
            topCallUnwindVal: topCallUnwind.callOiChg < 0 ? topCallUnwind.callOiChg : 0,
            topPutUnwindStrike: topPutUnwind.putOiChg < 0 ? topPutUnwind.strike : null,
            topPutUnwindVal: topPutUnwind.putOiChg < 0 ? topPutUnwind.putOiChg : 0,
            netCallChg,
            netPutChg,

            atmPcr: atmItem ? atmItem.pcr : 1.0,
            maxPcrStrike: maxPcrItem.strike,
            maxPcrVal: maxPcrItem.pcr,
            minPcrStrike: minPcrItem.strike,
            minPcrVal: minPcrItem.pcr,

            maxPainStrike: maxPainItem.strike,
            maxPainDiff,
            maxPainPct
        };
    }, [chartData, spotPrice, closestSpotStrike]);

    // Configuration for the 4 core modes
    const MODES = [
        {
            id: 'OI',
            label: 'Total OI',
            title: 'Open Interest Distribution',
            badge: 'Key Resistance & Support',
            icon: Layers,
            help: 'Total active contracts across strikes. Call OI peaks act as Resistance; Put OI peaks act as Support.'
        },
        {
            id: 'CHG_OI',
            label: 'OI Change',
            title: 'Intraday Buildup & Unwind',
            badge: 'Institutional Flow',
            icon: TrendingUp,
            help: 'Net intraday contract shifts. Above 0 = Fresh Writing (+); Below 0 = Position Unwinding / Covering (-).'
        },
        {
            id: 'PCR',
            label: 'Strike PCR',
            title: 'Strike-wise Put-Call Ratio',
            badge: 'Sentiment Heatmap',
            icon: Scale,
            help: 'Put/Call contract ratio per strike. PCR > 1.2 = Bullish Support Floor; PCR < 0.7 = Bearish Resistance Ceiling.'
        },
        {
            id: 'MAX_PAIN',
            label: 'Max Pain',
            title: 'Option Writer Pain Curve',
            badge: 'Expiry Pin Target',
            icon: Target,
            help: 'Cumulative option writer payout loss across strikes. Identifies the strike where writers lose least money.'
        }
    ];

    // Theme color constants for Recharts elements
    const gridStroke = isLight ? '#E2E8F0' : '#1b2438';
    const axisStroke = isLight ? '#94A3B8' : '#64748b';
    const tickFill = isLight ? '#475569' : '#94a3b8';
    const lineStroke = isLight ? '#CBD5E1' : '#334155';
    const spotStroke = isLight ? '#2563eb' : '#38bdf8';
    const spotLabelFill = isLight ? '#1d4ed8' : '#38bdf8';
    const zeroLineStroke = isLight ? '#64748b' : '#64748b';

    // Custom Interactive Tooltip that displays comprehensive live metrics
    const CustomInteractiveTooltip = ({ active, payload }) => {
        if (!active || !payload || payload.length === 0) return null;
        const activeItem = payload[0].payload;
        const distFromSpot = spotPrice ? (activeItem.strike - spotPrice) : 0;
        const distPct = spotPrice ? ((distFromSpot / spotPrice) * 100).toFixed(2) : '0.00';

        return (
            <div className={`backdrop-blur-xl border rounded-xl p-3.5 shadow-2xl min-w-[310px] pointer-events-auto z-50 text-xs transition-all ${
                isLight 
                    ? 'bg-white/98 border-slate-200 shadow-slate-300/50 text-slate-800' 
                    : 'bg-[#0f1523]/95 border-white/15 shadow-black/80 text-white'
            }`}>
                {/* Header: Strike, Moneyness & Distance */}
                <div className={`flex items-center justify-between gap-3 border-b pb-2 mb-2.5 ${
                    isLight ? 'border-slate-100' : 'border-white/10'
                }`}>
                    <div>
                        <div className={`font-mono font-black text-sm tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            Strike: ₹{activeItem.strike.toLocaleString('en-IN')}
                        </div>
                        <span className={`text-[10px] font-mono ${
                            distFromSpot > 0 ? (isLight ? 'text-amber-700' : 'text-amber-400') : (isLight ? 'text-emerald-700' : 'text-emerald-400')
                        }`}>
                            {distFromSpot === 0 ? 'ATM (At The Money)' : `${distFromSpot > 0 ? '+' : ''}${distFromSpot.toFixed(1)} pts (${distPct}%)`}
                        </span>
                    </div>
                    <div className="text-right">
                        <div className={`font-mono text-xs font-bold ${
                            activeItem.pcr > 1.2 ? 'text-emerald-500' : activeItem.pcr < 0.7 ? 'text-rose-500' : 'text-purple-400'
                        }`}>
                            PCR: <span className="font-extrabold">{activeItem.pcr}</span>
                        </div>
                        <span className={`text-[9.5px] uppercase font-semibold tracking-wider ${
                            activeItem.pcr > 1.2 ? 'text-emerald-400' : activeItem.pcr < 0.7 ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                            {activeItem.pcr > 1.2 ? 'Bullish Floor' : activeItem.pcr < 0.7 ? 'Bearish Wall' : 'Balanced'}
                        </span>
                    </div>
                </div>

                {/* Metrics Grid: Call vs Put */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    {/* Call Column */}
                    <div className={`flex flex-col gap-1.5 rounded-lg p-2.5 border ${
                        isLight 
                            ? 'bg-blue-50/80 border-blue-200/90 text-slate-800' 
                            : 'bg-blue-950/30 border-blue-500/25 text-slate-200'
                    }`}>
                        <div className={`flex items-center justify-between font-bold text-xs pb-1 border-b ${
                            isLight ? 'text-blue-700 border-blue-200' : 'text-blue-400 border-blue-500/20'
                        }`}>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: '#3874CB' }} />
                                <span>CALL (CE)</span>
                            </div>
                            <span className="text-[10px] text-blue-500/80 font-normal">Resistance</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Total OI:</span>
                            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatFullOiLakhs(activeItem.callOi)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Intraday Chg:</span>
                            <span className={`font-bold ${activeItem.callOiChg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {activeItem.callOiChg >= 0 ? '+' : ''}{formatFullOiLakhs(activeItem.callOiChg)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>LTP:</span>
                            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>₹{activeItem.callData?.ltp?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>

                    {/* Put Column */}
                    <div className={`flex flex-col gap-1.5 rounded-lg p-2.5 border ${
                        isLight 
                            ? 'bg-red-50/80 border-red-200/90 text-slate-800' 
                            : 'bg-red-950/30 border-red-500/25 text-slate-200'
                    }`}>
                        <div className={`flex items-center justify-between font-bold text-xs pb-1 border-b ${
                            isLight ? 'text-red-700 border-red-200' : 'text-red-400 border-red-500/20'
                        }`}>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: '#D33D35' }} />
                                <span>PUT (PE)</span>
                            </div>
                            <span className="text-[10px] text-red-500/80 font-normal">Support</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Total OI:</span>
                            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatFullOiLakhs(activeItem.putOi)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Intraday Chg:</span>
                            <span className={`font-bold ${activeItem.putOiChg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {activeItem.putOiChg >= 0 ? '+' : ''}{formatFullOiLakhs(activeItem.putOiChg)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>LTP:</span>
                            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>₹{activeItem.putData?.ltp?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>
                </div>

                {/* Max Pain Notification if applicable */}
                {activeItem.isMaxPain && (
                    <div className="mt-2 pt-1.5 border-t border-amber-500/30 flex items-center justify-between text-[10px] text-amber-400 font-bold">
                        <span className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-amber-400" />
                            <span>MAX PAIN PIN STRIKE</span>
                        </span>
                        <span className="font-mono text-amber-300">Min Option Writer Loss</span>
                    </div>
                )}
            </div>
        );
    };

    const currentModeObj = MODES.find(m => m.id === activeTab) || MODES[0];

    return (
        <div className="w-full rounded-2xl p-4 md:p-6 shadow-md relative overflow-hidden transition-all duration-300 bg-background-card border border-border-default text-text-primary">
            {/* TOP CONTROL BAR: Segmented Switcher | Center Spot Badge | Strikes Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 relative z-10">
                {/* 1. The 4-Mode Segmented Switcher */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center p-1 rounded-xl border border-border-subtle bg-background-surface">
                        {MODES.map((mode) => {
                            const IconComponent = mode.icon;
                            const isActive = activeTab === mode.id;
                            return (
                                <button
                                    key={mode.id}
                                    onClick={() => setActiveTab(mode.id)}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 relative group ${
                                        isActive
                                            ? 'bg-background-elevated text-text-primary border border-border-default shadow-xs'
                                            : 'text-text-secondary hover:text-text-primary hover:bg-background-surface border border-transparent'
                                    }`}
                                    title={mode.help}
                                >
                                    <IconComponent className={`w-3.5 h-3.5 transition-transform group-hover:scale-105 ${
                                        isActive ? 'text-accent-primary' : 'text-text-tertiary'
                                    }`} />
                                    <span>{mode.label}</span>
                                    {isActive && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-0.5" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Center Spot Price Institutional Badge */}
                <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl border border-border-subtle bg-background-surface">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-text-tertiary">
                            Spot LTP:
                        </span>
                        <span className="text-sm font-mono font-bold tracking-wide text-text-primary">
                            ₹{spotPrice ? spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '24,000.00'}
                        </span>
                    </div>

                    {closestSpotStrike && (
                        <div className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border border-border-default bg-background-elevated text-text-secondary">
                            ATM: {closestSpotStrike}
                        </div>
                    )}
                </div>

                {/* 3. Strike Range Window Selector */}
                <div className="flex items-center gap-2">
                    <span className="text-[10.5px] uppercase font-mono font-bold tracking-wider text-text-tertiary">
                        WINDOW:
                    </span>
                    <div className="flex rounded-xl p-0.5 border border-border-subtle bg-background-surface text-xs font-mono font-bold">
                        {[10, 15, 20].map(cnt => (
                            <button
                                key={cnt}
                                onClick={() => setStrikeRange(cnt)}
                                className={`px-2.5 py-1 rounded-lg transition-all ${
                                    strikeRange === cnt 
                                        ? 'bg-background-elevated text-text-primary border border-border-default shadow-xs'
                                        : 'text-text-secondary hover:text-text-primary'
                                }`}
                                title={`Show ${cnt} strikes above and below ATM`}
                            >
                                ±{cnt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* DYNAMIC CONTEXTUAL INTELLIGENCE RIBBON (Directly clarifies the 4 modes) */}
            <div className="p-3 rounded-xl mb-4 border border-border-subtle bg-background-surface/50 transition-all duration-300 relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Left: Purpose Statement */}
                    <div className="flex items-center gap-2.5 min-w-[280px]">
                        <div className="p-1.5 rounded-lg border border-border-default bg-background-elevated text-text-primary">
                            <currentModeObj.icon className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                    {currentModeObj.title}
                                </span>
                                <span className="text-[9.5px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase bg-background-elevated text-text-tertiary border border-border-subtle">
                                    {currentModeObj.badge}
                                </span>
                            </div>
                            <p className="text-[11px] mt-0.5 line-clamp-1 text-text-secondary">
                                {currentModeObj.help}
                            </p>
                        </div>
                    </div>

                    {/* Right: Instant Mode KPIs */}
                    {modeSummary && (
                        <div className="flex flex-wrap items-center gap-2 md:gap-2.5 text-xs font-mono">
                            {activeTab === 'OI' && (
                                <>
                                    <div className="px-2.5 py-1 rounded-lg bg-background-card border border-border-subtle shadow-2xs">
                                        <span className="text-[10px] text-text-tertiary font-semibold block uppercase">Call Wall (Resistance)</span>
                                        <span className="font-bold text-blue-500">₹{modeSummary.maxCallOiStrike}</span>
                                        <span className="text-[10px] ml-1 text-text-tertiary">({formatOiLakhs(modeSummary.maxCallOiVal)})</span>
                                    </div>
                                    <div className="px-2.5 py-1 rounded-lg bg-background-card border border-border-subtle shadow-2xs">
                                        <span className="text-[10px] text-text-tertiary font-semibold block uppercase">Put Wall (Support)</span>
                                        <span className="font-bold text-rose-500">₹{modeSummary.maxPutOiStrike}</span>
                                        <span className="text-[10px] ml-1 text-text-tertiary">({formatOiLakhs(modeSummary.maxPutOiVal)})</span>
                                    </div>
                                    <div className="px-2.5 py-1 rounded-lg bg-background-card border border-border-subtle shadow-2xs">
                                        <span className="text-[10px] text-text-tertiary font-semibold block uppercase">Total PCR</span>
                                        <span className="font-bold text-text-primary">{modeSummary.overallPcr}</span>
                                        <span className={`text-[10px] ml-1 font-semibold ${Number(modeSummary.overallPcr) > 1.1 ? 'text-emerald-500' : Number(modeSummary.overallPcr) < 0.8 ? 'text-rose-500' : 'text-text-tertiary'}`}>
                                            {Number(modeSummary.overallPcr) > 1.1 ? 'Bullish' : Number(modeSummary.overallPcr) < 0.8 ? 'Bearish' : 'Neutral'}
                                        </span>
                                    </div>
                                </>
                            )}

                            {activeTab === 'CHG_OI' && (
                                <>
                                    <div className="px-2.5 py-1 rounded-lg bg-background-card border border-border-subtle shadow-2xs">
                                        <span className="text-[10px] text-text-tertiary font-semibold block uppercase">Top Call Add (+)</span>
                                        <span className="font-bold text-blue-500">₹{modeSummary.topCallAddStrike}</span>
                                        <span className="text-[10px] ml-1 text-text-tertiary">({formatOiLakhs(modeSummary.topCallAddVal)})</span>
                                    </div>
                                    <div className="px-2.5 py-1 rounded-lg bg-background-card border border-border-subtle shadow-2xs">
                                        <span className="text-[10px] text-text-tertiary font-semibold block uppercase">Top Put Add (+)</span>
                                        <span className="font-bold text-rose-500">₹{modeSummary.topPutAddStrike}</span>
                                        <span className="text-[10px] ml-1 text-text-tertiary">({formatOiLakhs(modeSummary.topPutAddVal)})</span>
                                    </div>
                                    <div className="px-2.5 py-1 rounded-lg bg-background-card border border-border-subtle shadow-2xs">
                                        <span className="text-[10px] text-text-tertiary font-semibold block uppercase">Unwinding (-)</span>
                                        <span className={`font-bold ${modeSummary.topCallUnwindStrike ? 'text-amber-500' : 'text-text-tertiary'}`}>
                                            {modeSummary.topCallUnwindStrike ? `₹${modeSummary.topCallUnwindStrike}` : 'No Major Unwind'}
                                        </span>
                                        {modeSummary.topCallUnwindStrike && (
                                            <span className="text-[10px] ml-1 text-text-tertiary">({formatOiLakhs(modeSummary.topCallUnwindVal)})</span>
                                        )}
                                    </div>
                                </>
                            )}

                            {activeTab === 'PCR' && (
                                <>
                                    <div className="px-2.5 py-1 rounded-lg bg-background-card border border-border-subtle shadow-2xs">
                                        <span className="text-[10px] text-text-tertiary font-semibold block uppercase">ATM Strike PCR</span>
                                        <span className="font-bold text-text-primary">{modeSummary.atmPcr}</span>
                                    </div>
                                    <div className="px-2.5 py-1 rounded-lg bg-background-card border border-border-subtle shadow-2xs">
                                        <span className="text-[10px] text-text-tertiary font-semibold block uppercase">Strongest Floor</span>
                                        <span className="font-bold text-emerald-500">₹{modeSummary.maxPcrStrike}</span>
                                        <span className="text-[10px] ml-1 text-text-tertiary">(PCR {modeSummary.maxPcrVal})</span>
                                    </div>
                                    <div className="px-2.5 py-1 rounded-lg bg-background-card border border-border-subtle shadow-2xs">
                                        <span className="text-[10px] text-text-tertiary font-semibold block uppercase">Strongest Ceiling</span>
                                        <span className="font-bold text-rose-500">₹{modeSummary.minPcrStrike}</span>
                                        <span className="text-[10px] ml-1 text-text-tertiary">(PCR {modeSummary.minPcrVal})</span>
                                    </div>
                                </>
                            )}

                            {activeTab === 'MAX_PAIN' && (
                                <>
                                    <div className="px-2.5 py-1 rounded-lg bg-background-card border border-border-subtle shadow-2xs">
                                        <span className="text-[10px] text-text-tertiary font-semibold block uppercase">Max Pain Pin</span>
                                        <span className="font-bold text-amber-500">₹{modeSummary.maxPainStrike}</span>
                                    </div>
                                    <div className="px-2.5 py-1 rounded-lg bg-background-card border border-border-subtle shadow-2xs">
                                        <span className="text-[10px] text-text-tertiary font-semibold block uppercase">Spot Distance</span>
                                        <span className="font-bold text-text-primary">{modeSummary.maxPainDiff >= 0 ? '+' : ''}{modeSummary.maxPainDiff.toFixed(1)} pts</span>
                                        <span className="text-[10px] ml-1 text-text-tertiary">({modeSummary.maxPainPct}%)</span>
                                    </div>
                                    <div className="px-2.5 py-1 rounded-lg bg-background-card border border-border-subtle shadow-2xs">
                                        <span className="text-[10px] text-text-tertiary font-semibold block uppercase">Pinning Gravity</span>
                                        <span className="font-bold text-text-secondary">
                                            {modeSummary.maxPainDiff > 10 ? 'Bullish Pull (+)' : modeSummary.maxPainDiff < -10 ? 'Bearish Drag (-)' : 'Pinned At ATM'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN CHART AREA */}
            <div className="w-full h-[320px] md:h-[370px] relative z-0">
                {(loading || isLoading || chartData.length === 0) ? (
                    <div className={`w-full h-full flex flex-col items-center justify-center rounded-xl border relative overflow-hidden backdrop-blur-xs ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/25 border-white/5'
                    }`}>
                        <div className="relative flex flex-col items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                                <Activity className={`w-4 h-4 absolute inset-0 m-auto animate-pulse ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <span className={`text-xs font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                    {(loading || isLoading) ? 'Synthesizing Live Options Chain...' : 'Awaiting Options Chain Data...'}
                                </span>
                                <span className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {(loading || isLoading) ? 'Calculating Greeks, Open Interest distribution & Max Pain' : 'Please select an expiry or instrument'}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                        {activeTab === 'OI' ? (
                            /* Total OI Dual Bar Chart */
                            <BarChart
                                data={chartData}
                                margin={{ top: 25, right: 10, left: 10, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                                <XAxis
                                    dataKey="strikeStr"
                                    stroke={axisStroke}
                                    tick={{ fill: tickFill, fontSize: 10, fontFamily: 'monospace' }}
                                    axisLine={{ stroke: lineStroke }}
                                    tickLine={{ stroke: lineStroke }}
                                    interval={Math.floor(chartData.length / 8)}
                                />
                                <YAxis
                                    stroke={axisStroke}
                                    tick={{ fill: tickFill, fontSize: 10, fontFamily: 'monospace' }}
                                    axisLine={{ stroke: lineStroke }}
                                    tickLine={{ stroke: lineStroke }}
                                    tickFormatter={formatOiLakhs}
                                />
                                <Tooltip content={<CustomInteractiveTooltip />} />
                                {closestSpotStrike && (
                                    <ReferenceLine
                                        x={closestSpotStrike}
                                        stroke={spotStroke}
                                        strokeDasharray="4 4"
                                        strokeWidth={1.5}
                                        label={{
                                            value: `Spot: ${spotPrice.toFixed(0)}`,
                                            position: 'top',
                                            fill: spotLabelFill,
                                            fontSize: 10,
                                            fontWeight: 'bold',
                                            offset: 10
                                        }}
                                    />
                                )}
                                <Bar dataKey="callOi" name="Call OI" fill="#3874CB" radius={[3, 3, 0, 0]} maxBarSize={16} isAnimationActive={false} />
                                <Bar dataKey="putOi" name="Put OI" fill="#D33D35" radius={[3, 3, 0, 0]} maxBarSize={16} isAnimationActive={false} />
                            </BarChart>
                        ) : activeTab === 'CHG_OI' ? (
                            /* Change in OI Dual Bar Chart (Supports Negative Unwinding) */
                            <BarChart
                                data={chartData}
                                margin={{ top: 25, right: 10, left: 10, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                                <XAxis
                                    dataKey="strikeStr"
                                    stroke={axisStroke}
                                    tick={{ fill: tickFill, fontSize: 10, fontFamily: 'monospace' }}
                                    axisLine={{ stroke: lineStroke }}
                                    tickLine={{ stroke: lineStroke }}
                                    interval={Math.floor(chartData.length / 8)}
                                />
                                <YAxis
                                    stroke={axisStroke}
                                    tick={{ fill: tickFill, fontSize: 10, fontFamily: 'monospace' }}
                                    axisLine={{ stroke: lineStroke }}
                                    tickLine={{ stroke: lineStroke }}
                                    tickFormatter={formatOiLakhs}
                                />
                                <Tooltip content={<CustomInteractiveTooltip />} />
                                <ReferenceLine y={0} stroke={zeroLineStroke} strokeWidth={1.5} strokeDasharray="2 2" />
                                {closestSpotStrike && (
                                    <ReferenceLine
                                        x={closestSpotStrike}
                                        stroke={spotStroke}
                                        strokeDasharray="4 4"
                                        strokeWidth={1.5}
                                        label={{
                                            value: `Spot: ${spotPrice.toFixed(0)}`,
                                            position: 'top',
                                            fill: spotLabelFill,
                                            fontSize: 10,
                                            fontWeight: 'bold',
                                            offset: 10
                                        }}
                                    />
                                )}
                                <Bar dataKey="callOiChg" name="Call Chg. OI" fill="#3874CB" radius={[2, 2, 2, 2]} maxBarSize={16} isAnimationActive={false}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`call-${index}`} fill={entry.callOiChg >= 0 ? '#3874CB' : '#23497D'} />
                                    ))}
                                </Bar>
                                <Bar dataKey="putOiChg" name="Put Chg. OI" fill="#D33D35" radius={[2, 2, 2, 2]} maxBarSize={16} isAnimationActive={false}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`put-${index}`} fill={entry.putOiChg >= 0 ? '#D33D35' : '#7A2222'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        ) : activeTab === 'PCR' ? (
                            /* Strike-wise PCR Chart */
                            <BarChart
                                data={chartData}
                                margin={{ top: 25, right: 10, left: 10, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                                <XAxis
                                    dataKey="strikeStr"
                                    stroke={axisStroke}
                                    tick={{ fill: tickFill, fontSize: 10, fontFamily: 'monospace' }}
                                    axisLine={{ stroke: lineStroke }}
                                    tickLine={{ stroke: lineStroke }}
                                    interval={Math.floor(chartData.length / 8)}
                                />
                                <YAxis
                                    stroke={axisStroke}
                                    tick={{ fill: tickFill, fontSize: 10, fontFamily: 'monospace' }}
                                    axisLine={{ stroke: lineStroke }}
                                    tickLine={{ stroke: lineStroke }}
                                />
                                <Tooltip content={<CustomInteractiveTooltip />} />
                                <ReferenceLine y={1.0} stroke={isLight ? '#94A3B8' : '#64748B'} strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'PCR 1.0 (Neutral Equilibrium)', fill: isLight ? '#475569' : '#94A3B8', fontSize: 10, fontWeight: 'bold' }} />
                                {closestSpotStrike && (
                                    <ReferenceLine x={closestSpotStrike} stroke={spotStroke} strokeDasharray="4 4" strokeWidth={1.5} />
                                )}
                                <Bar dataKey="pcr" name="Strike PCR" maxBarSize={20} isAnimationActive={false}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`pcr-${index}`}
                                            fill={entry.pcr > 1.2 ? '#059669' : entry.pcr < 0.7 ? '#D33D35' : '#64748B'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        ) : (
                            /* Max Pain Cumulative Loss Chart */
                            <BarChart
                                data={chartData}
                                margin={{ top: 25, right: 10, left: 10, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                                <XAxis
                                    dataKey="strikeStr"
                                    stroke={axisStroke}
                                    tick={{ fill: tickFill, fontSize: 10, fontFamily: 'monospace' }}
                                    axisLine={{ stroke: lineStroke }}
                                    tickLine={{ stroke: lineStroke }}
                                    interval={Math.floor(chartData.length / 8)}
                                />
                                <YAxis
                                    stroke={axisStroke}
                                    tick={{ fill: tickFill, fontSize: 10, fontFamily: 'monospace' }}
                                    axisLine={{ stroke: lineStroke }}
                                    tickLine={{ stroke: lineStroke }}
                                    tickFormatter={formatOiLakhs}
                                />
                                <Tooltip content={<CustomInteractiveTooltip />} />
                                {closestSpotStrike && (
                                    <ReferenceLine x={closestSpotStrike} stroke={spotStroke} strokeDasharray="4 4" strokeWidth={1.5} />
                                )}
                                <Bar dataKey="callPain" stackId="pain" name="Call Writer Loss" maxBarSize={20} isAnimationActive={false}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`call-pain-${index}`}
                                            fill={entry.isMaxPain ? '#D97706' : '#3874CB'}
                                        />
                                    ))}
                                </Bar>
                                <Bar dataKey="putPain" stackId="pain" name="Put Writer Loss" maxBarSize={20} isAnimationActive={false}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`put-pain-${index}`}
                                            fill={entry.isMaxPain ? '#D97706' : '#D33D35'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>

            {/* BOTTOM CONTEXTUAL LEGEND & METADATA ROW */}
            <div className={`flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t text-[11px] ${
                isLight ? 'border-slate-100 text-slate-600' : 'border-white/5 text-slate-400'
            }`}>
                {/* Left Legend — Mode Specific */}
                <div className="flex flex-wrap items-center gap-4">
                    {activeTab === 'MAX_PAIN' ? (
                        <>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#D97706' }} />
                                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Max Pain Strike (Least Writer Loss)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#3874CB' }} />
                                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Call Writer Loss</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#D33D35' }} />
                                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Put Writer Loss</span>
                            </div>
                        </>
                    ) : activeTab === 'PCR' ? (
                        <>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#059669' }} />
                                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{'> 1.2 (Bullish Floor)'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#64748B' }} />
                                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>0.7 – 1.2 (Balanced)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#D33D35' }} />
                                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{'< 0.7 (Bearish Ceiling)'}</span>
                            </div>
                        </>
                    ) : activeTab === 'CHG_OI' ? (
                        <>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#3874CB' }} />
                                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Call Buildup (+)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#23497D' }} />
                                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Call Unwind (-)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#D33D35' }} />
                                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Put Buildup (+)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#7A2222' }} />
                                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Put Unwind (-)</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#3874CB' }} />
                                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Call OI (Overhead Resistance)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#D33D35' }} />
                                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Put OI (Downside Support)</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Expiry & Timestamp Metadata */}
                <div className={`flex items-center gap-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-mono">Expiry:</span>
                        <span className={`font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                            {formattedExpiry}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px]">
                            {lastUpdatedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <button
                            onClick={handleManualRefresh}
                            className={`p-1 rounded-md transition-colors ${
                                isLight 
                                ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                            title="Refresh Live Options Chain"
                        >
                            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? (isLight ? 'animate-spin text-blue-600' : 'animate-spin text-blue-400') : ''}`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
