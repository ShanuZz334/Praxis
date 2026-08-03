/**
 * @file OptionsOiAnalysisChart.jsx
 * @purpose Comprehensive Open Interest, Change in OI, PCR, and Max Pain analysis chart with live Upstox integration and light/dark theme optimization.
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
import { Activity, RotateCw } from 'lucide-react';
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
        toast.info("Refreshed live options data", { id: 'oi-refresh' });
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

    // Theme color constants for Recharts elements
    const gridStroke = isLight ? '#E2E8F0' : '#1c2438';
    const axisStroke = isLight ? '#94A3B8' : '#64748b';
    const tickFill = isLight ? '#475569' : '#94a3b8';
    const lineStroke = isLight ? '#CBD5E1' : '#334155';
    const spotStroke = isLight ? '#0F172A' : '#ffffff';
    const spotLabelFill = isLight ? '#0F172A' : '#ffffff';
    const zeroLineStroke = isLight ? '#94A3B8' : '#475569';

    // Custom Interactive Tooltip that displays comprehensive live metrics
    const CustomInteractiveTooltip = ({ active, payload }) => {
        if (!active || !payload || payload.length === 0) return null;
        const activeItem = payload[0].payload;

        return (
            <div className={`backdrop-blur-xl border rounded-xl p-3 shadow-2xl min-w-[290px] pointer-events-auto z-50 text-xs ${
                isLight 
                    ? 'bg-white/98 border-slate-200 shadow-slate-300/50 text-slate-800' 
                    : 'bg-[#131926]/95 border-white/10 shadow-black/80 text-white'
            }`}>
                {/* Header: Strike & PCR */}
                <div className={`flex items-center justify-between gap-3 border-b pb-2 mb-2 ${
                    isLight ? 'border-slate-100' : 'border-white/10'
                }`}>
                    <div className={`font-mono font-black text-sm tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Strike: {activeItem.strike.toLocaleString('en-IN')}
                    </div>
                    <div className={`font-mono text-xs font-bold ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>
                        PCR: <span className={isLight ? 'text-purple-800 font-extrabold' : 'text-purple-300'}>{activeItem.pcr}</span>
                    </div>
                </div>

                {/* Metrics Grid: Call vs Put */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    {/* Call Column */}
                    <div className={`flex flex-col gap-1 rounded-lg p-2 border ${
                        isLight 
                            ? 'bg-blue-50/90 border-blue-200/90 text-slate-800' 
                            : 'bg-blue-950/30 border-blue-500/20 text-slate-200'
                    }`}>
                        <div className={`flex items-center gap-1.5 font-bold text-xs pb-1 border-b ${
                            isLight ? 'text-blue-700 border-blue-200' : 'text-blue-400 border-blue-500/20'
                        }`}>
                            <span className="w-2 h-2 rounded-[2px] bg-blue-500" />
                            <span>CALL (CE)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>OI:</span>
                            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatFullOiLakhs(activeItem.callOi)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Chg:</span>
                            <span className={`font-bold ${activeItem.callOiChg >= 0 ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}`}>
                                {activeItem.callOiChg >= 0 ? '+' : ''}{formatFullOiLakhs(activeItem.callOiChg)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>LTP:</span>
                            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>₹{activeItem.callData?.ltp?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>

                    {/* Put Column */}
                    <div className={`flex flex-col gap-1 rounded-lg p-2 border ${
                        isLight 
                            ? 'bg-red-50/90 border-red-200/90 text-slate-800' 
                            : 'bg-red-950/30 border-red-500/20 text-slate-200'
                    }`}>
                        <div className={`flex items-center gap-1.5 font-bold text-xs pb-1 border-b ${
                            isLight ? 'text-red-700 border-red-200' : 'text-red-400 border-red-500/20'
                        }`}>
                            <span className="w-2 h-2 rounded-[2px] bg-red-500" />
                            <span>PUT (PE)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>OI:</span>
                            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatFullOiLakhs(activeItem.putOi)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Chg:</span>
                            <span className={`font-bold ${activeItem.putOiChg >= 0 ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}`}>
                                {activeItem.putOiChg >= 0 ? '+' : ''}{formatFullOiLakhs(activeItem.putOiChg)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>LTP:</span>
                            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>₹{activeItem.putData?.ltp?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`w-full rounded-2xl p-4 md:p-5 shadow-xl relative overflow-hidden transition-all duration-300 ${
            isLight 
                ? 'bg-white border-2 border-[#E2E8F0] shadow-sm text-slate-800' 
                : 'bg-[#0c1019] border border-white/10 shadow-2xl text-slate-100'
        }`}>
            {/* Top Control Bar */}
            <div className={`flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b ${
                isLight ? 'border-slate-100' : 'border-white/5'
            }`}>
                <div className="flex items-center gap-3">
                    {/* Mode Tabs (OI | Chg. OI | PCR | Max pain) */}
                    <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
                        isLight ? 'bg-slate-100/90 border-slate-200/80' : 'bg-[#121824] border-white/5'
                    }`}>
                        <button
                            onClick={() => setActiveTab('OI')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                activeTab === 'OI'
                                    ? isLight
                                        ? 'bg-purple-600/15 text-purple-700 border border-purple-400/40 shadow-xs'
                                        : 'bg-purple-500/15 text-purple-300 border border-purple-500/40 shadow-xs'
                                    : isLight
                                        ? 'text-slate-600 hover:text-slate-900 border border-transparent'
                                        : 'text-slate-400 hover:text-white border border-transparent'
                            }`}
                        >
                            OI
                        </button>
                        <button
                            onClick={() => setActiveTab('CHG_OI')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                activeTab === 'CHG_OI'
                                    ? isLight
                                        ? 'bg-purple-600/15 text-purple-700 border border-purple-400/40 shadow-xs'
                                        : 'bg-purple-500/15 text-purple-300 border border-purple-500/40 shadow-xs'
                                    : isLight
                                        ? 'text-slate-600 hover:text-slate-900 border border-transparent'
                                        : 'text-slate-400 hover:text-white border border-transparent'
                            }`}
                        >
                            Chg. OI
                        </button>
                        <button
                            onClick={() => setActiveTab('PCR')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                activeTab === 'PCR'
                                    ? isLight
                                        ? 'bg-purple-600/15 text-purple-700 border border-purple-400/40 shadow-xs'
                                        : 'bg-purple-500/15 text-purple-300 border border-purple-500/40 shadow-xs'
                                    : isLight
                                        ? 'text-slate-600 hover:text-slate-900 border border-transparent'
                                        : 'text-slate-400 hover:text-white border border-transparent'
                            }`}
                        >
                            PCR
                        </button>
                        <button
                            onClick={() => setActiveTab('MAX_PAIN')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                activeTab === 'MAX_PAIN'
                                    ? isLight
                                        ? 'bg-purple-600/15 text-purple-700 border border-purple-400/40 shadow-xs'
                                        : 'bg-purple-500/15 text-purple-300 border border-purple-500/40 shadow-xs'
                                    : isLight
                                        ? 'text-slate-600 hover:text-slate-900 border border-transparent'
                                        : 'text-slate-400 hover:text-white border border-transparent'
                            }`}
                        >
                            Max pain
                        </button>
                    </div>
                </div>

                {/* Center Spot Price Header */}
                <div className="text-center font-mono">
                    <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Spot (close): </span>
                    <span className={`text-sm font-black tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {spotPrice ? spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '24,000.00'}
                    </span>
                </div>

                {/* Strike Range Selector */}
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Strikes:</span>
                    <div className={`flex rounded-lg p-0.5 border text-[10.5px] font-bold ${
                        isLight ? 'bg-slate-100/90 border-slate-200/80' : 'bg-[#121824] border-white/5'
                    }`}>
                        {[10, 15, 20].map(cnt => (
                            <button
                                key={cnt}
                                onClick={() => setStrikeRange(cnt)}
                                className={`px-2 py-0.5 rounded-md transition-all ${
                                    strikeRange === cnt 
                                        ? isLight
                                            ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                                            : 'bg-white/10 text-white shadow-xs border border-transparent font-bold'
                                        : isLight
                                            ? 'text-slate-500 hover:text-slate-900'
                                            : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                ±{cnt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Chart Area */}
            <div className="w-full h-[320px] md:h-[360px] relative">
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
                                <Bar dataKey="callOi" name="Call OI" fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={16} isAnimationActive={false} />
                                <Bar dataKey="putOi" name="Put OI" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={16} isAnimationActive={false} />
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
                                <ReferenceLine y={0} stroke={zeroLineStroke} strokeWidth={1} />
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
                                <Bar dataKey="callOiChg" name="Call Chg. OI" fill="#2563eb" radius={[2, 2, 2, 2]} maxBarSize={16} isAnimationActive={false}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`call-${index}`} fill={entry.callOiChg >= 0 ? '#2563eb' : '#1d4ed8'} />
                                    ))}
                                </Bar>
                                <Bar dataKey="putOiChg" name="Put Chg. OI" fill="#ef4444" radius={[2, 2, 2, 2]} maxBarSize={16} isAnimationActive={false}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`put-${index}`} fill={entry.putOiChg >= 0 ? '#ef4444' : '#b91c1c'} />
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
                                <ReferenceLine y={1.0} stroke="#a855f7" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'PCR 1.0 (Neutral)', fill: isLight ? '#7e22ce' : '#c084fc', fontSize: 10, fontWeight: 'bold' }} />
                                {closestSpotStrike && (
                                    <ReferenceLine x={closestSpotStrike} stroke={spotStroke} strokeDasharray="4 4" strokeWidth={1.5} />
                                )}
                                <Bar dataKey="pcr" name="Strike PCR" maxBarSize={20} isAnimationActive={false}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`pcr-${index}`}
                                            fill={entry.pcr > 1.2 ? '#10b981' : entry.pcr < 0.7 ? '#ef4444' : '#8b5cf6'}
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
                                            fill={entry.isMaxPain ? '#f59e0b' : '#2563eb'}
                                        />
                                    ))}
                                </Bar>
                                <Bar dataKey="putPain" stackId="pain" name="Put Writer Loss" maxBarSize={20} isAnimationActive={false}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`put-pain-${index}`}
                                            fill={entry.isMaxPain ? '#f59e0b' : '#ef4444'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>

            {/* Bottom Legend & Metadata Row */}
            <div className={`flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t text-[11px] ${
                isLight ? 'border-slate-100 text-slate-600' : 'border-white/5 text-slate-400'
            }`}>
                {/* Left Legend */}
                <div className="flex items-center gap-4">
                    {activeTab === 'MAX_PAIN' ? (
                        <>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px] bg-amber-500 shadow-sm" />
                                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Max Pain Point (Least Writer Loss)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-[2px] ${isLight ? 'bg-slate-300' : 'bg-slate-700'}`} />
                                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Cumulative Loss</span>
                            </div>
                        </>
                    ) : activeTab === 'PCR' ? (
                        <>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500" />
                                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{'> 1.2 (Bullish Support)'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px] bg-red-500" />
                                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{'< 0.7 (Bearish Resistance)'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px] bg-purple-500" />
                                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Neutral</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px] bg-blue-600 shadow-sm" />
                                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{activeTab === 'CHG_OI' ? 'Call Chg. OI' : 'Call OI'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-[2px] bg-red-500 shadow-sm" />
                                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{activeTab === 'CHG_OI' ? 'Put Chg. OI' : 'Put OI'}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Expiry & Timestamp Metadata */}
                <div className={`flex items-center gap-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    <div>
                        Intraday chart expiry on <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{formattedExpiry}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span>
                            Last updated: {lastUpdatedTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })} {lastUpdatedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <button
                            onClick={handleManualRefresh}
                            className={`p-1 transition-colors ${
                                isLight 
                                ? 'text-slate-400 hover:text-slate-900' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Refresh Live OI"
                        >
                            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? (isLight ? 'animate-spin text-purple-600' : 'animate-spin text-purple-400') : ''}`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
