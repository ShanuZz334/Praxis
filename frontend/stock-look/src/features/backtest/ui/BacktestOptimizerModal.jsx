/**
 * @file BacktestOptimizerModal.jsx
 * @purpose High-grade interactive modal for the Auto-Calibration & Parameter Optimization Engine.
 * Runs multi-variable parameter sweeps across historical candles, provides side-by-side
 * comparison of Current Baseline vs 3 Calibrated Champions, and applies tuned parameters with 1 click.
 * @date 2026-09-13
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Zap, Cpu, Award, ShieldCheck, Check, ArrowRight, 
    RefreshCw, ChevronDown, ChevronUp, X, Sparkles, TrendingUp,
    BarChart2, Flame, Layers, AlertTriangle, Search, Filter,
    CheckCircle2, Target, Sliders, Activity, Star
} from 'lucide-react';
import { runAutoCalibration } from '../engine/optimizerEngine';

export default function BacktestOptimizerModal({
    isOpen,
    onClose,
    candles,
    activeConfig,
    instrumentLabel,
    onApplyCalibration,
}) {
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState(null);
    const [calibResult, setCalibResult] = useState(null);
    const [selectedChampionId, setSelectedChampionId] = useState('BALANCED');
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboardSort, setLeaderboardSort] = useState('fitness');
    const [searchQuery, setSearchQuery] = useState('');
    const [archetypeFilter, setArchetypeFilter] = useState('ALL');
    const [appliedId, setAppliedId] = useState(null);

    // Auto-run calibration when modal opens
    useEffect(() => {
        if (!isOpen) return;
        if (!candles || candles.length < 30) {
            setIsRunning(false);
            setError('Insufficient historical candle data loaded. Please wait for candles to stream or select a different range.');
            return;
        }
        setError(null);
        setIsRunning(true);
        setAppliedId(null);

        const timer = setTimeout(() => {
            try {
                const res = runAutoCalibration(candles, activeConfig);
                setCalibResult(res);
                setSelectedChampionId('BALANCED');
                setError(null);
            } catch (err) {
                console.error('Calibration error:', err);
                setError(err.message || 'Calibration run failed');
            } finally {
                setIsRunning(false);
            }
        }, 120);

        return () => clearTimeout(timer);
    }, [isOpen, candles, activeConfig]);

    // Close on Escape key press
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleReRun = () => {
        if (!candles || candles.length < 30) {
            setError('Insufficient historical candle data (min 30 candles required).');
            return;
        }
        setIsRunning(true);
        setError(null);
        setAppliedId(null);
        setTimeout(() => {
            try {
                const res = runAutoCalibration(candles, activeConfig);
                setCalibResult(res);
                setError(null);
            } catch (err) {
                console.error('Calibration error:', err);
                setError(err.message || 'Calibration re-run failed');
            } finally {
                setIsRunning(false);
            }
        }, 150);
    };

    const handleApply = (champ) => {
        if (!champ) return;
        setAppliedId(champ.type);
        onApplyCalibration(champ.config, `Calibrated: ${champ.title}`);
        setTimeout(() => {
            onClose();
        }, 400);
    };

    const sortedLeaderboard = useMemo(() => {
        if (!calibResult?.leaderboard) return [];
        let list = [...calibResult.leaderboard];

        // Filter by Archetype
        if (archetypeFilter !== 'ALL') {
            list = list.filter(c => c.archetype === archetypeFilter);
        }

        // Filter by Search Query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(c => 
                (c.label || '').toLowerCase().includes(q) ||
                (c.archetype || '').toLowerCase().includes(q)
            );
        }

        // Sort
        if (leaderboardSort === 'winRate') {
            return list.sort((a, b) => (b.summary?.winRate ?? 0) - (a.summary?.winRate ?? 0));
        }
        if (leaderboardSort === 'profitFactor') {
            return list.sort((a, b) => (b.summary?.profitFactor ?? 0) - (a.summary?.profitFactor ?? 0));
        }
        if (leaderboardSort === 'netReturnPct') {
            return list.sort((a, b) => (b.summary?.netReturnPct ?? 0) - (a.summary?.netReturnPct ?? 0));
        }
        if (leaderboardSort === 'drawdown') {
            return list.sort((a, b) => (a.summary?.maxDrawdownPct ?? 999) - (b.summary?.maxDrawdownPct ?? 999));
        }
        if (leaderboardSort === 'oosRatio') {
            return list.sort((a, b) => (b.walkForward?.efficiencyRatio ?? 0) - (a.walkForward?.efficiencyRatio ?? 0));
        }
        return list.sort((a, b) => (b.fitness ?? 0) - (a.fitness ?? 0));
    }, [calibResult, leaderboardSort, archetypeFilter, searchQuery]);

    const selectedChampion = useMemo(() => {
        if (!calibResult?.champions) return null;
        return calibResult.champions.find(c => c.type === selectedChampionId) || calibResult.champions[0];
    }, [calibResult, selectedChampionId]);

    if (!isOpen) return null;

    const base = calibResult?.baseline?.summary || {};

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-6xl min-h-[520px] max-h-[92vh] bg-background-card border border-border-subtle rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
                
                {/* 1. Modal Header */}
                <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-background-surface/60">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
                            <Zap size={20} className="fill-blue-400/20" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">
                                    Algorithmic Auto-Calibration Studio
                                </h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {activeConfig.unit}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-background-card border border-border-subtle text-text-tertiary">
                                    {instrumentLabel} • {activeConfig.timeframe}
                                </span>
                            </div>
                            <p className="text-xs text-text-tertiary mt-0.5">
                                Multi-variable parameter sweep validated against 70/30 Walk-Forward out-of-sample data
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {calibResult && (
                            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                                Scanned {calibResult.totalScanned} combinations in {calibResult.elapsedMs}ms
                            </span>
                        )}

                        <button
                            onClick={handleReRun}
                            disabled={isRunning}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background-surface border border-border-subtle hover:border-border-default text-text-secondary hover:text-text-primary text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                            title="Re-run calibration sweep"
                        >
                            <RefreshCw size={13} className={isRunning ? 'animate-spin' : ''} />
                            <span>Re-Scan</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-background-surface border border-border-subtle text-text-tertiary hover:text-text-primary transition cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* 2. Loading State */}
                {isRunning ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-16 gap-3">
                        <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin flex items-center justify-center">
                            <Zap size={18} className="text-blue-400 animate-pulse" />
                        </div>
                        <span className="text-xs font-bold font-mono uppercase tracking-wider text-text-primary mt-2">
                            Simulating Multi-Parameter Grid Across Historical Bars...
                        </span>
                        <p className="text-[11px] text-text-tertiary">
                            Testing targets, stops, horizons, and filtering out curve-fitted parameters via out-of-sample validation
                        </p>
                    </div>
                ) : calibResult ? (
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                        
                        {/* 1. Institutional KPI Summary Ribbon */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 p-2.5 rounded-xl bg-background-surface/50 border border-border-subtle font-mono">
                            <div className="flex items-center gap-2 px-2 border-r border-border-subtle/50">
                                <Activity size={14} className="text-blue-400 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[8px] text-text-tertiary uppercase truncate">Permutations Swept</div>
                                    <div className="text-xs font-bold text-text-primary">{calibResult.totalScanned} Tested ({calibResult.elapsedMs}ms)</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-2 border-r border-border-subtle/50">
                                <TrendingUp size={14} className="text-emerald-400 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[8px] text-text-tertiary uppercase truncate">Peak Win Rate</div>
                                    <div className="text-xs font-bold text-emerald-400">{calibResult.bestWinRate}%</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-2 border-r border-border-subtle/50">
                                <Flame size={14} className="text-amber-400 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[8px] text-text-tertiary uppercase truncate">Peak Profit Factor</div>
                                    <div className="text-xs font-bold text-amber-400">{calibResult.bestProfitFactor}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-2 border-r border-border-subtle/50">
                                <ShieldCheck size={14} className="text-cyan-400 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[8px] text-text-tertiary uppercase truncate">Lowest Drawdown</div>
                                    <div className="text-xs font-bold text-cyan-400">-{calibResult.lowestDrawdown}%</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-2">
                                <Award size={14} className="text-purple-400 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[8px] text-text-tertiary uppercase truncate">Walk-Forward Validity</div>
                                    <div className="text-xs font-bold text-purple-400">{calibResult.oosPassRate}% Robust</div>
                                </div>
                            </div>
                        </div>

                        {/* Benchmark Quad Grid (1 Baseline + 3 Calibrated Champions) */}
                        <div className="flex items-center justify-between px-1 mt-0.5">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider font-mono text-text-secondary">
                                    Current Baseline vs. Calibrated Champions
                                </span>
                            </div>
                            <span className="text-[10px] text-text-muted">
                                Click any champion to inspect full parameters & apply
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            
                            {/* Card 0: CURRENT BASELINE */}
                            <div className="p-3.5 rounded-xl bg-background-surface/40 border border-border-subtle flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                                            Current Baseline
                                        </span>
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-background-card border border-border-subtle text-text-muted">
                                            Active
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-text-secondary">
                                        Uncalibrated Setup
                                    </h4>
                                    <p className="text-[10px] text-text-muted mt-0.5 leading-tight">
                                        Target: {activeConfig.exitRule?.targetPct ?? 2.5}%, Stop: {activeConfig.exitRule?.stopPct ?? 1.25}%, Horizon: {activeConfig.exitRule?.horizonBars ?? 14}b
                                    </p>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-2 gap-2 mt-3 p-2 rounded-lg bg-background-card/50 border border-border-subtle/50 font-mono">
                                        <div>
                                            <div className="text-[8px] text-text-muted uppercase">Win Rate</div>
                                            <div className="text-sm font-black text-text-secondary">{base.winRate ?? 0}%</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] text-text-muted uppercase">Profit Factor</div>
                                            <div className="text-sm font-black text-text-secondary">{base.profitFactor ?? 0}</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] text-text-muted uppercase">Net Return</div>
                                            <div className="text-sm font-black text-text-secondary">
                                                {(base.netReturnPct ?? 0) > 0 ? '+' : ''}{base.netReturnPct ?? 0}%
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] text-text-muted uppercase">Max DD</div>
                                            <div className="text-sm font-black text-rose-400/80">-{base.maxDrawdownPct ?? 0}%</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 pt-2 border-t border-border-subtle/40 text-[10px] text-text-muted font-mono flex items-center justify-between">
                                    <span>Trades: {base.totalTrades ?? 0} ({base.wins ?? 0}W/{base.losses ?? 0}L)</span>
                                    <span>Sharpe: {base.sharpeRatio ?? 0}</span>
                                </div>
                            </div>

                            {/* Cards 1, 2, 3: THE 3 CHAMPIONS */}
                            {calibResult.champions.map((champ) => {
                                const isSelected = selectedChampionId === champ.type;
                                const isApplied = appliedId === champ.type;
                                const s = champ.summary || {};
                                const d = champ.deltas || {};
                                const wfe = Math.round((champ.walkForward?.efficiencyRatio || 1) * 100);

                                const isBalanced = champ.type === 'BALANCED';
                                const isSniper = champ.type === 'MAX_WIN_RATE';
                                const isShield = champ.type === 'CAPITAL_SHIELD';

                                const themeBorder = isBalanced ? 'border-blue-500/80 ring-1 ring-blue-500/40' : isSniper ? 'border-amber-500/80 ring-1 ring-amber-500/40' : 'border-emerald-500/80 ring-1 ring-emerald-500/40';

                                return (
                                    <div
                                        key={champ.type}
                                        onClick={() => setSelectedChampionId(champ.type)}
                                        className={`p-3.5 rounded-xl border flex flex-col justify-between transition cursor-pointer relative ${
                                            isSelected
                                                ? `bg-background-surface shadow-xl ${themeBorder}`
                                                : 'bg-background-surface/70 border-border-subtle hover:border-border-default'
                                        }`}
                                    >
                                        {/* Highlight Badge */}
                                        {isBalanced && (
                                            <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase bg-blue-500 text-white shadow flex items-center gap-1">
                                                <Star size={9} fill="currentColor" />
                                                <span>Core Alpha</span>
                                            </span>
                                        )}

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                                                    isBalanced ? 'text-blue-400' : isSniper ? 'text-amber-400' : 'text-emerald-400'
                                                }`}>
                                                    {champ.badge}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold" title="Walk-Forward Out-of-Sample Efficiency Ratio">
                                                        WFE {wfe}%
                                                    </span>
                                                </div>
                                            </div>

                                            <h4 className="text-xs font-black text-text-primary flex items-center justify-between">
                                                <span>{champ.title}</span>
                                            </h4>
                                            <p className="text-[10px] text-text-tertiary mt-0.5 leading-tight line-clamp-2">
                                                {champ.tagline}
                                            </p>

                                            {/* Metrics Quad with Deltas */}
                                            <div className="grid grid-cols-2 gap-2 mt-3 p-2 rounded-lg bg-background-card border border-border-subtle font-mono">
                                                <div>
                                                    <div className="text-[8px] text-text-tertiary uppercase flex items-center justify-between">
                                                        <span>Win Rate</span>
                                                        <span className={d.winRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                            {d.winRate >= 0 ? '+' : ''}{d.winRate}%
                                                        </span>
                                                    </div>
                                                    <div className={`text-sm font-black ${s.winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                        {s.winRate}%
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-[8px] text-text-tertiary uppercase flex items-center justify-between">
                                                        <span>Profit Factor</span>
                                                        <span className={d.profitFactor >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                            {d.profitFactor >= 0 ? '+' : ''}{d.profitFactor}
                                                        </span>
                                                    </div>
                                                    <div className={`text-sm font-black ${s.profitFactor >= 1.5 ? 'text-emerald-400' : s.profitFactor >= 1.0 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                        {s.profitFactor}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-[8px] text-text-tertiary uppercase flex items-center justify-between">
                                                        <span>Net Return</span>
                                                        <span className={d.netReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                            {d.netReturnPct >= 0 ? '+' : ''}{d.netReturnPct}%
                                                        </span>
                                                    </div>
                                                    <div className={`text-sm font-black ${s.netReturnPct > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {s.netReturnPct > 0 ? '+' : ''}{s.netReturnPct}%
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-[8px] text-text-tertiary uppercase flex items-center justify-between">
                                                        <span>Max DD</span>
                                                        <span className={d.maxDrawdownPct <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                            {d.maxDrawdownPct <= 0 ? '' : '+'}{d.maxDrawdownPct}%
                                                        </span>
                                                    </div>
                                                    <div className="text-sm font-black text-rose-400">
                                                        -{s.maxDrawdownPct}%
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Key Tuning Changes */}
                                            <div className="mt-2.5 flex flex-col gap-1">
                                                <span className="text-[9px] font-mono uppercase tracking-wider text-text-tertiary font-bold">
                                                    Key Calibrations:
                                                </span>
                                                <ul className="text-[10px] text-text-secondary space-y-0.5 min-h-[38px]">
                                                    {champ.tuningHighlights.slice(0, 2).map((h, idx) => (
                                                        <li key={idx} className="flex items-start gap-1 leading-tight">
                                                            <span className="text-accent-primary font-bold">•</span>
                                                            <span className="truncate">{h}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* 1-Click Apply Button */}
                                        <div className="mt-3.5 pt-2 border-t border-border-subtle">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleApply(champ);
                                                }}
                                                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                                    isApplied
                                                        ? 'bg-emerald-600 text-white shadow-md'
                                                        : isSelected
                                                        ? isBalanced
                                                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25'
                                                            : isSniper
                                                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/25'
                                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25'
                                                        : 'bg-background-surface hover:bg-background-subtle border border-border-subtle text-text-primary'
                                                }`}
                                            >
                                                {isApplied ? (
                                                    <>
                                                        <Check size={13} className="animate-bounce" />
                                                        <span>Applied to Workshop!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={13} />
                                                        <span>Apply {champ.title.split(' ')[0]}</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 2. Selected Champion Deep Dive & Parameter Comparison Inspector */}
                        {selectedChampion && (
                            <div className="border border-border-subtle rounded-xl p-3.5 bg-background-surface/40 flex flex-col gap-3">
                                <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                                    <div className="flex items-center gap-2">
                                        <Target size={15} className="text-accent-primary" />
                                        <span className="text-xs font-bold uppercase tracking-wider font-mono text-text-primary">
                                            Deep Parameter Comparison: {selectedChampion.title}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                                            {selectedChampion.badge}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleApply(selectedChampion)}
                                        className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                                    >
                                        <CheckCircle2 size={13} />
                                        <span>Apply This Setup Now</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                    {/* Left: Baseline Setup */}
                                    <div className="p-3 rounded-lg bg-background-card/60 border border-border-subtle flex flex-col gap-2 font-mono">
                                        <div className="text-[10px] uppercase font-bold text-text-muted border-b border-border-subtle/50 pb-1 flex justify-between">
                                            <span>Current Baseline</span>
                                            <span className="text-text-secondary">Uncalibrated</span>
                                        </div>
                                        <div className="space-y-1 text-[11px]">
                                            <div className="flex justify-between">
                                                <span className="text-text-tertiary">Exit Mechanism:</span>
                                                <span className="text-text-primary font-bold">{activeConfig.exitRule?.type || 'TARGET_STOP'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-tertiary">Target / Stop:</span>
                                                <span className="text-text-primary font-bold">{activeConfig.exitRule?.targetPct ?? 2.5}% / {activeConfig.exitRule?.stopPct ?? 1.25}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-tertiary">Theoretical R:R:</span>
                                                <span className="text-text-primary font-bold">
                                                    {activeConfig.exitRule?.stopPct ? (activeConfig.exitRule.targetPct / activeConfig.exitRule.stopPct).toFixed(1) : '—'}:1
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-tertiary">Breakeven Stop Lock:</span>
                                                <span className="text-text-secondary">{activeConfig.exitRule?.lockBreakeven ? 'Active' : 'Disabled'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-tertiary">Conviction Filter:</span>
                                                <span className="text-text-secondary">{activeConfig.minConfidence ? `≥ ${activeConfig.minConfidence}%` : 'Unfiltered'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-tertiary">Holding Horizon:</span>
                                                <span className="text-text-secondary">{activeConfig.exitRule?.enableHorizonTimeout ? `${activeConfig.exitRule?.horizonBars || 14} bars` : 'Disabled (Pure Target)'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Center: Institutional Rationale & Diffs */}
                                    <div className="p-3 rounded-lg bg-background-card/60 border border-border-subtle flex flex-col gap-2">
                                        <div className="text-[10px] uppercase font-bold text-accent-primary border-b border-border-subtle/50 pb-1 flex justify-between font-mono">
                                            <span>Calibration Vector</span>
                                            <span>Institutional Tuning</span>
                                        </div>
                                        <ul className="text-[11px] text-text-secondary space-y-1.5 mt-0.5">
                                            {selectedChampion.tuningHighlights.map((h, i) => (
                                                <li key={i} className="flex items-start gap-1.5 leading-tight">
                                                    <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                                                    <span>{h}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-auto pt-2 border-t border-border-subtle/40 flex items-center justify-between text-[10px] font-mono text-text-tertiary">
                                            <span>OOS Robustness Ratio:</span>
                                            <span className="text-purple-300 font-bold">
                                                {selectedChampion.walkForward?.efficiencyRatio ? `${Math.round(selectedChampion.walkForward.efficiencyRatio * 100)}%` : '100%'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: Calibrated Champion Setup */}
                                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/30 flex flex-col gap-2 font-mono">
                                        <div className="text-[10px] uppercase font-bold text-blue-400 border-b border-blue-500/20 pb-1 flex justify-between">
                                            <span>Calibrated Setup</span>
                                            <span className="text-emerald-400 font-bold">+{selectedChampion.deltas?.netReturnPct ?? 0}% Net</span>
                                        </div>
                                        <div className="space-y-1 text-[11px]">
                                            <div className="flex justify-between">
                                                <span className="text-text-tertiary">Exit Mechanism:</span>
                                                <span className="text-blue-300 font-bold">{selectedChampion.config?.exitRule?.type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-tertiary">Target / Stop:</span>
                                                <span className="text-emerald-400 font-bold">
                                                    {selectedChampion.config?.exitRule?.targetPct}% / {selectedChampion.config?.exitRule?.stopPct}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-tertiary">Theoretical R:R:</span>
                                                <span className="text-blue-300 font-bold">
                                                    {selectedChampion.config?.exitRule?.stopPct ? (selectedChampion.config.exitRule.targetPct / selectedChampion.config.exitRule.stopPct).toFixed(1) : '—'}:1
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-tertiary">Breakeven Stop Lock:</span>
                                                <span className={selectedChampion.config?.exitRule?.lockBreakeven ? 'text-emerald-400 font-bold' : 'text-text-secondary'}>
                                                    {selectedChampion.config?.exitRule?.lockBreakeven ? 'Active (50% Target)' : 'Disabled'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-tertiary">Conviction Filter:</span>
                                                <span className={selectedChampion.config?.minConfidence ? 'text-emerald-400 font-bold' : 'text-text-secondary'}>
                                                    {selectedChampion.config?.minConfidence ? `≥ ${selectedChampion.config.minConfidence}%` : 'Unfiltered'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-tertiary">Holding Horizon:</span>
                                                <span className="text-text-primary">
                                                    {selectedChampion.config?.exitRule?.enableHorizonTimeout ? `${selectedChampion.config.exitRule.horizonBars} bars` : 'Disabled (Pure Target)'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Expandable Full Parameter Sweep Leaderboard */}
                        <div className="mt-1 border border-border-subtle rounded-xl overflow-hidden bg-background-surface/40">
                            <button
                                type="button"
                                onClick={() => setShowLeaderboard(!showLeaderboard)}
                                className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono font-bold text-text-secondary hover:text-text-primary hover:bg-background-surface transition cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <BarChart2 size={14} className="text-accent-primary" />
                                    <span>Full Parameter Sweep Matrix ({sortedLeaderboard.length} of {calibResult.leaderboard.length} Permutations)</span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
                                    <span>{showLeaderboard ? 'Collapse Matrix' : 'Explore Sweep Matrix'}</span>
                                    {showLeaderboard ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                            </button>

                            {showLeaderboard && (
                                <div className="p-3 border-t border-border-subtle flex flex-col gap-2.5">
                                    {/* Search & Archetype Filter Bar */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border-subtle text-xs">
                                        <div className="flex items-center gap-1.5 flex-1 min-w-[200px] max-w-sm bg-background-card rounded-lg px-2.5 py-1 border border-border-subtle">
                                            <Search size={12} className="text-text-tertiary" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Filter parameters (e.g. BE Lock, 2.0:1, Trail)..."
                                                className="bg-transparent border-none outline-none text-xs text-text-primary w-full placeholder:text-text-muted"
                                            />
                                            {searchQuery && (
                                                <button onClick={() => setSearchQuery('')} className="text-text-tertiary hover:text-text-primary">
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Archetype Filter Tabs */}
                                        <div className="flex items-center gap-1">
                                            {[
                                                { id: 'ALL', label: 'All' },
                                                { id: 'TARGET_STOP', label: 'Pure Target/Stop' },
                                                { id: 'BREAKEVEN_LOCK', label: 'BE Lock' },
                                                { id: 'TRAILING_STOP', label: 'Trailing Stop' },
                                                { id: 'ADAPTIVE_HORIZON', label: 'Safety Horizon' },
                                            ].map(f => (
                                                <button
                                                    key={f.id}
                                                    onClick={() => setArchetypeFilter(f.id)}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                                                        archetypeFilter === f.id
                                                            ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/40 font-bold'
                                                            : 'text-text-tertiary hover:text-text-primary bg-background-surface border border-transparent'
                                                    }`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Sort Options */}
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-text-tertiary uppercase font-mono">Sort:</span>
                                            {[
                                                { id: 'fitness', label: 'Fitness' },
                                                { id: 'winRate', label: 'Win Rate' },
                                                { id: 'profitFactor', label: 'PF' },
                                                { id: 'netReturnPct', label: 'Net Return' },
                                                { id: 'drawdown', label: 'Max DD' },
                                                { id: 'oosRatio', label: 'WFE' },
                                            ].map(s => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => setLeaderboardSort(s.id)}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                                                        leaderboardSort === s.id
                                                            ? 'bg-blue-600 text-white font-bold'
                                                            : 'text-text-tertiary hover:text-text-primary bg-background-surface'
                                                    }`}
                                                >
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="max-h-[260px] overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left text-xs border-collapse font-sans">
                                            <thead>
                                                <tr className="border-b border-border-subtle text-text-tertiary text-[10px] uppercase font-mono sticky top-0 bg-background-card z-10">
                                                    <th className="pb-1.5 font-bold">Candidate Permutation</th>
                                                    <th className="pb-1.5 font-bold text-center">Trades</th>
                                                    <th className="pb-1.5 font-bold text-right">Win Rate</th>
                                                    <th className="pb-1.5 font-bold text-right">PF</th>
                                                    <th className="pb-1.5 font-bold text-right">Net Return</th>
                                                    <th className="pb-1.5 font-bold text-right">Max DD</th>
                                                    <th className="pb-1.5 font-bold text-center">WFE</th>
                                                    <th className="pb-1.5 font-bold text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-subtle/50 font-mono text-[11px]">
                                                {sortedLeaderboard.map((cand, idx) => (
                                                    <tr key={cand.id} className="hover:bg-background-surface/50 transition">
                                                        <td className="py-1.5 font-sans font-bold text-text-primary truncate max-w-[280px]">
                                                            <span className="text-text-muted mr-1.5 font-mono">#{idx + 1}</span>
                                                            <span>{cand.label}</span>
                                                        </td>
                                                        <td className="py-1.5 text-center text-text-tertiary text-[10px]">
                                                            {cand.summary?.totalTrades} ({cand.summary?.wins}W/{cand.summary?.losses}L)
                                                        </td>
                                                        <td className="py-1.5 text-right font-black">
                                                            <span className={cand.summary?.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}>
                                                                {cand.summary?.winRate}%
                                                            </span>
                                                        </td>
                                                        <td className="py-1.5 text-right font-black">
                                                            <span className={cand.summary?.profitFactor >= 1.5 ? 'text-emerald-400' : cand.summary?.profitFactor >= 1.0 ? 'text-amber-400' : 'text-rose-400'}>
                                                                {cand.summary?.profitFactor}
                                                            </span>
                                                        </td>
                                                        <td className="py-1.5 text-right font-black">
                                                            <span className={cand.summary?.netReturnPct > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                                {cand.summary?.netReturnPct > 0 ? '+' : ''}{cand.summary?.netReturnPct}%
                                                            </span>
                                                        </td>
                                                        <td className="py-1.5 text-right font-black text-rose-400">
                                                            -{cand.summary?.maxDrawdownPct}%
                                                        </td>
                                                        <td className="py-1.5 text-center text-[10px] text-purple-300 font-bold">
                                                            {Math.round((cand.walkForward?.efficiencyRatio || 1) * 100)}%
                                                        </td>
                                                        <td className="py-1.5 text-center">
                                                            {appliedId === cand.id ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold font-sans">
                                                                    <Check size={10} />
                                                                    Applied
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleApply({
                                                                        type: cand.id,
                                                                        title: cand.label,
                                                                        config: cand.config
                                                                    })}
                                                                    className="px-2 py-0.5 rounded bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-bold font-sans transition cursor-pointer"
                                                                >
                                                                    Apply
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3 text-center">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                            <AlertTriangle size={22} />
                        </div>
                        <h4 className="text-sm font-bold text-text-primary">Calibration Notice</h4>
                        <p className="text-xs text-text-tertiary max-w-md">{error}</p>
                        <button
                            type="button"
                            onClick={handleReRun}
                            className="mt-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                            Retry Calibration
                        </button>
                    </div>
                ) : null}

                {/* 4. Modal Footer */}
                <div className="p-3 border-t border-border-subtle bg-background-surface/60 flex items-center justify-between text-xs text-text-tertiary">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        <span className="text-[11px]">
                            All calibrated parameters pass out-of-sample Walk-Forward thresholds to protect against curve-fitting.
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg bg-background-surface border border-border-subtle hover:border-border-default text-text-secondary hover:text-text-primary font-bold text-xs transition cursor-pointer"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
}
