/**
 * @file BacktestReplayChart.jsx
 * @purpose Interactive Replay Candlestick Chart powered by Lightweight Charts with play/pause, speed controls, step-forward, trade execution markers, and indicator overlays.
 * @date 2026-09-12
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, createSeriesMarkers } from 'lightweight-charts';
import { 
    Play, Pause, FastForward, SkipForward, RotateCcw, 
    Layers, TrendingUp, Info, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, X
} from 'lucide-react';

const getTimeMs = (t) => {
    if (!t) return 0;
    if (typeof t === 'number') return t * 1000;
    const parsed = new Date(t).getTime();
    return isNaN(parsed) ? 0 : parsed;
};

const formatCandleTime = (t) => {
    if (!t) return '';
    if (typeof t === 'string') return t;
    const d = new Date(t * 1000);
    return isNaN(d.getTime()) ? String(t) : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function BacktestReplayChart({
    candles = [],
    trades = [],
    indicators = {},
    activeUnit = 'PREDICTOR',
    theme = 'dark',
}) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const candleSeriesRef = useRef(null);
    const markersPluginRef = useRef(null);

    // Indicator series refs
    const aavbUpRef = useRef(null);
    const aavbMidRef = useRef(null);
    const aavbLowRef = useRef(null);
    const oscSeriesRef = useRef(null);
    const oscZeroRef = useRef(null);

    // Replay State
    const [isPlaying, setIsPlaying] = useState(false);
    const [replayIndex, setReplayIndex] = useState(0);
    const [replaySpeed, setReplaySpeed] = useState(2); // 1x, 2x, 5x, 10x, 20x
    const [selectedTrade, setSelectedTrade] = useState(null);

    const isLight = theme === 'light';

    // Initialize replay index when candles change
    useEffect(() => {
        if (candles && candles.length > 0) {
            setReplayIndex(candles.length - 1);
            setIsPlaying(false);
        }
    }, [candles]);

    // ── 1. Create Lightweight Chart ──────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;

        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight || 500,
            layout: {
                background: { color: isLight ? '#f8fafc' : '#090d16' },
                textColor: isLight ? '#475569' : '#94a3b8',
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
            },
            grid: {
                vertLines: { color: isLight ? '#e2e8f0' : '#141c2e' },
                horzLines: { color: isLight ? '#e2e8f0' : '#141c2e' },
            },
            crosshair: {
                mode: 1,
                vertLine: { color: '#6366f1', width: 1, style: 2 },
                horzLine: { color: '#6366f1', width: 1, style: 2 },
            },
            rightPriceScale: {
                borderColor: isLight ? '#cbd5e1' : '#1e293b',
                scaleMargins: { top: 0.08, bottom: 0.12 },
            },
            leftPriceScale: {
                borderColor: isLight ? '#cbd5e1' : '#1e293b',
                visible: false,
                scaleMargins: { top: 0.74, bottom: 0.02 },
            },
            timeScale: {
                borderColor: isLight ? '#cbd5e1' : '#1e293b',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        chartRef.current = chart;

        // Candlestick Series
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10b981',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });
        candleSeriesRef.current = candleSeries;

        // Initialize Markers Plugin
        markersPluginRef.current = createSeriesMarkers(candleSeries, []);

        // AAVB Overlay Lines
        aavbUpRef.current = chart.addSeries(LineSeries, {
            color: '#38bdf8',
            lineWidth: 1,
            lineStyle: 2,
            lastValueVisible: false,
            priceLineVisible: false,
        });
        aavbMidRef.current = chart.addSeries(LineSeries, {
            color: '#818cf8',
            lineWidth: 1,
            lineStyle: 0,
            lastValueVisible: false,
            priceLineVisible: false,
        });
        aavbLowRef.current = chart.addSeries(LineSeries, {
            color: '#38bdf8',
            lineWidth: 1,
            lineStyle: 2,
            lastValueVisible: false,
            priceLineVisible: false,
        });

        // Dedicated Lower Sub-Indicator (Oscillator / Flow) on 'left' scale
        oscSeriesRef.current = chart.addSeries(LineSeries, {
            color: '#a855f7',
            lineWidth: 2,
            priceScaleId: 'left',
            lastValueVisible: true,
            priceLineVisible: false,
        });

        // Zero baseline for oscillator
        oscZeroRef.current = chart.addSeries(LineSeries, {
            color: isLight ? '#cbd5e1' : '#334155',
            lineWidth: 1,
            lineStyle: 2,
            priceScaleId: 'left',
            lastValueVisible: false,
            priceLineVisible: false,
        });

        // Resize Observer
        const resizeObserver = new ResizeObserver((entries) => {
            if (!entries || !entries[0]) return;
            const { width, height } = entries[0].contentRect;
            chart.applyOptions({ width, height: height || 500 });
        });
        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
            chartRef.current = null;
        };
    }, [isLight]);

    // ── 2. Update Visible Data on Replay Index Change ────────────────────────
    useEffect(() => {
        if (!candleSeriesRef.current || !candles.length || !chartRef.current) return;

        const visibleCandles = candles.slice(0, replayIndex + 1);
        candleSeriesRef.current.setData(visibleCandles);

        const visibleTimes = new Set(visibleCandles.map(c => c.time));

        // 1. AAVB Bands: ONLY render for AAVB, HEAD_TO_HEAD, or CUSTOM_COMBO
        const showAavb = ['AAVB', 'HEAD_TO_HEAD', 'CUSTOM_COMBO'].includes(activeUnit);
        if (showAavb && indicators?.aavb) {
            const up = (indicators.aavb.upper || []).filter(d => visibleTimes.has(d.time));
            const mid = (indicators.aavb.middle || []).filter(d => visibleTimes.has(d.time));
            const low = (indicators.aavb.lower || []).filter(d => visibleTimes.has(d.time));

            aavbUpRef.current?.setData(up);
            aavbMidRef.current?.setData(mid);
            aavbLowRef.current?.setData(low);
        } else {
            // Strictly clear bands when not testing AAVB — not even a dot without purpose!
            aavbUpRef.current?.setData([]);
            aavbMidRef.current?.setData([]);
            aavbLowRef.current?.setData([]);
        }

        // 2. Dedicated Lower Sub-Indicator (Oscillator / Flow)
        const hasCustomLab = Boolean(indicators?.customLab && Array.isArray(indicators.customLab) && indicators.customLab.length > 0);
        const showOsc = ['PNCO', 'IFDI', 'HEAD_TO_HEAD', 'CUSTOM_LAB'].includes(activeUnit) || hasCustomLab;
        if (showOsc) {
            chartRef.current.priceScale('right').applyOptions({
                scaleMargins: { top: 0.05, bottom: 0.28 },
            });
            chartRef.current.priceScale('left').applyOptions({
                visible: true,
                scaleMargins: { top: 0.74, bottom: 0.02 },
            });

            // Zero baseline
            const zeroData = visibleCandles.map(c => ({ time: c.time, value: 0 }));
            oscZeroRef.current?.setData(zeroData);

            if (activeUnit === 'PNCO' || activeUnit === 'HEAD_TO_HEAD') {
                oscSeriesRef.current?.applyOptions({ color: '#a855f7' });
                const oscData = (indicators?.pnco || [])
                    .map(p => ({ time: p.time, value: p.value }))
                    .filter(d => visibleTimes.has(d.time));
                oscSeriesRef.current?.setData(oscData);
            } else if (activeUnit === 'IFDI') {
                oscSeriesRef.current?.applyOptions({ color: '#10b981' });
                const ifdiData = (indicators?.ifdi || [])
                    .map(p => ({ time: p.time, value: p.value }))
                    .filter(d => visibleTimes.has(d.time));
                oscSeriesRef.current?.setData(ifdiData);
            } else if (hasCustomLab) {
                oscSeriesRef.current?.applyOptions({ color: '#f97316' });
                const labData = (indicators.customLab || [])
                    .map(p => ({ time: p.time, value: typeof p === 'object' ? (p.value ?? p.val ?? 0) : Number(p) }))
                    .filter(d => visibleTimes.has(d.time));
                oscSeriesRef.current?.setData(labData);
            }
        } else {
            // Full height candles when no sub-oscillator is active
            chartRef.current.priceScale('right').applyOptions({
                scaleMargins: { top: 0.08, bottom: 0.12 },
            });
            chartRef.current.priceScale('left').applyOptions({
                visible: false,
            });
            oscZeroRef.current?.setData([]);
            oscSeriesRef.current?.setData([]);
        }

        // 3. Trade Execution Markers
        if (markersPluginRef.current && trades) {
            const markers = [];
            trades.forEach(t => {
                if (t.entryBarIndex <= replayIndex) {
                    markers.push({
                        time: t.entryTime,
                        position: t.direction === 1 ? 'belowBar' : 'aboveBar',
                        color: t.direction === 1 ? '#10b981' : '#f43f5e',
                        shape: t.direction === 1 ? 'arrowUp' : 'arrowDown',
                        text: `${t.direction === 1 ? 'BUY' : 'SELL'} @ ₹${Number(t.entryPrice).toLocaleString('en-IN')}`,
                        id: `${t.id}_entry`,
                    });
                }
                if (t.exitBarIndex !== undefined && t.exitBarIndex <= replayIndex) {
                    const isWin = t.outcome === 'WIN';
                    markers.push({
                        time: t.exitTime,
                        position: t.direction === 1 ? 'aboveBar' : 'belowBar',
                        color: isWin ? '#34d399' : '#fb7171',
                        shape: 'circle',
                        text: `${isWin ? '+' : ''}${t.returnPct}%`,
                        id: `${t.id}_exit`,
                    });
                }
            });

            // Universal strict chronological sort (handles both string and number dates)
            markers.sort((a, b) => {
                const diff = getTimeMs(a.time) - getTimeMs(b.time);
                if (diff !== 0) return diff;
                return a.id.localeCompare(b.id);
            });

            markersPluginRef.current.setMarkers(markers);
        }
    }, [replayIndex, candles, trades, indicators, activeUnit]);

    // ── 3. Replay Timer Loop ────────────────────────────────────────────────
    useEffect(() => {
        if (!isPlaying) return;

        const intervalMs = Math.max(50, Math.floor(1000 / replaySpeed));
        const timer = setInterval(() => {
            setReplayIndex(prev => {
                if (prev >= candles.length - 1) {
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, intervalMs);

        return () => clearInterval(timer);
    }, [isPlaying, replaySpeed, candles.length]);

    // ── 4. Replay Control Actions ───────────────────────────────────────────
    const handleStepForward = () => {
        setIsPlaying(false);
        setReplayIndex(prev => Math.min(candles.length - 1, prev + 1));
    };

    const handleJumpToNextSignal = () => {
        setIsPlaying(false);
        const nextTrade = trades.find(t => t.entryBarIndex > replayIndex);
        if (nextTrade) {
            setReplayIndex(nextTrade.entryBarIndex);
            setSelectedTrade(nextTrade);
        } else {
            setReplayIndex(candles.length - 1);
        }
    };

    const handleReset = () => {
        setIsPlaying(false);
        setReplayIndex(25); // Start at minimum lookback
    };

    return (
        <section className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-background-app relative">
            {/* Chart Container */}
            <div ref={containerRef} className="flex-1 w-full h-full relative" />

            {/* Real Data & Active Strategy Status Badge */}
            <div className="absolute top-3 left-4 z-20 pointer-events-none flex flex-wrap items-center gap-2">
                <div className="bg-background-card/90 backdrop-blur-md border border-border-subtle px-2.5 py-1 rounded-lg flex items-center gap-2 text-xs font-mono shadow-md">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        REAL DATA
                    </span>
                    <span className="text-border-subtle">|</span>
                    <span className="text-text-primary font-semibold">
                        {activeUnit === 'PREDICTOR' && 'AI 7-Candle Directional Calibration'}
                        {activeUnit === 'PATTERNS' && 'Pattern Recognition Edge'}
                        {activeUnit === 'COMPOSITE_SCORE' && 'Composite Sentiment Thresholds'}
                        {activeUnit === 'PNCO' && 'PNCO Neural Momentum & Trap Oscillator'}
                        {activeUnit === 'AAVB' && 'AAVB Adaptive Volatility Bands'}
                        {activeUnit === 'IFDI' && 'IFDI Institutional Flow Divergence'}
                        {activeUnit === 'HEAD_TO_HEAD' && 'Tri-Factor Confluence Benchmark'}
                        {activeUnit === 'CUSTOM_COMBO' && 'Custom Multi-Factor Strategy'}
                    </span>
                    {candles[replayIndex] && (
                        <>
                            <span className="text-border-subtle">|</span>
                            <span className="text-text-tertiary">
                                C: <strong className="text-text-primary">₹{Number(candles[replayIndex].close).toLocaleString('en-IN')}</strong>
                            </span>
                            <span className="text-text-tertiary">
                                {formatCandleTime(candles[replayIndex].time)}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Execution Inspector Modal (when clicking a signal or inspecting next) */}
            {selectedTrade && (
                <div className="absolute top-4 left-4 z-40 bg-background-card/95 backdrop-blur-md border border-border-default rounded-xl p-3.5 shadow-2xl w-[260px] text-xs">
                    <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-2">
                        <div className="flex items-center gap-1.5 font-bold">
                            {selectedTrade.direction === 1 ? (
                                <span className="text-emerald-400 font-mono">LONG POSITION</span>
                            ) : (
                                <span className="text-rose-400 font-mono">SHORT POSITION</span>
                            )}
                            <span className="text-[10px] text-text-tertiary">({selectedTrade.unit})</span>
                        </div>
                        <button
                            onClick={() => setSelectedTrade(null)}
                            className="text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
                        >
                            <X size={13} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between">
                            <span className="text-text-tertiary">Signal:</span>
                            <span className="font-semibold text-text-primary truncate max-w-[150px]">{selectedTrade.sourceDetail}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-tertiary">Entry Price:</span>
                            <span className="font-mono text-text-primary">₹{Number(selectedTrade.entryPrice).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-tertiary">Exit Price:</span>
                            <span className="font-mono text-text-primary">
                                {typeof selectedTrade.exitPrice === 'number' ? `₹${selectedTrade.exitPrice.toLocaleString('en-IN')}` : (selectedTrade.exitPrice || 'Active')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-tertiary">Realized Return:</span>
                            <span className={`font-bold font-mono ${
                                selectedTrade.returnPct > 0 ? 'text-emerald-400' : selectedTrade.returnPct < 0 ? 'text-rose-400' : 'text-slate-400'
                            }`}>
                                {selectedTrade.returnPct > 0 ? '+' : ''}{selectedTrade.returnPct}%
                            </span>
                        </div>
                        {selectedTrade.realizedPnl !== undefined && (
                            <div className="flex justify-between">
                                <span className="text-text-tertiary">Realized PnL:</span>
                                <span className={`font-bold font-mono ${
                                    selectedTrade.realizedPnl > 0 ? 'text-emerald-400' : selectedTrade.realizedPnl < 0 ? 'text-rose-400' : 'text-slate-400'
                                }`}>
                                    {selectedTrade.realizedPnl >= 0 ? '+' : ''}₹{selectedTrade.realizedPnl.toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-text-tertiary">Exit Reason:</span>
                            <span className="font-medium text-text-secondary uppercase text-[10px]">{selectedTrade.exitReason}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-tertiary">Bars Held:</span>
                            <span className="font-mono text-text-secondary">{selectedTrade.barsHeld} candles</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Replay Control Bar */}
            <div className="h-[52px] w-full max-w-full bg-background-card/95 backdrop-blur-md border-t border-border-subtle px-3 flex items-center justify-between gap-2 z-20 select-none overflow-x-auto no-scrollbar">
                {/* Left: Playback Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            isPlaying
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                : 'bg-accent-primary text-white shadow-md shadow-accent-primary/20'
                        }`}
                        title={isPlaying ? 'Pause Replay' : 'Start Replay'}
                    >
                        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    </button>

                    <button
                        onClick={handleStepForward}
                        className="w-8 h-8 rounded-lg bg-background-surface hover:bg-background-surface/80 border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition cursor-pointer"
                        title="Step Forward 1 Candle"
                    >
                        <SkipForward size={14} />
                    </button>

                    <button
                        onClick={handleJumpToNextSignal}
                        className="px-2.5 h-8 rounded-lg bg-background-surface hover:bg-background-surface/80 border border-border-subtle flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary font-medium transition cursor-pointer"
                        title="Jump to Next Signal"
                    >
                        <FastForward size={13} />
                        <span className="hidden sm:inline">Next Signal</span>
                    </button>

                    <button
                        onClick={handleReset}
                        className="w-8 h-8 rounded-lg bg-background-surface hover:bg-background-surface/80 border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition cursor-pointer"
                        title="Reset Replay to Start"
                    >
                        <RotateCcw size={13} />
                    </button>
                </div>

                {/* Center: Timeline Scrubber */}
                <div className="flex-1 min-w-[120px] max-w-[420px] mx-2 flex items-center gap-2">
                    <span className="text-[10px] font-mono text-text-tertiary">
                        {replayIndex + 1}/{candles.length}
                    </span>
                    <input
                        type="range"
                        min="20"
                        max={Math.max(20, candles.length - 1)}
                        value={replayIndex}
                        onChange={(e) => {
                            setIsPlaying(false);
                            setReplayIndex(Number(e.target.value));
                        }}
                        className="flex-1 accent-accent-primary cursor-pointer h-1.5 bg-background-surface rounded-lg"
                    />
                    <span className="text-[10px] font-mono text-text-secondary min-w-[85px] text-right">
                        {formatCandleTime(candles[replayIndex]?.time)}
                    </span>
                </div>

                {/* Right: Replay Speed Controls */}
                <div className="flex items-center gap-1 bg-background-surface p-1 rounded-lg border border-border-subtle">
                    {[1, 2, 5, 10, 20].map((speed) => (
                        <button
                            key={speed}
                            onClick={() => setReplaySpeed(speed)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                                replaySpeed === speed
                                    ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                                    : 'text-text-tertiary hover:text-text-primary border border-transparent'
                            }`}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
