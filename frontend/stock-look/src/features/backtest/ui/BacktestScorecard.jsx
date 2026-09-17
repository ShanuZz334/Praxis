/**
 * @file BacktestScorecard.jsx
 * @purpose Right-side Live Scorecard displaying performance metrics, statistical guardrails, predictor calibration curve, and an event log with CSV/JSON export.
 * @date 2026-09-12
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
    Award, TrendingUp, AlertTriangle, ShieldCheck, Download, 
    Layers, Cpu, ArrowUpRight, ArrowDownRight, Table, BarChart2,
    GitCompare, RotateCcw, Trash2, X, Check, History, Zap, Activity,
    Sparkles, Stethoscope, Target, OctagonAlert, Clock, Scale, Bell
} from 'lucide-react';
import BacktestWalkthroughSection from './BacktestWalkthroughSection';
import { computeExecutiveVerdict, evaluateStyleSuitability } from '../engine/backtestWalkthroughEngine';

function formatTimeIso(t) {
    if (!t) return '';
    if (typeof t === 'string') {
        const d = new Date(t);
        return isNaN(d.getTime()) ? t : d.toISOString();
    }
    const d = new Date(t * 1000);
    return isNaN(d.getTime()) ? String(t) : d.toISOString();
}

function formatTimeHuman(t) {
    if (!t) return '';
    const rawMs = typeof t === 'number' && t < 1e11 ? t * 1000 : t;
    const d = new Date(rawMs);
    return isNaN(d.getTime()) ? String(t) : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function formatRunTimestamp(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function BacktestScorecard({
    summary = {},
    config = {},
    calibration = [],
    walkForward = null,
    trades = [],
    activeUnit = 'PREDICTOR',
    savedRuns = [],
    onRestoreRun = () => {},
    onDeleteRun = () => {},
    onClearRuns = () => {},
    onOpenOptimizer = () => {},
    onPlugLeakNow = () => {},
    isOpen = true,
    onClose = () => {},
}) {
    const [activeTab, setActiveTab] = useState(() => {
        try {
            return localStorage.getItem('praxis_backtest_scorecard_tab') || 'METRICS';
        } catch (e) {
            return 'METRICS';
        }
    }); // 'METRICS' | 'DIAGNOSIS' | 'CALIBRATION' | 'LOG' | 'RUNS'

    const miniVerdict = useMemo(() => computeExecutiveVerdict(summary, config), [summary, config]);
    const miniStyle = useMemo(() => evaluateStyleSuitability(summary, config), [summary, config]);

    const [exitFilter, setExitFilter] = useState(() => {
        try {
            return localStorage.getItem('praxis_backtest_scorecard_exit_filter') || 'ALL';
        } catch (e) {
            return 'ALL';
        }
    }); // 'ALL' | 'TARGET' | 'STOP' | 'HORIZON_EXPIRY'

    useEffect(() => {
        try {
            localStorage.setItem('praxis_backtest_scorecard_tab', activeTab);
        } catch (e) {
            /* silent */
        }
    }, [activeTab]);

    useEffect(() => {
        try {
            localStorage.setItem('praxis_backtest_scorecard_exit_filter', exitFilter);
        } catch (e) {
            /* silent */
        }
    }, [exitFilter]);

    const [calibBinning, setCalibBinning] = useState(() => {
        try {
            return localStorage.getItem('praxis_backtest_scorecard_calib_mode') || 'ADAPTIVE';
        } catch (e) {
            return 'ADAPTIVE';
        }
    }); // 'ADAPTIVE' | 'FIXED'

    const [calibProbability, setCalibProbability] = useState(() => {
        try {
            return localStorage.getItem('praxis_backtest_scorecard_calib_prob') || 'CALIBRATED';
        } catch (e) {
            return 'CALIBRATED';
        }
    }); // 'CALIBRATED' | 'RAW'

    useEffect(() => {
        try {
            localStorage.setItem('praxis_backtest_scorecard_calib_mode', calibBinning);
        } catch (e) {
            /* silent */
        }
    }, [calibBinning]);

    useEffect(() => {
        try {
            localStorage.setItem('praxis_backtest_scorecard_calib_prob', calibProbability);
        } catch (e) {
            /* silent */
        }
    }, [calibProbability]);

    const activeBuckets = useMemo(() => {
        const source = calibProbability === 'CALIBRATED'
            ? (calibration?.calibrated || calibration)
            : (calibration?.raw || calibration);

        if (calibBinning === 'ADAPTIVE') {
            if (source?.adaptive && source.adaptive.length > 0) return source.adaptive;
            if (calibration?.adaptive && calibration.adaptive.length > 0) return calibration.adaptive;
        } else {
            if (source?.fixed && source.fixed.length > 0) return source.fixed;
            if (calibration?.fixed && calibration.fixed.length > 0) return calibration.fixed;
        }
        return Array.isArray(source) ? source : Array.isArray(calibration) ? calibration : [];
    }, [calibration, calibBinning, calibProbability]);

    const calibSummary = useMemo(() => {
        const source = calibProbability === 'CALIBRATED'
            ? (calibration?.calibrated || calibration)
            : (calibration?.raw || calibration);

        const summaryObj = calibBinning === 'ADAPTIVE'
            ? source?.summary?.adaptive
            : source?.summary?.fixed;

        if (summaryObj) return summaryObj;

        let cal = 0, over = 0, under = 0, tent = 0, insuff = 0, noTr = 0;
        activeBuckets.forEach(b => {
            if (b.status === 'CALIBRATED') cal++;
            else if (b.status === 'OVERCONFIDENT') over++;
            else if (b.status === 'UNDERCONFIDENT') under++;
            else if (b.status === 'TENTATIVE') tent++;
            else if (b.status === 'NO_TRADES') noTr++;
            else if (b.sampleSize >= 20) {
                if (b.actualWinRate !== null && Math.abs(b.actualWinRate - b.predictedWinRate) <= 8) cal++;
                else if (b.actualWinRate !== null && b.predictedWinRate - b.actualWinRate > 8) over++;
                else under++;
            } else if (b.sampleSize === 0) {
                noTr++;
            } else {
                insuff++;
            }
        });
        return { calibrated: cal, overconfident: over, underconfident: under, tentative: tent, insufficient: insuff, noTrades: noTr };
    }, [activeBuckets, calibration, calibBinning, calibProbability]);

    const currentEce = useMemo(() => {
        if (calibProbability === 'CALIBRATED') {
            return calibration?.ece?.calibrated ?? calibration?.calibrated?.ece ?? 0;
        }
        return calibration?.ece?.raw ?? calibration?.raw?.ece ?? 0;
    }, [calibration, calibProbability]);

    const currentBrier = useMemo(() => {
        if (calibProbability === 'CALIBRATED') {
            return calibration?.brierScore?.calibrated ?? calibration?.calibrated?.brierScore ?? 0.25;
        }
        return calibration?.brierScore?.raw ?? calibration?.raw?.brierScore ?? 0.25;
    }, [calibration, calibProbability]);

    const exhaustionAnomaly = calibration?.exhaustionAnomaly;

    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const [restoredRunId, setRestoredRunId] = useState(null);
    const [matrixSortBy, setMatrixSortBy] = useState('timestamp'); // 'timestamp' | 'winRate' | 'profitFactor' | 'netReturnPct' | 'drawdown'

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isCompareModalOpen) {
                setIsCompareModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCompareModalOpen]);

    const targetTradesCount = trades.filter(t => t.exitReason === 'TARGET').length;
    const stopTradesCount = trades.filter(t => t.exitReason === 'STOP').length;
    const trailTradesCount = trades.filter(t => t.exitReason === 'TRAILING_STOP').length;
    const horizonTradesCount = trades.filter(t => t.exitReason === 'HORIZON_EXPIRY').length;
    const breakevenTradesCount = trades.filter(t => t.exitReason === 'BREAKEVEN').length;

    const filteredTrades = trades.filter(t => {
        if (exitFilter === 'TARGET') return t.exitReason === 'TARGET';
        if (exitFilter === 'STOP') return t.exitReason === 'STOP';
        if (exitFilter === 'TRAILING_STOP') return t.exitReason === 'TRAILING_STOP';
        if (exitFilter === 'HORIZON_EXPIRY') return t.exitReason === 'HORIZON_EXPIRY';
        if (exitFilter === 'BREAKEVEN') return t.exitReason === 'BREAKEVEN';
        return true;
    });

    // Export CSV of Event Log
    const handleExportCsv = () => {
        if (!trades || !trades.length) return;
        const headers = ['ID', 'Signal', 'Direction', 'Unit', 'Entry Time', 'Entry Price', 'Exit Time', 'Exit Price', 'Net Return %', 'Realized PnL', 'Outcome', 'Reason', 'Bars Held', 'MAE %', 'MFE %', 'Friction %'];
        const rows = trades.map(t => [
            t.id,
            `"${t.sourceDetail}"`,
            t.direction === 1 ? 'BUY' : 'SELL',
            t.unit,
            formatTimeIso(t.entryTime),
            t.entryPrice,
            t.exitTime ? formatTimeIso(t.exitTime) : 'OPEN',
            t.exitPrice || '',
            t.returnPct,
            t.realizedPnl || 0,
            t.outcome,
            t.exitReason || '',
            t.barsHeld,
            t.maePct || 0,
            t.mfePct || 0,
            t.frictionPct || 0
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `praxis_backtest_${activeUnit.toLowerCase()}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Export JSON
    const handleExportJson = () => {
        if (!trades || !trades.length) return;
        const dataStr = JSON.stringify({ summary, calibration, walkForward, trades }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `praxis_backtest_${activeUnit.toLowerCase()}_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Sort and rank historical runs
    const sortedRuns = useMemo(() => {
        const list = [...savedRuns];
        if (matrixSortBy === 'winRate') {
            return list.sort((a, b) => (b.summary?.winRate ?? 0) - (a.summary?.winRate ?? 0));
        }
        if (matrixSortBy === 'profitFactor') {
            return list.sort((a, b) => (b.summary?.profitFactor ?? 0) - (a.summary?.profitFactor ?? 0));
        }
        if (matrixSortBy === 'netReturnPct') {
            return list.sort((a, b) => (b.summary?.netReturnPct ?? 0) - (a.summary?.netReturnPct ?? 0));
        }
        if (matrixSortBy === 'drawdown') {
            return list.sort((a, b) => (a.summary?.maxDrawdownPct ?? 999) - (b.summary?.maxDrawdownPct ?? 999));
        }
        return list.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    }, [savedRuns, matrixSortBy]);

    const maxWr = useMemo(() => Math.max(...savedRuns.map(r => r.summary?.winRate ?? 0), 0), [savedRuns]);
    const maxPf = useMemo(() => Math.max(...savedRuns.map(r => r.summary?.profitFactor ?? 0), 0), [savedRuns]);
    const maxRet = useMemo(() => Math.max(...savedRuns.map(r => r.summary?.netReturnPct ?? 0), 0), [savedRuns]);
    const minDd = useMemo(() => {
        const dds = savedRuns.map(r => r.summary?.maxDrawdownPct).filter(d => typeof d === 'number');
        return dds.length ? Math.min(...dds) : 0;
    }, [savedRuns]);

    const handleExportRunsCsv = () => {
        if (!savedRuns || !savedRuns.length) return;
        const headers = ['Run Name', 'Unit', 'Instrument', 'Timeframe', 'Date', 'Total Trades', 'Wins', 'Losses', 'Win Rate %', 'Profit Factor', 'Net Return %', 'Max Drawdown %'];
        const rows = savedRuns.map(r => [
            `"${r.name}"`,
            r.unit || '',
            `"${r.instrument || ''}"`,
            r.timeframe || '',
            formatRunTimestamp(r.timestamp),
            r.summary?.totalTrades ?? '',
            r.summary?.wins ?? '',
            r.summary?.losses ?? '',
            r.summary?.winRate ?? '',
            r.summary?.profitFactor ?? '',
            r.summary?.netReturnPct ?? '',
            r.summary?.maxDrawdownPct ?? ''
        ]);
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `praxis_backtest_runs_comparison_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <aside className="w-[380px] xl:w-[410px] flex-shrink-0 bg-background-card border-l border-border-subtle h-full overflow-y-auto overflow-x-hidden p-4 pb-12 flex flex-col gap-4 text-xs select-none custom-scrollbar">
            {/* Header Title (Aligned with Test Configuration header) */}
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle/60">
                <div className="flex items-center gap-2">
                    <Award size={14} className="text-amber-400" />
                    <span className="font-bold text-text-primary uppercase tracking-wider text-xs font-mono">
                        Scorecard
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-text-tertiary bg-background-surface px-2 py-0.5 rounded border border-border-subtle/50 font-mono">
                        {summary?.totalTrades ?? 0} Trades
                    </span>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center bg-background-surface/80 p-1 rounded-lg border border-border-subtle w-full gap-1">
                <button
                    onClick={() => setActiveTab('METRICS')}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition cursor-pointer text-center ${
                        activeTab === 'METRICS'
                            ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                            : 'text-text-tertiary hover:text-text-primary border border-transparent'
                    }`}
                >
                    Metrics
                </button>
                <button
                    onClick={() => setActiveTab('DIAGNOSIS')}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                        activeTab === 'DIAGNOSIS'
                            ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                            : 'text-text-tertiary hover:text-text-primary border border-transparent'
                    }`}
                >
                    <Sparkles size={11} className={miniVerdict.color === 'emerald' ? 'text-emerald-400' : miniVerdict.color === 'amber' ? 'text-amber-400' : 'text-rose-400'} />
                    <span>Diagnosis</span>
                </button>
                <button
                    onClick={() => setActiveTab('CALIBRATION')}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition cursor-pointer text-center ${
                        activeTab === 'CALIBRATION'
                            ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                            : 'text-text-tertiary hover:text-text-primary border border-transparent'
                    }`}
                >
                    Calib
                </button>
                <button
                    onClick={() => setActiveTab('LOG')}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition cursor-pointer text-center ${
                        activeTab === 'LOG'
                            ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                            : 'text-text-tertiary hover:text-text-primary border border-transparent'
                    }`}
                >
                    Log
                </button>
                <button
                    onClick={() => setActiveTab('RUNS')}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                        activeTab === 'RUNS'
                            ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                            : 'text-text-tertiary hover:text-text-primary border border-transparent'
                    }`}
                    title="Saved Runs & Comparisons"
                >
                    <span>Runs</span>
                    {savedRuns.length > 0 && (
                        <span className={`px-1 rounded text-[9px] font-mono font-bold ${
                            activeTab === 'RUNS' ? 'bg-white/25 text-white' : 'bg-background-card text-accent-primary'
                        }`}>
                            {savedRuns.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Guardrail Warning Banner */}
            {summary.guardrailWarning && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-start gap-2 text-amber-400">
                    <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-tight">
                        <span className="font-bold block mb-0.5">Sample Size Guardrail Alert</span>
                        <span className="text-amber-400/80">{summary.guardrailWarning}</span>
                    </div>
                </div>
            )}

            {/* TAB 1: METRICS VIEW */}
            {activeTab === 'METRICS' && (
                <div className="flex flex-col gap-3">
                    {/* Quick Strategic Diagnosis Strip */}
                    <div 
                        onClick={() => setActiveTab('DIAGNOSIS')}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition hover:opacity-90 ${
                            miniVerdict.color === 'emerald' 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                : miniVerdict.color === 'amber'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                        title="Click to view full Walkthrough & Diagnosis"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                                miniVerdict.color === 'emerald' ? 'bg-emerald-400 animate-pulse' : miniVerdict.color === 'amber' ? 'bg-amber-400' : 'bg-rose-400 animate-pulse'
                            }`} />
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-black font-mono uppercase tracking-wider truncate">
                                    {miniVerdict.badgeText}
                                </span>
                                <span className="text-[10px] text-text-secondary truncate mt-0.2">
                                    {miniStyle.detectedStyle}: {miniStyle.viabilityStatus.replace(/_/g, ' ')} ({summary.expectancy >= 0 ? '+' : ''}{summary.expectancy}% exp)
                                </span>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold underline font-sans shrink-0 ml-2">
                            Walkthrough &rarr;
                        </span>
                    </div>

                    {/* Primary Institutional Quad Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* Win Rate */}
                        <div className="bg-background-surface/80 p-3 rounded-xl border border-border-subtle flex flex-col">
                            <span className="text-[10px] font-semibold text-text-tertiary uppercase">Win Rate</span>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className={`text-2xl font-black font-mono ${
                                    summary.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                    {summary.winRate}%
                                </span>
                            </div>
                            <span className="text-[10px] text-text-tertiary mt-1">
                                {summary.wins}W / {summary.losses}L {summary.breakEvens > 0 ? `(${summary.breakEvens} BE)` : ''}
                            </span>
                        </div>

                        {/* Profit Factor */}
                        <div className="bg-background-surface/80 p-3 rounded-xl border border-border-subtle flex flex-col">
                            <span className="text-[10px] font-semibold text-text-tertiary uppercase">Profit Factor</span>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className={`text-2xl font-black font-mono ${
                                    summary.profitFactor >= 1.5 ? 'text-emerald-400' : summary.profitFactor >= 1.0 ? 'text-amber-400' : 'text-rose-400'
                                }`}>
                                    {summary.profitFactor}
                                </span>
                            </div>
                            <span className="text-[10px] text-text-tertiary mt-1">
                                Gross Gains ÷ Losses
                            </span>
                        </div>

                        {/* Sharpe Ratio */}
                        <div className="bg-background-surface/80 p-3 rounded-xl border border-border-subtle flex flex-col">
                            <span className="text-[10px] font-semibold text-text-tertiary uppercase">Sharpe Ratio</span>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className={`text-xl font-black font-mono ${
                                    summary.sharpeRatio >= 1.0 ? 'text-emerald-400' : summary.sharpeRatio >= 0 ? 'text-blue-400' : 'text-rose-400'
                                }`}>
                                    {summary.sharpeRatio > 0 ? '+' : ''}{summary.sharpeRatio}
                                </span>
                            </div>
                            <span className="text-[10px] text-text-tertiary mt-1">
                                Rf: 7.0% (G-Sec)
                            </span>
                        </div>

                        {/* Max Drawdown */}
                        <div className="bg-background-surface/80 p-3 rounded-xl border border-border-subtle flex flex-col">
                            <span className="text-[10px] font-semibold text-text-tertiary uppercase">Max Drawdown</span>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-xl font-black font-mono text-rose-400">
                                    -{summary.maxDrawdownPct}%
                                </span>
                            </div>
                            <span className="text-[10px] text-text-tertiary mt-1">
                                Peak-to-Trough
                            </span>
                        </div>
                    </div>

                    {/* Secondary Institutional Quad Grid */}
                    <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-background-surface/50 border border-border-subtle text-center font-mono">
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase text-text-tertiary font-bold">CAGR</span>
                            <span className={`text-[11px] font-black ${summary.cagr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {summary.cagr >= 0 ? '+' : ''}{summary.cagr}%
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase text-text-tertiary font-bold">Sortino</span>
                            <span className={`text-[11px] font-black ${summary.sortinoRatio >= 1.0 ? 'text-emerald-400' : 'text-blue-400'}`}>
                                {summary.sortinoRatio}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase text-text-tertiary font-bold">Calmar</span>
                            <span className={`text-[11px] font-black ${summary.calmarRatio >= 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {summary.calmarRatio}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase text-text-tertiary font-bold">Realized R:R</span>
                            <span className="text-[11px] font-black text-emerald-400">
                                {summary.realizedRR}x
                            </span>
                        </div>
                    </div>

                    {/* Detailed Financial Telemetry */}
                    <div className="bg-background-surface/70 rounded-xl p-3.5 border border-border-subtle flex flex-col gap-1.5 shadow-xs">
                        <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle/50">
                            <div className="flex items-center gap-1.5">
                                <Activity size={12} className="text-text-tertiary" />
                                <span className="font-semibold text-[10px] text-text-secondary uppercase tracking-wider">
                                    Performance Telemetry
                                </span>
                            </div>
                            <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-wider px-1.5 py-0.5 rounded bg-background-elevated/80 border border-border-subtle/50">
                                Detailed Stats
                            </span>
                        </div>

                        {/* Net Cumulative Return */}
                        <div className="flex justify-between items-center py-1.5 px-1 border-b border-border-subtle/30 hover:bg-background-elevated/30 rounded transition-colors">
                            <span className="text-text-secondary text-[11px] font-medium">Net Cumulative Return</span>
                            <span className={`font-mono font-bold text-xs ${
                                summary.netReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                                {summary.netReturnPct >= 0 ? '+' : ''}{summary.netReturnPct}%
                            </span>
                        </div>

                        {/* Ending Capital */}
                        <div className="flex justify-between items-center py-1.5 px-1 border-b border-border-subtle/30 hover:bg-background-elevated/30 rounded transition-colors">
                            <span className="text-text-secondary text-[11px] font-medium">Ending Capital</span>
                            <span className="font-mono font-bold text-xs text-text-primary">
                                ₹{summary.endingCapital ? summary.endingCapital.toLocaleString('en-IN') : '0'}
                            </span>
                        </div>

                        {/* Expectancy / Trade */}
                        <div className="flex justify-between items-center py-1.5 px-1 border-b border-border-subtle/30 hover:bg-background-elevated/30 rounded transition-colors">
                            <span className="text-text-secondary text-[11px] font-medium">Expectancy / Trade</span>
                            <span className={`font-mono font-bold text-xs ${summary.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {summary.expectancy >= 0 ? '+' : ''}{summary.expectancy}%
                            </span>
                        </div>

                        {/* Kelly Recommended Sizing */}
                        <div className="flex justify-between items-center py-1.5 px-1 border-b border-border-subtle/30 hover:bg-background-elevated/30 rounded transition-colors">
                            <span className="text-text-secondary text-[11px] font-medium">Kelly Criterion Sizing</span>
                            <div className="flex items-baseline font-mono text-xs">
                                <span className={`font-bold ${summary.kellyPct > 0 ? 'text-emerald-400' : 'text-text-secondary'}`}>
                                    {summary.kellyPct}%
                                </span>
                                <span className="text-[10px] text-text-tertiary font-sans font-normal ml-1">
                                    of capital
                                </span>
                            </div>
                        </div>

                        {/* Streaks (Max W / L) */}
                        <div className="flex justify-between items-center py-1.5 px-1 border-b border-border-subtle/30 hover:bg-background-elevated/30 rounded transition-colors">
                            <span className="text-text-secondary text-[11px] font-medium">Max Streaks (W / L)</span>
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                    {summary.maxConsecutiveWins || 0}W
                                </span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                                    {summary.maxConsecutiveLosses || 0}L
                                </span>
                            </div>
                        </div>

                        {/* Avg MAE / MFE */}
                        <div className="flex justify-between items-center py-1.5 px-1 border-b border-border-subtle/30 hover:bg-background-elevated/30 rounded transition-colors">
                            <span className="text-text-secondary text-[11px] font-medium">Avg MAE / MFE</span>
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                                <span className="text-rose-400 font-bold">
                                    {summary.avgMae}%
                                </span>
                                <span className="text-border-subtle font-normal">/</span>
                                <span className="text-emerald-400 font-bold">
                                    +{summary.avgMfe}%
                                </span>
                            </div>
                        </div>

                        {/* Buy & Hold Benchmark */}
                        <div className="flex justify-between items-center py-1.5 px-1 border-b border-border-subtle/30 hover:bg-background-elevated/30 rounded transition-colors">
                            <span className="text-text-secondary text-[11px] font-medium">Buy & Hold Benchmark</span>
                            <span className={`font-mono font-bold text-xs ${summary.buyAndHoldReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {summary.buyAndHoldReturnPct >= 0 ? '+' : ''}{summary.buyAndHoldReturnPct}%
                            </span>
                        </div>

                        {/* Avg Duration */}
                        <div className="flex justify-between items-center py-1.5 px-1 hover:bg-background-elevated/30 rounded transition-colors">
                            <span className="text-text-secondary text-[11px] font-medium">Avg Trade Duration</span>
                            <div className="flex items-baseline font-mono text-xs">
                                <span className="font-bold text-text-primary">
                                    {summary.avgBarsHeld || 0}
                                </span>
                                <span className="text-[10px] text-text-tertiary font-sans font-normal ml-1">
                                    candles
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Year-by-Year Performance Matrix */}
                    {summary.yearlyBreakdown && summary.yearlyBreakdown.length > 1 && (
                        <div className="bg-background-surface/60 rounded-xl p-3 border border-border-subtle flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-[10px] text-text-secondary uppercase tracking-wider">
                                    Annual Returns Matrix
                                </span>
                                <span className="text-[10px] text-text-tertiary font-mono">
                                    {summary.yearlyBreakdown.length} Years
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 mt-0.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                                {summary.yearlyBreakdown.map((y) => (
                                    <div key={y.year} className="flex items-center justify-between py-1 px-2 rounded bg-background-app/70 border border-border-subtle/60 text-[10px] font-mono">
                                        <span className="font-bold text-text-primary">{y.year}</span>
                                        <span className="text-text-tertiary">{y.trades} trades</span>
                                        <span className={y.winRate >= 50 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                            {y.winRate}% WR
                                        </span>
                                        <span className={`font-bold ${y.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {y.returnPct >= 0 ? '+' : ''}{y.returnPct}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Walk-Forward Comparison */}
                    {walkForward && (
                        <div className="bg-background-surface/60 rounded-xl p-3 border border-border-subtle flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-[10px] text-text-secondary uppercase tracking-wider">
                                    Walk-Forward Split
                                </span>
                                <span className="text-[10px] text-accent-primary font-bold">
                                    {walkForward.efficiencyRatio}x Efficiency
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <div className="bg-background-app p-2 rounded-lg border border-border-subtle">
                                    <span className="text-[9px] text-text-muted block">In-Sample (Train)</span>
                                    <span className="text-sm font-bold font-mono text-text-primary">
                                        {walkForward.inSample?.winRate || 0}% WR
                                    </span>
                                    <span className="text-[9px] text-text-tertiary block mt-0.5">
                                        {walkForward.inSample?.count || 0} trades
                                    </span>
                                </div>

                                <div className="bg-background-app p-2 rounded-lg border border-border-subtle">
                                    <span className="text-[9px] text-text-muted block">Out-Sample (Test)</span>
                                    <span className={`text-sm font-bold font-mono ${
                                        (walkForward.outOfSample?.winRate || 0) >= 50 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}>
                                        {walkForward.outOfSample?.winRate || 0}% WR
                                    </span>
                                    <span className="text-[9px] text-text-tertiary block mt-0.5">
                                        {walkForward.outOfSample?.count || 0} trades
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Exit Reason Distribution & Edge Leak Diagnosis */}
                    {summary.exitBreakdown && summary.exitBreakdown.length > 0 && (
                        <div className="bg-background-surface/60 rounded-xl p-3 border border-border-subtle flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-[10px] text-text-secondary uppercase tracking-wider">
                                    Exit Reason Breakdown
                                </span>
                                <span className="text-[10px] text-text-tertiary font-mono">
                                    {summary.totalTrades} Exits
                                </span>
                            </div>

                            <div className="flex flex-col gap-1.5 mt-0.5">
                                {summary.exitBreakdown.map((e) => {
                                    const isTarget = e.reason === 'TARGET';
                                    const isStop = e.reason === 'STOP';
                                    const isHorizon = e.reason === 'HORIZON_EXPIRY';
                                    const isTrail = e.reason === 'TRAILING_STOP';
                                    const isBreakeven = e.reason === 'BREAKEVEN';
                                    const isEod = e.reason === 'EOD_SQUAREOFF';
                                    const label = isTarget ? 'Target Hit' : isStop ? 'Stop Hit' : isHorizon ? 'Horizon Expiry' : isTrail ? 'Trailing Stop' : isBreakeven ? 'Breakeven Stop' : isEod ? 'EOD Square-Off' : e.reason;
                                    const IconComponent = isTarget ? Target : isStop ? OctagonAlert : isHorizon ? Clock : isTrail ? Zap : isBreakeven ? Scale : isEod ? Bell : Activity;
                                    const iconColor = isTarget ? 'text-emerald-400' : isStop ? 'text-rose-400' : isHorizon ? 'text-amber-400' : isTrail ? 'text-blue-400' : isBreakeven ? 'text-purple-400' : isEod ? 'text-orange-400' : 'text-text-secondary';
                                    return (
                                        <div key={e.reason} className="bg-background-app/70 p-2 rounded-lg border border-border-subtle/60 flex flex-col gap-1">
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="font-bold text-text-primary flex items-center gap-1.5">
                                                    <IconComponent size={12} className={iconColor} />
                                                    <span>{label}</span>
                                                </span>
                                                <span className="font-mono font-bold text-text-secondary">
                                                    {e.count} <span className="text-text-muted text-[10px]">({e.pctOfTotal}%)</span>
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-text-tertiary">
                                                    Win Rate: <span className={e.winRate >= 50 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{e.winRate}%</span>
                                                </span>
                                                <span className="text-text-tertiary">
                                                    Avg Ret: <span className={`font-mono font-bold ${e.avgReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {e.avgReturnPct >= 0 ? '+' : ''}{e.avgReturnPct}%
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Edge Leak Warning Callout */}
                            {summary.horizonExpiryAnalysis?.isMajorDrag && (
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 flex flex-col gap-2 text-amber-400 text-[10px] leading-tight mt-1 shadow-sm">
                                    <div className="flex items-start gap-1.5">
                                        <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-400" />
                                        <div>
                                            <span className="font-bold block mb-0.5">Edge Leak Identified:</span>
                                            <span>
                                                {summary.horizonExpiryAnalysis.pctOfTotal}% of signals expired at the {summary.horizonExpiryAnalysis.horizonBars || 7}-bar horizon with an average return of {summary.horizonExpiryAnalysis.avgReturnPct}%. Trades are timing out instead of hitting full targets, pulling realized reward:risk below theoretical targets.
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                        {onPlugLeakNow && (
                                            <button
                                                type="button"
                                                onClick={onPlugLeakNow}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg text-emerald-300 font-bold text-[10px] transition cursor-pointer shadow-sm active:scale-95"
                                                title="Immediately switches to pure Target/Stop exit mode with premature timeout disabled"
                                            >
                                                <Check size={12} className="text-emerald-400" />
                                                <span>1-Click Plug: Disable Timeout & Run Target/Stop</span>
                                            </button>
                                        )}
                                        {onOpenOptimizer && (
                                            <button
                                                type="button"
                                                onClick={onOpenOptimizer}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background-surface hover:bg-background-app border border-amber-500/30 rounded-lg text-amber-300 font-medium text-[10px] transition cursor-pointer shadow-sm active:scale-95"
                                            >
                                                <Zap size={11} className="fill-amber-400 text-amber-400" />
                                                <span>Open Auto-Calibration Studio</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: DIAGNOSIS & WALKTHROUGH */}
            {activeTab === 'DIAGNOSIS' && (
                <BacktestWalkthroughSection
                    summary={summary}
                    config={config}
                    trades={trades}
                    onOpenOptimizer={onOpenOptimizer}
                />
            )}

            {/* TAB 2: CALIBRATION VIEW (Crucial for AI Trust) */}
            {activeTab === 'CALIBRATION' && (
                <div className="flex flex-col gap-3">
                    <div className="bg-background-surface/80 p-3 rounded-xl border border-border-subtle">
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                            <span className="font-bold text-text-primary text-xs">
                                AI Confidence Calibration
                            </span>

                            {/* Dual Mode Selectors */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {/* Probability Mode: Calibrated vs Raw */}
                                <div className="flex items-center bg-background-app p-0.5 rounded-lg border border-border-subtle text-[10px]">
                                    <button
                                        type="button"
                                        onClick={() => setCalibProbability('CALIBRATED')}
                                        className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                                            calibProbability === 'CALIBRATED'
                                                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                                                : 'text-text-tertiary hover:text-text-secondary'
                                        }`}
                                        title="Empirically calibrated true probabilities (~43%–51%)"
                                    >
                                        Calibrated
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCalibProbability('RAW')}
                                        className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                                            calibProbability === 'RAW'
                                                ? 'bg-amber-600 text-white shadow-sm font-semibold'
                                                : 'text-text-tertiary hover:text-text-secondary'
                                        }`}
                                        title="Raw uncalibrated heuristic scores (74%–91%)"
                                    >
                                        Raw
                                    </button>
                                </div>

                                {/* Binning Mode: Adaptive Quantiles vs Fixed Bins */}
                                <div className="flex items-center bg-background-app p-0.5 rounded-lg border border-border-subtle text-[10px]">
                                    <button
                                        type="button"
                                        onClick={() => setCalibBinning('ADAPTIVE')}
                                        className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                                            calibBinning === 'ADAPTIVE'
                                                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                                                : 'text-text-tertiary hover:text-text-secondary'
                                        }`}
                                        title="Equal-volume quantiles dynamically partitioned across executed trades"
                                    >
                                        Adaptive
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCalibBinning('FIXED')}
                                        className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                                            calibBinning === 'FIXED'
                                                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                                                : 'text-text-tertiary hover:text-text-secondary'
                                        }`}
                                        title="Standard fixed 10% percentage intervals"
                                    >
                                        Fixed
                                    </button>
                                </div>
                            </div>
                        </div>

                        <p className="text-[11px] text-text-tertiary leading-relaxed mb-2">
                            {calibProbability === 'CALIBRATED'
                                ? 'Empirical Probability Calibration: Predicted confidence is calibrated to match true observed win rates, eliminating heuristic overconfidence.'
                                : 'Raw Heuristic Conviction: Displays uncalibrated technical strength, illustrating the expected overconfidence bias in financial prediction models.'}
                        </p>

                        {/* Quantitative Institutional KPI Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 rounded-lg bg-background-app/70 border border-border-subtle/50 text-[10px] font-mono">
                            <div>
                                <span className="text-text-muted block text-[9px] uppercase tracking-wider">ECE (Calibration Error)</span>
                                <span className={`font-bold ${currentEce <= 8 ? 'text-emerald-400' : currentEce <= 15 ? 'text-amber-400' : 'text-rose-400'}`}>
                                    {currentEce}%
                                </span>
                            </div>
                            <div>
                                <span className="text-text-muted block text-[9px] uppercase tracking-wider">Brier Score</span>
                                <span className={`font-bold ${currentBrier <= 0.25 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {currentBrier}
                                </span>
                            </div>
                            <div>
                                <span className="text-text-muted block text-[9px] uppercase tracking-wider">Reliability Status</span>
                                <span className="font-bold text-emerald-400">
                                    {calibSummary.calibrated} Calibrated
                                </span>
                            </div>
                            <div>
                                <span className="text-text-muted block text-[9px] uppercase tracking-wider">Total Samples</span>
                                <span className="font-bold text-text-primary">
                                    N = {trades.length}
                                </span>
                            </div>
                        </div>

                        {/* Summary Badges */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-border-subtle/50 text-[10px] font-mono">
                            <span className="text-emerald-400 font-semibold">Calibrated {calibSummary.calibrated}</span>
                            <span className="text-text-muted">•</span>
                            <span className="text-rose-400 font-semibold">Overconfident {calibSummary.overconfident}</span>
                            {calibSummary.underconfident > 0 && (
                                <>
                                    <span className="text-text-muted">•</span>
                                    <span className="text-cyan-400 font-semibold">Underconfident {calibSummary.underconfident}</span>
                                </>
                            )}
                            {calibSummary.tentative > 0 && (
                                <>
                                    <span className="text-text-muted">•</span>
                                    <span className="text-amber-400 font-semibold">Tentative {calibSummary.tentative}</span>
                                </>
                            )}
                            <span className="text-text-muted">•</span>
                            <span className="text-text-tertiary">
                                {calibBinning === 'ADAPTIVE'
                                    ? `Insufficient ${calibSummary.insufficient}`
                                    : `No Trades ${calibSummary.noTrades || 0}`}
                            </span>
                        </div>
                    </div>

                    {/* Momentum Climax / Exhaustion Anomaly Alert */}
                    {exhaustionAnomaly?.detected && (
                        <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col gap-1 text-[11px]">
                            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                                <AlertTriangle size={13} className="text-amber-400" />
                                <span>Momentum Exhaustion Anomaly Detected</span>
                            </div>
                            <p className="text-text-secondary leading-relaxed text-[10px]">
                                Actual win rate peaked at <strong className="text-emerald-400">{exhaustionAnomaly.peakWinRate}%</strong> in {exhaustionAnomaly.peakTier}, but dropped to <strong className="text-amber-400">{exhaustionAnomaly.climaxWinRate}%</strong> in {exhaustionAnomaly.climaxTier} (a {exhaustionAnomaly.dropPct}% drop). In financial markets, maximum indicator consensus often marks late-stage climax runs vulnerable to sharp reversals.
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-2.5">
                        {activeBuckets.map((b) => {
                            const isNoTrades = b.status === 'NO_TRADES' || b.sampleSize === 0;
                            const isInsufficient = b.status === 'INSUFFICIENT_SAMPLE' || (!b.isReliable && !b.isTentative && !isNoTrades);
                            const isTentative = b.isTentative;
                            const isReliable = b.isReliable;
                            const hasWinRate = b.actualWinRate !== null;

                            const isAccurate = isReliable && hasWinRate && Math.abs(b.actualWinRate - b.predictedWinRate) <= 8;
                            const isOverconfident = isReliable && hasWinRate && (b.predictedWinRate - b.actualWinRate > 8);
                            const isUnderconfident = isReliable && hasWinRate && (b.actualWinRate - b.predictedWinRate > 8);

                            return (
                                <div
                                    key={b.bucket}
                                    className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
                                        isNoTrades
                                            ? 'bg-background-surface/20 border-border-subtle/40 opacity-50'
                                            : isInsufficient
                                            ? 'bg-background-surface/30 border-dashed border-border-subtle/60 opacity-60'
                                            : isTentative
                                            ? 'bg-background-surface/50 border-amber-500/30'
                                            : b.isExhaustionAnomaly
                                            ? 'bg-background-surface/70 border-amber-500/40'
                                            : 'bg-background-surface/70 border-border-subtle'
                                    }`}
                                >
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-bold font-mono text-text-primary">{b.bucket}</span>
                                            {b.isExhaustionAnomaly && (
                                                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40" title="Win rate dropped at extreme confidence due to momentum climax">
                                                    Climax Anomaly (-{b.exhaustionDrop}%)
                                                </span>
                                            )}
                                            {isNoTrades ? (
                                                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-zinc-800 text-text-tertiary border border-border-subtle">
                                                    No Trades in Regime
                                                </span>
                                            ) : isInsufficient ? (
                                                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    Insufficient Sample
                                                </span>
                                            ) : isTentative ? (
                                                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                                    Tentative Sample ({b.sampleSize}/20)
                                                </span>
                                            ) : isOverconfident ? (
                                                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                    Overconfident (-{b.predictedWinRate - b.actualWinRate}%)
                                                </span>
                                            ) : isUnderconfident ? (
                                                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                                    Underconfident (+{b.actualWinRate - b.predictedWinRate}%)
                                                </span>
                                            ) : isAccurate ? (
                                                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    Calibrated
                                                </span>
                                            ) : null}
                                        </div>
                                        <span className="text-[10px] text-text-tertiary font-mono">
                                            N = {b.sampleSize}
                                            {b.pctOfTotal !== undefined && ` (${b.pctOfTotal}%)`}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px] mt-0.5">
                                        <div>
                                            <span className="text-[10px] text-text-muted block">
                                                {calibProbability === 'CALIBRATED' ? 'Calibrated Probability:' : 'Predicted Score:'}
                                            </span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-bold font-mono text-blue-400">~{b.predictedWinRate}%</span>
                                                {b.rawPredictedWinRate !== undefined && b.rawPredictedWinRate !== b.predictedWinRate && (
                                                    <span className="text-[9px] text-text-tertiary font-mono" title="Raw Heuristic Score">
                                                        (Raw: {b.rawPredictedWinRate}%)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-text-muted block">Actual Win Rate:</span>
                                            {hasWinRate ? (
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className={`font-bold font-mono ${
                                                        isAccurate
                                                            ? 'text-emerald-400'
                                                            : isUnderconfident
                                                            ? 'text-cyan-400'
                                                            : isTentative
                                                            ? 'text-amber-300'
                                                            : 'text-amber-400'
                                                    }`}>
                                                        {b.actualWinRate}%
                                                    </span>
                                                    {b.ciLower !== null && b.ciUpper !== null && (
                                                        <span className="text-[9px] font-mono text-text-tertiary" title="Wilson Score 95% Confidence Interval">
                                                            [{b.ciLower}%–{b.ciUpper}%]
                                                        </span>
                                                    )}
                                                </div>
                                            ) : isNoTrades ? (
                                                <span className="font-mono text-text-tertiary text-[10px] italic">
                                                    Strategy doesn't trade here
                                                </span>
                                            ) : (
                                                <span className="font-mono text-text-muted text-[10px] italic">
                                                    Needs ~10+ trades
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Visual Comparison Bar rendered when actual win rate is available */}
                                    {hasWinRate && (
                                        <div className="w-full bg-background-app h-2 rounded-full overflow-hidden flex mt-1">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    isAccurate
                                                        ? 'bg-emerald-500'
                                                        : isUnderconfident
                                                        ? 'bg-cyan-500'
                                                        : isTentative
                                                        ? 'bg-amber-400/80 border-r-2 border-amber-300'
                                                        : 'bg-amber-500'
                                                }`}
                                                style={{ width: `${b.actualWinRate}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 3: EVENT LOG VIEW */}
            {activeTab === 'LOG' && (
                <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center justify-between">
                        <span className="text-text-secondary font-medium text-[11px]">
                            {filteredTrades.length} of {trades.length} Executed Signals
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handleExportCsv}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-background-surface hover:bg-background-surface/80 border border-border-subtle text-[10px] font-semibold text-text-primary transition active:scale-95 cursor-pointer"
                                title="Download Event Log CSV"
                            >
                                <Download size={11} />
                                <span>CSV</span>
                            </button>
                            <button
                                onClick={handleExportJson}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-background-surface hover:bg-background-surface/80 border border-border-subtle text-[10px] font-semibold text-text-primary transition active:scale-95 cursor-pointer"
                                title="Download Full JSON Payload"
                            >
                                <Download size={11} />
                                <span>JSON</span>
                            </button>
                        </div>
                    </div>

                    {/* Exit Reason Quick Filter Chips */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                        {[
                            { id: 'ALL', label: `All (${trades.length})`, icon: null },
                            { id: 'TARGET', label: `Target (${targetTradesCount})`, icon: Target },
                            { id: 'STOP', label: `Stop (${stopTradesCount})`, icon: OctagonAlert },
                            { id: 'TRAILING_STOP', label: `Trail (${trailTradesCount})`, icon: Zap },
                            { id: 'HORIZON_EXPIRY', label: `Horizon (${horizonTradesCount})`, icon: Clock },
                            { id: 'BREAKEVEN', label: `BE (${breakevenTradesCount})`, icon: Scale },
                        ].map((f) => {
                            const isSelected = exitFilter === f.id;
                            const IconComp = f.icon;
                            return (
                                <button
                                    key={f.id}
                                    onClick={() => setExitFilter(f.id)}
                                    className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1 ${
                                        isSelected
                                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                                            : 'bg-background-surface text-text-secondary hover:text-text-primary border-border-subtle'
                                    }`}
                                >
                                    {IconComp && <IconComp size={10} />}
                                    <span>{f.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-col gap-1.5 max-h-[calc(100vh-245px)] overflow-y-auto pr-1">
                        {filteredTrades.map((t) => {
                            const isWin = t.outcome === 'WIN';
                            return (
                                <div
                                    key={t.id}
                                    className="p-2 rounded-lg bg-background-surface/70 border border-border-subtle/80 flex flex-col gap-1 hover:border-border-default transition"
                                >
                                    <div className="flex justify-between items-center text-[11px]">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`font-bold font-mono px-1.5 py-0.2 rounded text-[9px] ${
                                                t.direction === 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                            }`}>
                                                {t.direction === 1 ? 'BUY' : 'SELL'}
                                            </span>
                                            <span className="font-semibold text-text-primary truncate max-w-[140px]">
                                                {t.sourceDetail}
                                            </span>
                                        </div>
                                        <span className={`font-bold font-mono ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {isWin ? '+' : ''}{t.returnPct}%
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-[10px] text-text-tertiary">
                                        <span>In: ₹{t.entryPrice} ({formatTimeHuman(t.entryTime)}) → Out: ₹{t.exitPrice || 'Open'}</span>
                                        <span className={`uppercase font-mono text-[9px] font-bold ${
                                            t.exitReason === 'TARGET' ? 'text-emerald-400' : t.exitReason === 'STOP' ? 'text-rose-400' : 'text-amber-400'
                                        }`}>
                                            {t.exitReason} ({t.barsHeld}b)
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 4: HISTORICAL RUNS & COMPARISONS */}
            {activeTab === 'RUNS' && (
                <div className="flex flex-col gap-3">
                    {/* Header bar with actions */}
                    <div className="flex items-center justify-between bg-background-surface/60 p-2 rounded-xl border border-border-subtle">
                        <div className="flex items-center gap-1.5">
                            <History size={14} className="text-accent-primary" />
                            <span className="font-bold text-text-primary text-xs font-mono">
                                Saved Runs ({savedRuns.length})
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            {savedRuns.length > 1 && (
                                <button
                                    onClick={() => setIsCompareModalOpen(true)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[10px] font-bold transition cursor-pointer"
                                    title="Open Full Comparison Matrix"
                                >
                                    <GitCompare size={11} />
                                    <span>Compare Matrix</span>
                                </button>
                            )}

                            {savedRuns.length > 0 && (
                                <button
                                    onClick={() => {
                                        if (window.confirm('Clear all saved simulation runs?')) {
                                            onClearRuns();
                                        }
                                    }}
                                    className="p-1 rounded-md text-text-tertiary hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                    title="Clear All Saved Runs"
                                >
                                    <Trash2 size={13} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Empty State */}
                    {savedRuns.length === 0 ? (
                        <div className="py-12 px-4 rounded-xl border border-dashed border-border-subtle flex flex-col items-center justify-center text-center gap-2 text-text-tertiary">
                            <GitCompare size={28} className="text-text-muted" />
                            <span className="font-bold text-text-secondary text-xs">No Saved Runs Yet</span>
                            <p className="text-[11px] leading-relaxed text-text-tertiary max-w-[220px]">
                                Give your test a name in the bottom left and click <span className="text-accent-primary font-semibold">Run Backtest Simulation</span> to log and benchmark iterations.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1 custom-scrollbar">
                            {savedRuns.map((run) => {
                                const hasSummary = Boolean(run.summary);
                                const wr = run.summary?.winRate ?? 0;
                                const pf = run.summary?.profitFactor ?? 0;
                                const netRet = run.summary?.netReturnPct ?? 0;
                                const dd = run.summary?.maxDrawdownPct ?? 0;

                                // Delta calculations vs current active simulation
                                const curWr = summary?.winRate;
                                const curPf = summary?.profitFactor;
                                const deltaWr = curWr != null && hasSummary ? (wr - curWr).toFixed(1) : null;
                                const deltaPf = curPf != null && hasSummary ? (pf - curPf).toFixed(2) : null;

                                return (
                                    <div
                                        key={run.id}
                                        className="p-3 rounded-xl bg-background-surface/70 border border-border-subtle/80 hover:border-border-default flex flex-col gap-2 transition"
                                    >
                                        {/* Top row: Name & Timestamp */}
                                        <div className="flex items-start justify-between gap-1">
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-text-primary text-[11px] truncate" title={run.name}>
                                                    {run.name}
                                                </span>
                                                <span className="text-[9px] text-text-tertiary">
                                                    {formatRunTimestamp(run.timestamp)}
                                                </span>
                                            </div>

                                            {/* Badges */}
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-background-card border border-border-subtle text-text-secondary">
                                                    {run.unit}
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-text-tertiary bg-background-card/50">
                                                    {run.timeframe}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Key Stats Quad Grid */}
                                        {hasSummary && (
                                            <div className="grid grid-cols-4 gap-1 py-1.5 px-2 rounded-lg bg-background-card/50 border border-border-subtle/60 text-center font-mono">
                                                <div>
                                                    <div className="text-[8px] text-text-tertiary uppercase">WR</div>
                                                    <div className={`text-[11px] font-black ${wr >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {wr}%
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[8px] text-text-tertiary uppercase">PF</div>
                                                    <div className={`text-[11px] font-black ${pf >= 1.5 ? 'text-emerald-400' : pf >= 1.0 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                        {pf}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[8px] text-text-tertiary uppercase">Return</div>
                                                    <div className={`text-[11px] font-black ${netRet > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {netRet > 0 ? '+' : ''}{netRet}%
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[8px] text-text-tertiary uppercase">Max DD</div>
                                                    <div className="text-[11px] font-black text-rose-400">
                                                        -{dd}%
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Delta vs Current Active Simulation */}
                                        {deltaWr !== null && deltaPf !== null && (deltaWr !== '0.0' || deltaPf !== '0.00') && (
                                            <div className="flex items-center justify-between text-[10px] px-1 text-text-tertiary">
                                                <span>vs Current Run:</span>
                                                <div className="flex items-center gap-2 font-mono text-[9px] font-bold">
                                                    <span className={Number(deltaWr) > 0 ? 'text-emerald-400' : Number(deltaWr) < 0 ? 'text-rose-400' : 'text-text-muted'}>
                                                        WR: {Number(deltaWr) > 0 ? '+' : ''}{deltaWr}%
                                                    </span>
                                                    <span className={Number(deltaPf) > 0 ? 'text-emerald-400' : Number(deltaPf) < 0 ? 'text-rose-400' : 'text-text-muted'}>
                                                        PF: {Number(deltaPf) > 0 ? '+' : ''}{deltaPf}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions Row */}
                                        <div className="flex items-center justify-between pt-1 border-t border-border-subtle/50 text-[10px]">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onRestoreRun(run.config, run.name);
                                                    setRestoredRunId(run.id);
                                                    setTimeout(() => setRestoredRunId(null), 2000);
                                                }}
                                                className="flex items-center gap-1 px-2 py-1 rounded bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary font-semibold transition cursor-pointer"
                                                title="Load this test's parameters into the left configuration panel"
                                            >
                                                {restoredRunId === run.id ? (
                                                    <>
                                                        <Check size={11} className="text-emerald-400" />
                                                        <span className="text-emerald-400 font-bold">Settings Loaded!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <RotateCcw size={11} />
                                                        <span>Restore Settings</span>
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => onDeleteRun(run.id)}
                                                className="p-1 rounded text-text-muted hover:text-rose-400 transition cursor-pointer"
                                                title="Delete this run"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Compare Matrix Modal Overlay */}
            {isCompareModalOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-5xl max-h-[85vh] bg-background-card border border-border-subtle rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-background-surface/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                    <GitCompare size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">
                                        Backtest Runs Comparison Matrix
                                    </h3>
                                    <p className="text-xs text-text-tertiary">
                                        Benchmark and rank all saved runs side-by-side across metrics & strategies
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleExportRunsCsv}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background-surface border border-border-subtle hover:border-border-default text-text-secondary hover:text-text-primary text-xs font-semibold transition cursor-pointer"
                                    title="Export runs to CSV"
                                >
                                    <Download size={13} />
                                    <span>Export CSV</span>
                                </button>
                                <button
                                    onClick={() => setIsCompareModalOpen(false)}
                                    className="p-1.5 rounded-lg bg-background-surface border border-border-subtle text-text-tertiary hover:text-text-primary transition cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Sorting Toolbar */}
                        <div className="px-4 py-2 bg-background-surface/30 border-b border-border-subtle flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-text-tertiary font-medium">Sort By:</span>
                                {[
                                    { id: 'timestamp', label: 'Recent Date' },
                                    { id: 'winRate', label: 'Win Rate' },
                                    { id: 'profitFactor', label: 'Profit Factor' },
                                    { id: 'netReturnPct', label: 'Net Return' },
                                    { id: 'drawdown', label: 'Lowest Drawdown' },
                                ].map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setMatrixSortBy(s.id)}
                                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                                            matrixSortBy === s.id
                                                ? 'bg-blue-600 text-white font-bold'
                                                : 'text-text-tertiary hover:text-text-primary bg-background-surface border border-border-subtle'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                            <span className="text-[11px] text-text-tertiary font-mono">
                                Total Saved: {savedRuns.length} runs
                            </span>
                        </div>

                        {/* Modal Table Content */}
                        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                            <table className="w-full text-left text-xs border-collapse font-sans">
                                <thead>
                                    <tr className="border-b border-border-subtle text-text-tertiary text-[11px] uppercase font-mono">
                                        <th className="pb-2.5 font-bold">Run Name</th>
                                        <th className="pb-2.5 font-bold">Unit / Strategy</th>
                                        <th className="pb-2.5 font-bold">Instrument</th>
                                        <th className="pb-2.5 font-bold text-center">Trades</th>
                                        <th className="pb-2.5 font-bold text-right">Win Rate</th>
                                        <th className="pb-2.5 font-bold text-right">Profit Factor</th>
                                        <th className="pb-2.5 font-bold text-right">Sharpe</th>
                                        <th className="pb-2.5 font-bold text-right">CAGR</th>
                                        <th className="pb-2.5 font-bold text-right">Net Return</th>
                                        <th className="pb-2.5 font-bold text-right">Max DD</th>
                                        <th className="pb-2.5 font-bold text-right">Date</th>
                                        <th className="pb-2.5 font-bold text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle/50 font-mono text-[11px]">
                                    {sortedRuns.map((r) => {
                                        const isBestWr = r.summary?.winRate === maxWr && maxWr > 0;
                                        const isBestPf = r.summary?.profitFactor === maxPf && maxPf > 0;
                                        const isBestRet = r.summary?.netReturnPct === maxRet && maxRet > 0;
                                        const isBestDd = r.summary?.maxDrawdownPct === minDd;

                                        return (
                                            <tr key={r.id} className="hover:bg-background-surface/40 transition">
                                                <td className="py-2.5 font-sans font-bold text-text-primary max-w-[180px] truncate" title={r.name}>
                                                    {r.name}
                                                </td>
                                                <td className="py-2.5">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                        {r.unit}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 text-text-secondary uppercase">
                                                    {r.instrument?.includes('|') ? r.instrument.split('|')[1] : r.instrument} ({r.timeframe})
                                                </td>
                                                <td className="py-2.5 text-center text-text-tertiary">
                                                    <span className="text-text-primary font-bold">{r.summary?.totalTrades || 0}</span>
                                                    <span className="text-[10px] ml-1">({r.summary?.wins}W/{r.summary?.losses}L)</span>
                                                </td>
                                                <td className="py-2.5 text-right font-black">
                                                    <span className={`${r.summary?.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'} ${isBestWr ? 'bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30' : ''}`}>
                                                        {r.summary?.winRate}%
                                                    </span>
                                                </td>
                                                <td className="py-2.5 text-right font-black">
                                                    <span className={`${r.summary?.profitFactor >= 1.5 ? 'text-emerald-400' : r.summary?.profitFactor >= 1.0 ? 'text-amber-400' : 'text-rose-400'} ${isBestPf ? 'bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30' : ''}`}>
                                                        {r.summary?.profitFactor}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 text-right font-black text-blue-400">
                                                    {r.summary?.sharpeRatio ?? '—'}
                                                </td>
                                                <td className="py-2.5 text-right font-black text-emerald-400">
                                                    {r.summary?.cagr ? `${r.summary.cagr}%` : '—'}
                                                </td>
                                                <td className="py-2.5 text-right font-black">
                                                    <span className={`${r.summary?.netReturnPct > 0 ? 'text-emerald-400' : 'text-rose-400'} ${isBestRet ? 'bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30' : ''}`}>
                                                        {r.summary?.netReturnPct > 0 ? '+' : ''}{r.summary?.netReturnPct}%
                                                    </span>
                                                </td>
                                                <td className="py-2.5 text-right font-black text-rose-400">
                                                    <span className={isBestDd ? 'bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20' : ''}>
                                                        -{r.summary?.maxDrawdownPct}%
                                                    </span>
                                                </td>
                                                <td className="py-2.5 text-right text-text-tertiary text-[10px]">
                                                    {formatRunTimestamp(r.timestamp)}
                                                </td>
                                                <td className="py-2.5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => {
                                                                onRestoreRun(r.config, r.name);
                                                                setIsCompareModalOpen(false);
                                                            }}
                                                            className="px-2 py-0.5 rounded bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary text-[10px] font-bold font-sans transition cursor-pointer"
                                                            title="Restore this test's settings into configuration"
                                                        >
                                                            Restore
                                                        </button>
                                                        <button
                                                            onClick={() => onDeleteRun(r.id)}
                                                            className="p-1 rounded text-text-tertiary hover:text-rose-400 transition cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-3 border-t border-border-subtle bg-background-surface/50 flex items-center justify-between text-xs text-text-tertiary">
                            <span>Highest-performing metrics highlighted automatically.</span>
                            <button
                                onClick={() => setIsCompareModalOpen(false)}
                                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
