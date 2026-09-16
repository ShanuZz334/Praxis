/**
 * @file BacktestingWorkshop.jsx
 * @purpose Dedicated high-end Backtesting Workshop page shell.
 * Isolated full-bleed layout with no shared Navbar or Sidebar.
 * @date 2026-09-12
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, RefreshCw, AlertCircle, Check, X, Sparkles } from 'lucide-react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { useTheme } from '@/shared/context/ThemeContext';
import { FO_INDICES, FO_EQUITIES } from '@/shared/utils/foInstruments';
import Loader from '@/shared/components/ui/Loader';
import BacktestHeader from '../ui/BacktestHeader';
import BacktestConfigPanel, { TESTABLE_UNITS } from '../ui/BacktestConfigPanel';
import BacktestReplayChart from '../ui/BacktestReplayChart';
import BacktestScorecard from '../ui/BacktestScorecard';
import BacktestEquityCurve from '../ui/BacktestEquityCurve';
import BacktestOptimizerModal from '../ui/BacktestOptimizerModal';
import { runBacktest, DEFAULT_BACKTEST_CONFIG, TIMEFRAME_DEFAULTS } from '../engine/backtestEngine';

export default function BacktestingWorkshop() {
    const navigate = useNavigate();
    const { theme } = useTheme();

    const [config, setConfig] = useState(() => {
        const fallback = {
            ...DEFAULT_BACKTEST_CONFIG,
            instrument: 'NSE_INDEX|Nifty 50',
            timeframe: 'day',
            mode: 'swing',
        };
        try {
            const raw = localStorage.getItem('praxis_backtest_active_config');
            if (raw) {
                const parsed = JSON.parse(raw);
                return {
                    ...fallback,
                    ...parsed,
                    exitRule: {
                        ...fallback.exitRule,
                        ...(parsed.exitRule || {}),
                    },
                    slippageModel: parsed.slippageModel || fallback.slippageModel,
                    walkForward: {
                        ...fallback.walkForward,
                        ...(parsed.walkForward || {}),
                    },
                    customRules: {
                        ...fallback.customRules,
                        ...(parsed.customRules || {}),
                    },
                };
            }
        } catch (e) {
            console.error('Failed to load saved backtest config from localStorage', e);
        }
        return fallback;
    });

    const [candles, setCandles] = useState([]);
    const [loadingCandles, setLoadingCandles] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    const [runName, setRunName] = useState(() => {
        try {
            return localStorage.getItem('praxis_backtest_run_name') || 'Run #1: AI Predictor 7-Bar';
        } catch (e) {
            return 'Run #1: AI Predictor 7-Bar';
        }
    });

    const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);

    const [isLeftOpen, setIsLeftOpen] = useState(() => {
        try {
            const saved = localStorage.getItem('praxis_backtest_left_open');
            return saved !== null ? saved === 'true' : true;
        } catch (e) {
            return true;
        }
    });

    const [isRightOpen, setIsRightOpen] = useState(() => {
        try {
            const saved = localStorage.getItem('praxis_backtest_right_open');
            return saved !== null ? saved === 'true' : true;
        } catch (e) {
            return true;
        }
    });

    // Persist active configuration to localStorage whenever it updates
    useEffect(() => {
        try {
            localStorage.setItem('praxis_backtest_active_config', JSON.stringify(config));
        } catch (e) {
            console.error('Failed to persist backtest config', e);
        }
    }, [config]);

    // Persist current run name
    useEffect(() => {
        try {
            if (runName) {
                localStorage.setItem('praxis_backtest_run_name', runName);
            }
        } catch (e) {
            /* silent */
        }
    }, [runName]);

    // Persist sidebar panel states
    useEffect(() => {
        try {
            localStorage.setItem('praxis_backtest_left_open', String(isLeftOpen));
        } catch (e) {
            /* silent */
        }
    }, [isLeftOpen]);

    useEffect(() => {
        try {
            localStorage.setItem('praxis_backtest_right_open', String(isRightOpen));
        } catch (e) {
            /* silent */
        }
    }, [isRightOpen]);

    // Simulation Results State
    const [simulationResult, setSimulationResult] = useState(null);
    const [appliedNotice, setAppliedNotice] = useState(null);

    // Historical Saved Runs State for Comparison
    const [savedRuns, setSavedRuns] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('praxis_backtest_runs') || '[]');
        } catch (e) {
            return [];
        }
    });

    const handleSaveRun = useCallback((newRun) => {
        try {
            const pastRuns = JSON.parse(localStorage.getItem('praxis_backtest_runs') || '[]');
            const filtered = pastRuns.filter(r => r.id !== newRun.id);
            const updated = [newRun, ...filtered.slice(0, 19)];
            localStorage.setItem('praxis_backtest_runs', JSON.stringify(updated));
            setSavedRuns(updated);
        } catch (e) {
            console.error('Failed to save run to localStorage', e);
        }
    }, []);

    const handleDeleteRun = useCallback((id) => {
        try {
            const pastRuns = JSON.parse(localStorage.getItem('praxis_backtest_runs') || '[]');
            const updated = pastRuns.filter(r => r.id !== id);
            localStorage.setItem('praxis_backtest_runs', JSON.stringify(updated));
            setSavedRuns(updated);
        } catch (e) {
            console.error('Failed to delete run', e);
        }
    }, []);

    const handleClearRuns = useCallback(() => {
        try {
            localStorage.removeItem('praxis_backtest_runs');
            setSavedRuns([]);
        } catch (e) {
            console.error('Failed to clear runs', e);
        }
    }, []);

    const handleRestoreRunConfig = useCallback((savedConfig, savedName) => {
        if (savedConfig) {
            setConfig(prev => ({
                ...prev,
                ...savedConfig
            }));
        }
        if (savedName) {
            setRunName(savedName);
        }
    }, []);

    const handleApplyCalibration = useCallback((calibratedConfig, calibName) => {
        if (!calibratedConfig) return;

        // 1. Update active config & run name
        setConfig(calibratedConfig);
        const name = calibName || `Calibrated: ${calibratedConfig.unit}`;
        setRunName(name);

        // 2. Immediately execute backtest with new calibrated parameters
        if (candles && candles.length >= 30) {
            const result = runBacktest(candles, calibratedConfig);
            setSimulationResult(result);

            // 3. Persist calibrated setup to run history
            try {
                const newRun = {
                    id: Date.now().toString(),
                    name,
                    unit: calibratedConfig.unit,
                    instrument: calibratedConfig.instrument,
                    timeframe: calibratedConfig.timeframe,
                    summary: result.summary,
                    config: JSON.parse(JSON.stringify(calibratedConfig)),
                    timestamp: Date.now(),
                };
                handleSaveRun(newRun);
            } catch (e) {
                console.error('Failed to save calibrated run to history', e);
            }

            // 4. Trigger visual feedback toast
            setAppliedNotice({
                name,
                winRate: result.summary?.winRate ?? 0,
                profitFactor: result.summary?.profitFactor ?? 0,
                totalTrades: result.summary?.totalTrades ?? 0,
                targetPct: calibratedConfig.exitRule?.targetPct,
                stopPct: calibratedConfig.exitRule?.stopPct,
                horizonBars: calibratedConfig.exitRule?.horizonBars,
            });

            setTimeout(() => {
                setAppliedNotice(null);
            }, 6000);
        }
    }, [candles, handleSaveRun]);

    const handlePlugLeakDirectly = useCallback(() => {
        const pluggedConfig = {
            ...config,
            exitRule: {
                ...config.exitRule,
                type: 'TARGET_STOP',
                enableHorizonTimeout: false, // Disables premature timeout completely
            }
        };

        setConfig(pluggedConfig);
        const name = `Plugged: ${config.unit} (Pure Target/Stop)`;
        setRunName(name);

        if (candles && candles.length >= 30) {
            const result = runBacktest(candles, pluggedConfig);
            setSimulationResult(result);

            try {
                const newRun = {
                    id: Date.now().toString(),
                    name,
                    unit: pluggedConfig.unit,
                    instrument: pluggedConfig.instrument,
                    timeframe: pluggedConfig.timeframe,
                    summary: result.summary,
                    config: JSON.parse(JSON.stringify(pluggedConfig)),
                    timestamp: Date.now(),
                };
                handleSaveRun(newRun);
            } catch (e) {
                /* silent */
            }

            setAppliedNotice({
                name: 'Edge Leak Successfully Plugged',
                winRate: result.summary?.winRate ?? 0,
                profitFactor: result.summary?.profitFactor ?? 0,
                totalTrades: result.summary?.totalTrades ?? 0,
                targetPct: pluggedConfig.exitRule?.targetPct,
                stopPct: pluggedConfig.exitRule?.stopPct,
            });

            setTimeout(() => {
                setAppliedNotice(null);
            }, 6000);
        }
    }, [config, candles, handleSaveRun]);

    // ── 1. Fetch Historical Candles on Instrument / Timeframe / DateRange Change ──
    const fetchHistoricalData = useCallback(async (inst, tf, dateRange = 'SINCE_2010') => {
        setLoadingCandles(true);
        setFetchError(null);
        try {
            let fromDate = null;
            if (tf === 'day') {
                if (dateRange === 'SINCE_2010') fromDate = '2010-01-01';
                else if (dateRange === 'SINCE_2015') fromDate = '2015-01-01';
                else if (dateRange === 'SINCE_2020') fromDate = '2020-01-01';
                else if (dateRange === 'ALL_TIME') fromDate = '2000-01-01';
                else if (dateRange === 'LAST_2_YEARS' || dateRange === '2Y') {
                    const d = new Date();
                    d.setFullYear(d.getFullYear() - 2);
                    fromDate = d.toISOString().split('T')[0];
                }
            }

            const res = await axiosInstance.get('/api/v1/upstox/candles', {
                params: {
                    instrument: inst,
                    timeframe: tf,
                    fromDate,
                    limit: 25000,
                },
            });

            if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                setCandles(res.data.data);
                setFetchError(null);
                return res.data.data;
            } else {
                setCandles([]);
                setSimulationResult(null);
                setFetchError(`No real historical candle data available for ${inst} (${tf}). Click below to sync from Upstox API.`);
                return [];
            }
        } catch (err) {
            console.error('[Backtest] Upstox candle fetch failed:', err.message);
            setCandles([]);
            setSimulationResult(null);
            setFetchError(`Failed to fetch real market data: ${err.message}. Ensure backend is connected to Upstox API.`);
            return [];
        } finally {
            setLoadingCandles(false);
        }
    }, []);

    useEffect(() => {
        // Clear stale results immediately so the UI reflects the new selection
        setSimulationResult(null);
        fetchHistoricalData(config.instrument, config.timeframe, config.dateRange).then((data) => {
            if (data && data.length > 0) {
                // Auto-run baseline backtest on first load or instrument/timeframe/dateRange change
                const res = runBacktest(data, config);
                setSimulationResult(res);
            }
            // If data is empty, simulationResult stays null → scorecard shows empty state
        });
    }, [config.instrument, config.timeframe, config.dateRange]);

    // Auto-update simulation when configuration parameters change
    useEffect(() => {
        if (!candles || candles.length < 30) return;
        const res = runBacktest(candles, config);
        setSimulationResult(res);
    }, [
        candles,
        config.unit,
        config.mode,
        config.selectedPattern,
        config.patternThreshold,
        config.pncoThreshold,
        config.customRules,
        config.exitRule,
        config.slippageModel,
        config.sizingModel,
        config.walkForward,
        config.initialCapital,
        config.positionSizePct,
        config.costModel,
    ]);

    // ── 2. Run Backtest Simulation Handler ───────────────────────────────────
    const handleRunBacktest = useCallback(() => {
        if (!candles || candles.length < 30) return;
        setIsRunning(true);

        setTimeout(() => {
            const result = runBacktest(candles, config);
            setSimulationResult(result);
            setIsRunning(false);

            // Persist run to local storage for quick comparisons
            try {
                const newRun = {
                    id: Date.now().toString(),
                    name: runName || `${config.unit} Run`,
                    unit: config.unit,
                    instrument: config.instrument,
                    timeframe: config.timeframe,
                    summary: result.summary,
                    config: JSON.parse(JSON.stringify(config)),
                    timestamp: Date.now(),
                };
                handleSaveRun(newRun);
            } catch (e) {
                /* silent */
            }
        }, 150);
    }, [candles, config, runName, handleSaveRun]);

    // Global keyboard shortcut: Ctrl+Enter (or Cmd+Enter) to trigger simulation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleRunBacktest();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleRunBacktest]);

    const instrumentLabel = useMemo(() => {
        const all = [...(FO_INDICES || []), ...(FO_EQUITIES || [])];
        const match = all.find(i => i.value === config.instrument);
        if (match) return match.label;
        return config.instrument.includes('|') ? config.instrument.split('|')[1] : config.instrument;
    }, [config.instrument]);

    const dateSpan = useMemo(() => {
        if (!candles || candles.length < 2) return null;
        const start = typeof candles[0].time === 'string' ? candles[0].time.slice(0, 4) : new Date(candles[0].time * 1000).getFullYear();
        const end = typeof candles[candles.length - 1].time === 'string' ? candles[candles.length - 1].time.slice(0, 4) : new Date(candles[candles.length - 1].time * 1000).getFullYear();
        return `${start}–${end} (${candles.length.toLocaleString()} bars)`;
    }, [candles]);

    return (
        <div className="w-full max-w-[100vw] h-screen flex flex-col bg-background-app text-text-primary overflow-x-hidden overflow-y-hidden font-sans select-none">
            {/* 1. Header Shell */}
            <BacktestHeader
                instrumentLabel={instrumentLabel}
                timeframe={config.timeframe}
                tradingMode={config.mode}
                walkForwardEnabled={config.walkForward?.enabled}
                activeUnit={config.unit}
                dateSpan={dateSpan}
                onExit={() => navigate('/dashboard/home')}
                isSimulating={isRunning}
                isLeftOpen={isLeftOpen}
                isRightOpen={isRightOpen}
                onToggleLeft={() => setIsLeftOpen(prev => !prev)}
                onToggleRight={() => setIsRightOpen(prev => !prev)}
            />

            {/* Floating Toast Notification when Calibration is Applied */}
            {appliedNotice && (
                <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-background-card/95 border border-emerald-500/50 text-text-primary shadow-2xl shadow-emerald-950/40 backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <Check size={18} />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black tracking-wide text-text-primary">
                                {appliedNotice.name}
                            </span>
                            <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-emerald-500 text-black rounded">
                                NEW RUN SAVED
                            </span>
                        </div>
                        <div className="text-[11px] font-mono text-text-secondary flex items-center gap-2 mt-0.5">
                            {appliedNotice.targetPct !== undefined && <span>Target: {appliedNotice.targetPct}%</span>}
                            {appliedNotice.stopPct !== undefined && (
                                <>
                                    <span>•</span>
                                    <span>Stop: {appliedNotice.stopPct}%</span>
                                </>
                            )}
                            {appliedNotice.horizonBars && (
                                <>
                                    <span>•</span>
                                    <span>Horizon: {appliedNotice.horizonBars}b</span>
                                </>
                            )}
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">Win Rate: {appliedNotice.winRate}%</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">PF: {appliedNotice.profitFactor}</span>
                            <span>•</span>
                            <span className="text-text-tertiary">({appliedNotice.totalTrades} Trades)</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAppliedNotice(null)}
                        className="ml-2 p-1 rounded hover:bg-background-surface text-text-muted hover:text-text-primary transition cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* 2. Middle Main Workspace (Left Config, Center Chart, Right Scorecard) */}
            <div className="flex-1 min-w-0 max-w-full w-full flex overflow-hidden relative">
                {/* Left: Configuration Panel */}
                <BacktestConfigPanel
                    config={config}
                    onChangeConfig={setConfig}
                    onRunBacktest={handleRunBacktest}
                    isRunning={isRunning}
                    runName={runName}
                    setRunName={setRunName}
                    onOpenOptimizer={() => setIsOptimizerOpen(true)}
                    isOpen={isLeftOpen}
                />

                {/* Center: Replay Chart or Loading / Error State */}
                {loadingCandles ? (
                    <div className="flex-1 min-w-0 flex flex-col items-center justify-center bg-background-app gap-4">
                        <Loader size="md" color="indigo" />
                        <div className="text-center">
                            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">
                                Streaming Real Historical Candles
                            </h3>
                            <p className="text-xs text-text-tertiary mt-1">
                                Loading authentic market data for <span className="text-accent-primary font-bold">{instrumentLabel}</span> ({config.timeframe})
                            </p>
                        </div>
                    </div>
                ) : fetchError ? (
                    <div className="flex-1 min-w-0 flex flex-col items-center justify-center bg-background-app p-8">
                        <div className="max-w-md w-full bg-background-card border border-rose-500/30 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                                <Database size={24} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-text-primary">No Real Historical Candles</h3>
                                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">{fetchError}</p>
                            </div>
                            <button
                                onClick={() => fetchHistoricalData(config.instrument, config.timeframe, config.dateRange)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/25 active:scale-95 cursor-pointer"
                            >
                                <RefreshCw size={13} />
                                <span>Sync Real Data from Upstox</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <BacktestReplayChart
                        candles={candles}
                        trades={simulationResult?.trades || []}
                        indicators={simulationResult?.indicators || {}}
                        activeUnit={config.unit}
                        theme={theme}
                    />
                )}

                {/* Right: Live Scorecard */}
                <BacktestScorecard
                    summary={simulationResult?.summary || {}}
                    calibration={simulationResult?.calibration || []}
                    walkForward={simulationResult?.walkForward || null}
                    trades={simulationResult?.trades || []}
                    activeUnit={config.unit}
                    savedRuns={savedRuns}
                    onRestoreRun={handleRestoreRunConfig}
                    onDeleteRun={handleDeleteRun}
                    onClearRuns={handleClearRuns}
                    onOpenOptimizer={() => setIsOptimizerOpen(true)}
                    onPlugLeakNow={handlePlugLeakDirectly}
                    isOpen={isRightOpen}
                />
            </div>

            {/* 3. Bottom Equity Curve Strip */}
            <BacktestEquityCurve
                equityCurve={simulationResult?.equityCurve || []}
                initialCapital={config.initialCapital}
                endingCapital={simulationResult?.summary?.endingCapital || config.initialCapital}
                maxDrawdownPct={simulationResult?.summary?.maxDrawdownPct || 0}
            />

            {/* 4. Auto-Calibration & Parameter Optimization Studio Modal */}
            <BacktestOptimizerModal
                isOpen={isOptimizerOpen}
                onClose={() => setIsOptimizerOpen(false)}
                candles={candles}
                activeConfig={config}
                instrumentLabel={instrumentLabel}
                onApplyCalibration={handleApplyCalibration}
            />
        </div>
    );
}
